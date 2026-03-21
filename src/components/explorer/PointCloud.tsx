import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { ProvisionPoint, LayoutMode } from '@/types/provision'
import { useExplorerStore } from '@/stores/explorerStore'
import { FlyCamera } from './FlyCamera'

const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform int uHoveredIndex;

  attribute float aScale;
  attribute vec3 aColor;
  attribute float aIsoDim;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vHovered;
  varying float vIsoDim;

  void main() {
    vColor = aColor;
    vHovered = (gl_VertexID == uHoveredIndex) ? 1.0 : 0.0;
    vIsoDim = aIsoDim;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    float size = uSize * uPixelRatio * aScale;
    size *= (300.0 / -viewPosition.z);

    // Subtle pulse
    float pulse = 1.0 + 0.08 * sin(uTime * 0.5 + position.x * 0.3 + position.y * 0.2);
    size *= pulse;

    // Hovered point is larger
    if (vHovered > 0.5) {
      size *= 2.5;
    }

    // Dimmed nodes shrink slightly
    size *= mix(0.5, 1.0, aIsoDim);

    gl_PointSize = max(size, 1.0);

    float dist = length(viewPosition.xyz);
    vAlpha = smoothstep(500.0, 20.0, dist);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHovered;
  varying float vIsoDim;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));

    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    float strength = core * 0.8 + glow * 0.5;

    if (strength < 0.01) discard;

    vec3 color = vColor * 2.0;
    // White-hot center
    color = mix(color, vec3(1.8), core * 0.45);

    // Hovered: intense white flare
    if (vHovered > 0.5) {
      color = mix(color, vec3(3.5), core * 0.7);
    }

    // Isolation dimming — non-neighbor nodes fade to near-invisible
    float dimFactor = vIsoDim;
    color *= dimFactor;
    float alpha = strength * vAlpha * mix(0.08, 1.0, dimFactor);

    gl_FragColor = vec4(color, alpha);
  }
