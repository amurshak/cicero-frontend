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
}

function Scene({ provisions, connections, positions, onHover, onClick }: UniverseProps) {
  // Shared animated positions — PointCloud writes, ConnectionLines reads
  const currentPositions = useRef<Float32Array>(new Float32Array(0))

  return (
    <>
      <ambientLight intensity={0.05} />

      {/* Deep space star layers — parallax depth */}
      <Stars radius={600} depth={300} count={12000} factor={2} saturation={0} fade speed={0.3} />
      <Stars radius={300} depth={150} count={4000} factor={4} saturation={0.1} fade speed={0.4} />
      <Stars radius={100} depth={60} count={800} factor={8} saturation={0.2} fade speed={0.5} />

      {/* Exponential fog — soft depth fade, no hard cutoff */}
      <fogExp2 attach="fog" args={['#010208', 0.004]} />

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
      />

      {/* Mouse-position steering, WASD flight */}
      <FlyCamera speed={30} lookSpeed={1.2} />

      {/* Post-processing: bloom for glow */}
      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          intensity={1.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          radius={0.8}
        />
      </EffectComposer>
    </>
  )
}

export function Universe({ provisions, connections, positions, onHover, onClick }: UniverseProps) {
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
      style={{ background: '#010208' }}
    >
      <Scene
        provisions={provisions}
        connections={connections}
        positions={positions}
        onHover={onHover}
        onClick={onClick}
      />
    </Canvas>
  )
}
