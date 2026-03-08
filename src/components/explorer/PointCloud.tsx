import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ProvisionPoint } from '@/types/provision'

interface PointCloudProps {
  provisions: ProvisionPoint[]
}

export function PointCloud({ provisions }: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(provisions.length * 3)
    const col = new Float32Array(provisions.length * 3)
    const color = new THREE.Color()

    for (let i = 0; i < provisions.length; i++) {
      const p = provisions[i]
      pos[i * 3] = p.x
      pos[i * 3 + 1] = p.y
      pos[i * 3 + 2] = p.z

      color.set(p.color || '#3b82f6')
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b
    }

    return { positions: pos, colors: col }
  }, [provisions])

  // Gentle rotation when idle
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02
    }
  })

  if (provisions.length === 0) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={`${provisions.length}-${provisions[0]?.id ?? 'empty'}`}>
        <bufferAttribute
          attach="attributes-position"
          count={provisions.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={provisions.length}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  )
}
