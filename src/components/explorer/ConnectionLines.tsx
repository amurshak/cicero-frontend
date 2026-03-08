import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ProvisionPoint, CrossReference, LayoutMode } from '@/types/provision'

interface ConnectionLinesProps {
  provisions: ProvisionPoint[]
  connections: CrossReference[]
  positions: Record<LayoutMode, Float32Array>
  currentPositions: React.RefObject<Float32Array>
  maxConnections?: number
}

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Fade with distance
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(300.0, 10.0, dist) * 0.35;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor * 1.2, vAlpha);
  }
`

export function ConnectionLines({
  provisions,
  connections,
  currentPositions,
  maxConnections = 3000,
}: ConnectionLinesProps) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)

  // Build index mapping: citation -> provision index
  const { citationToIndex, colors, limited } = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < provisions.length; i++) {
      map.set(provisions[i].citation, i)
    }

    const lim = connections.slice(0, maxConnections)

    // Pre-compute colors (don't change with layout)
    const col = new Float32Array(lim.length * 6)
    let validCount = 0
    for (const conn of lim) {
      const si = map.get(conn.sourceCitation)
      const ti = map.get(conn.targetCitation)
      if (si === undefined || ti === undefined) continue

      const isCross = provisions[si].clusterId !== provisions[ti].clusterId
      const r = isCross ? 0.8 : 0.3
      const g = isCross ? 0.4 : 0.5
      const b = isCross ? 0.2 : 0.9

      const c = validCount * 6
      col[c] = r; col[c + 1] = g; col[c + 2] = b
      col[c + 3] = r; col[c + 4] = g; col[c + 5] = b
      validCount++
    }

    return {
      citationToIndex: map,
      colors: col.slice(0, validCount * 6),
      limited: lim,
    }
  }, [provisions, connections, maxConnections])

  // Update line positions every frame to follow animated point positions
  const linePositions = useRef(new Float32Array(colors.length))

  useFrame(() => {
    if (!geometryRef.current || !currentPositions.current) return

    const pos = currentPositions.current
    const out = linePositions.current
    let idx = 0

    for (const conn of limited) {
      const si = citationToIndex.get(conn.sourceCitation)
      const ti = citationToIndex.get(conn.targetCitation)
      if (si === undefined || ti === undefined) continue

      out[idx] = pos[si * 3]
      out[idx + 1] = pos[si * 3 + 1]
      out[idx + 2] = pos[si * 3 + 2]
      out[idx + 3] = pos[ti * 3]
      out[idx + 4] = pos[ti * 3 + 1]
      out[idx + 5] = pos[ti * 3 + 2]
      idx += 6
    }

    const attr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
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
