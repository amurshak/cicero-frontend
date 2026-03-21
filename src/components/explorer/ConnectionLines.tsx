import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ProvisionPoint, CrossReference, LayoutMode } from '@/types/provision'
import { useExplorerStore } from '@/stores/explorerStore'

interface ConnectionLinesProps {
  provisions: ProvisionPoint[]
  connections: CrossReference[]
  positions: Record<LayoutMode, Float32Array>
  currentPositions: React.RefObject<Float32Array>
  maxConnections?: number
}

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aIsoDim;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIsoDim;

  void main() {
    vColor = aColor;
    vIsoDim = aIsoDim;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Fade with distance
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(350.0, 8.0, dist) * 0.35;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIsoDim;

  void main() {
    float alpha = vAlpha * mix(0.0, 1.0, vIsoDim);
    gl_FragColor = vec4(vColor * 1.4 * vIsoDim, alpha);
  }
`

export function ConnectionLines({
  provisions,
  connections,
  currentPositions,
  maxConnections = 1500,
}: ConnectionLinesProps) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const isolatedIndex = useExplorerStore((s) => s.isolatedIndex)
  const isolatedNeighbors = useExplorerStore((s) => s.isolatedNeighbors)

  // Build index mapping: citation -> provision index
  const { colors, connIndices } = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < provisions.length; i++) {
      map.set(provisions[i].citation, i)
    }

    const lim = connections.slice(0, maxConnections)

    // Pre-compute colors and store resolved indices for isolation checks
    const col = new Float32Array(lim.length * 6)
    const indices: [number, number][] = []
    let validCount = 0
    for (const conn of lim) {
      const si = map.get(conn.sourceCitation)
      const ti = map.get(conn.targetCitation)
      if (si === undefined || ti === undefined) continue

      indices.push([si, ti])

      const isCross = provisions[si].clusterId !== provisions[ti].clusterId
      // Cool monochrome palette — cross-cluster lines are brighter cyan-white
      const r = isCross ? 0.45 : 0.25
      const g = isCross ? 0.65 : 0.50
      const b = isCross ? 0.90 : 0.85

      const c = validCount * 6
      col[c] = r; col[c + 1] = g; col[c + 2] = b
      col[c + 3] = r; col[c + 4] = g; col[c + 5] = b
      validCount++
    }

    return {
      colors: col.slice(0, validCount * 6),
      connIndices: indices,
    }
  }, [provisions, connections, maxConnections])

  // Update line positions every frame to follow animated point positions
  const linePositions = useRef(new Float32Array(colors.length))
  const lineIsoDim = useRef(new Float32Array(connIndices.length * 2))
  const lineIsoDimTarget = useRef(new Float32Array(connIndices.length * 2))

  // Ensure buffers are right size when connIndices changes
  if (lineIsoDim.current.length !== connIndices.length * 2) {
    lineIsoDim.current = new Float32Array(connIndices.length * 2)
    lineIsoDim.current.fill(1.0)
    lineIsoDimTarget.current = new Float32Array(connIndices.length * 2)
    lineIsoDimTarget.current.fill(1.0)
  }

  useFrame((_state, delta) => {
    if (!geometryRef.current || !currentPositions.current) return

    const pos = currentPositions.current
    const out = linePositions.current
    const isoTarget = lineIsoDimTarget.current
    const isoCur = lineIsoDim.current

    // Compute isolation targets and update positions
    for (let i = 0; i < connIndices.length; i++) {
      const [si, ti] = connIndices[i]

      // Positions
      const idx = i * 6
      out[idx] = pos[si * 3]
      out[idx + 1] = pos[si * 3 + 1]
      out[idx + 2] = pos[si * 3 + 2]
      out[idx + 3] = pos[ti * 3]
      out[idx + 4] = pos[ti * 3 + 1]
      out[idx + 5] = pos[ti * 3 + 2]

      // Isolation: connection visible only if it involves the isolated node
      const vi = i * 2
      if (isolatedIndex !== null && isolatedNeighbors) {
        const visible = (si === isolatedIndex || ti === isolatedIndex) ? 1.0 : 0.0
        isoTarget[vi] = visible
        isoTarget[vi + 1] = visible
      } else {
        isoTarget[vi] = 1.0
        isoTarget[vi + 1] = 1.0
      }
    }

    // Smooth lerp isolation dim
    let isoNeedsUpdate = false
    const speed = delta * 5.0
    for (let i = 0; i < isoCur.length; i++) {
      if (Math.abs(isoCur[i] - isoTarget[i]) > 0.001) {
        isoCur[i] += (isoTarget[i] - isoCur[i]) * Math.min(1, speed)
        isoNeedsUpdate = true
      }
    }

    const posAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute
    posAttr.needsUpdate = true
    if (isoNeedsUpdate) {
      const isoAttr = geometryRef.current.getAttribute('aIsoDim') as THREE.BufferAttribute
      if (isoAttr) isoAttr.needsUpdate = true
    }
  })

  if (colors.length === 0) return null

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={colors.length / 3}
          array={linePositions.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aIsoDim"
          count={connIndices.length * 2}
          array={lineIsoDim.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{}}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  )
}
