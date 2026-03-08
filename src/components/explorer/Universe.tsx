import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { PointCloud } from './PointCloud'
import type { ProvisionPoint } from '@/types/provision'

interface UniverseProps {
  provisions: ProvisionPoint[]
}

export function Universe({ provisions }: UniverseProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 60, near: 0.1, far: 1000 }}
      style={{ background: '#0d1220' }}
    >
      <ambientLight intensity={0.3} />
      <Stars radius={200} depth={100} count={3000} factor={4} fade speed={0.5} />
      <fog attach="fog" args={['#0d1220', 50, 200]} />
      <PointCloud provisions={provisions} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={150}
      />
    </Canvas>
  )
}