`

interface PointCloudProps {
  provisions: ProvisionPoint[]
  positions: Record<LayoutMode, Float32Array>
  /** Shared ref for animated positions — ConnectionLines reads this */
  currentPositions: React.RefObject<Float32Array>
  onHover?: (index: number | null, point: ProvisionPoint | null) => void
  onClick?: (index: number, point: ProvisionPoint) => void
  onMiss?: () => void
}

function parseColor(color: string): [number, number, number] {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    return [parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255]
  }
  const c = new THREE.Color(color)
  return [c.r, c.g, c.b]
}

// Smoother interpolation curve (ease in-out)
function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function PointCloud({ provisions, positions, currentPositions, onHover, onClick, onMiss }: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const { raycaster, pointer, camera } = useThree()

  const activeLayout = useExplorerStore((s) => s.activeLayout)
  const isolatedIndex = useExplorerStore((s) => s.isolatedIndex)
  const isolatedNeighbors = useExplorerStore((s) => s.isolatedNeighbors)

  // Use the shared ref for animated positions
  const currentPos = currentPositions as React.MutableRefObject<Float32Array>
  if (currentPos.current.length === 0) {
    currentPos.current = new Float32Array(positions[activeLayout])
  }
  const prevLayout = useRef<LayoutMode>(activeLayout)
  const sourcePos = useRef<Float32Array>(new Float32Array(positions[activeLayout]))
  const lerpProgress = useRef(1) // 1 = done

  const { colors, scales, isoDim } = useMemo(() => {
    const col = new Float32Array(provisions.length * 3)
    const scl = new Float32Array(provisions.length)
    const iso = new Float32Array(provisions.length)

    for (let i = 0; i < provisions.length; i++) {
      const [r, g, b] = parseColor(provisions[i].color)
      col[i * 3] = r
      col[i * 3 + 1] = g
      col[i * 3 + 2] = b
      scl[i] = 0.6 + ((i * 7 + 13) % 100) / 125
      iso[i] = 1.0 // fully visible by default
    }

    return { colors: col, scales: scl, isoDim: iso }
  }, [provisions])

  // Track animated isoDim values for smooth transitions
  const isoDimTarget = useRef<Float32Array>(new Float32Array(0))
  const isoDimCurrent = useRef<Float32Array>(isoDim)

  const uniforms = useMemo(
    () => ({
      uSize: { value: 4.0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uTime: { value: 0 },
      uHoveredIndex: { value: -1 },
    }),
    [],
  )

  // Raycasting for hover
  const hoveredRef = useRef<number | null>(null)

  const doRaycast = useCallback(() => {
    if (!pointsRef.current) return null

    raycaster.setFromCamera(pointer, camera)
    raycaster.params.Points = { threshold: 1.5 }

    const intersects = raycaster.intersectObject(pointsRef.current)
    return intersects.length > 0 ? intersects[0].index! : null
  }, [raycaster, pointer, camera])

  const handlePointerMove = useCallback(
    () => {
      const idx = doRaycast()

      if (idx !== null) {
        if (hoveredRef.current !== idx) {
          hoveredRef.current = idx
          if (materialRef.current) {
            materialRef.current.uniforms.uHoveredIndex.value = idx
          }
          onHover?.(idx, provisions[idx])
        }
      } else if (hoveredRef.current !== null) {
        hoveredRef.current = null
        if (materialRef.current) {
          materialRef.current.uniforms.uHoveredIndex.value = -1
        }
        onHover?.(null, null)
      }
    },
    [doRaycast, provisions, onHover],
  )

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (e.nativeEvent.button !== 0) return
      // Ignore if mouse was dragged (user was rotating the camera)
      if (FlyCamera.isDrag()) return
      const idx = doRaycast()
      if (idx !== null) {
        onClick?.(idx, provisions[idx])
      } else {
        onMiss?.()
      }
    },
    [doRaycast, provisions, onClick, onMiss],
  )

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }

    // Detect layout change → start transition
    if (activeLayout !== prevLayout.current) {
      sourcePos.current = new Float32Array(currentPos.current)
      prevLayout.current = activeLayout
      lerpProgress.current = 0
    }

    // Animate layout transition
    if (lerpProgress.current < 1) {
      lerpProgress.current = Math.min(1, lerpProgress.current + delta * 1.2)
      const t = smootherstep(lerpProgress.current)
      const target = positions[activeLayout]
      const source = sourcePos.current
      const cur = currentPos.current

      for (let i = 0; i < cur.length; i++) {
        cur[i] = source[i] + (target[i] - source[i]) * t
      }

      if (geometryRef.current) {
        const attr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute
        attr.needsUpdate = true
      }
    }

    // Animate isolation dimming
    if (geometryRef.current) {
      // Resize buffers if provisions changed (e.g. dummy → real data)
      if (isoDimTarget.current.length !== provisions.length) {
        isoDimTarget.current = new Float32Array(provisions.length)
        isoDimTarget.current.fill(1.0)
      }
      if (isoDimCurrent.current.length !== provisions.length) {
        isoDimCurrent.current = new Float32Array(provisions.length)
        isoDimCurrent.current.fill(1.0)
      }
      const target = isoDimTarget.current
      if (isolatedIndex !== null && isolatedNeighbors) {
        for (let i = 0; i < provisions.length; i++) {
          target[i] = isolatedNeighbors.has(i) ? 1.0 : 0.0
        }
      } else {
        target.fill(1.0)
      }

      // Smooth lerp toward target
      const cur = isoDimCurrent.current
      let needsUpdate = false
      const speed = delta * 5.0 // ~200ms transition
      for (let i = 0; i < provisions.length; i++) {
        if (Math.abs(cur[i] - target[i]) > 0.001) {
          cur[i] += (target[i] - cur[i]) * Math.min(1, speed)
          needsUpdate = true
        }
      }
      if (needsUpdate) {
        const attr = geometryRef.current.getAttribute('aIsoDim') as THREE.BufferAttribute
        if (attr) attr.needsUpdate = true
      }
    }
  })

  if (provisions.length === 0) return null

  return (
    <points
      ref={pointsRef}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={provisions.length}
          array={currentPos.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={provisions.length}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={provisions.length}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aIsoDim"
          count={provisions.length}
          array={isoDimCurrent.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
