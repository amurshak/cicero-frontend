import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { PointCloud } from './PointCloud'
import { ConnectionLines } from './ConnectionLines'
import { FlyCamera } from './FlyCamera'
import type { ProvisionPoint, CrossReference, LayoutMode } from '@/types/provision'

interface UniverseProps {
  provisions: ProvisionPoint[]
  connections: CrossReference[]
  positions: Record<LayoutMode, Float32Array>
  onHover?: (index: number | null, point: ProvisionPoint | null) => void
  onClick?: (index: number, point: ProvisionPoint) => void
  onMiss?: () => void
}

function Scene({ provisions, connections, positions, onHover, onClick, onMiss }: UniverseProps) {
  // Shared animated positions — PointCloud writes, ConnectionLines reads
  const currentPositions = useRef<Float32Array>(new Float32Array(0))

  return (
    <>
      <ambientLight intensity={0.03} />

      {/* Sparse distant stars — subtle, so the network is the visual focus */}
      <Stars radius={600} depth={300} count={3000} factor={1.5} saturation={0} fade speed={0.2} />

      {/* Navy-tinted fog — atmospheric depth fade */}
      <fogExp2 attach="fog" args={['#060d1a', 0.0035]} />

      {/* The web of connections — reads from shared animated positions */}
      <ConnectionLines
        provisions={provisions}
        connections={connections}
        positions={positions}
        currentPositions={currentPositions}
      />

      {/* The provisions — writes to shared animated positions */}
      <PointCloud
        provisions={provisions}
        positions={positions}
        currentPositions={currentPositions}
        onHover={onHover}
        onClick={onClick}
        onMiss={onMiss}
      />

      {/* Mouse-position steering, WASD flight */}
      <FlyCamera speed={30} lookSpeed={1.2} />

      {/* Post-processing: bloom for luminous glow on nodes and connection lines */}
      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          intensity={1.2}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          radius={0.7}
        />
      </EffectComposer>
    </>
  )
}

export function Universe({ provisions, connections, positions, onHover, onClick, onMiss }: UniverseProps) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 80],
        fov: 75,
        near: 0.1,
        far: 10000,
      }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.8,
        antialias: false,
      }}
      style={{ background: '#060d1a' }}
      onPointerMissed={onMiss}
    >
      <Scene
        provisions={provisions}
        connections={connections}
        positions={positions}
        onHover={onHover}
        onClick={onClick}
        onMiss={onMiss}
      />
    </Canvas>
  )
}
