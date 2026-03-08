import { useMemo, useState, useCallback } from 'react'
import { Universe } from '@/components/explorer/Universe'
import { LayoutToggle } from '@/components/explorer/LayoutToggle'
import { generateUniverse } from '@/data/generateUniverse'
import type { ProvisionPoint } from '@/types/provision'
import { useExplorerStore } from '@/stores/explorerStore'

export function ExplorerPage() {
  const { provisions, connections, positions } = useMemo(() => generateUniverse(2000), [])

  const setHoveredPoint = useExplorerStore((s) => s.setHoveredPoint)
  const setSelectedPoint = useExplorerStore((s) => s.setSelectedPoint)
  const selectedPoint = useExplorerStore((s) => s.selectedPoint)

  const [tooltip, setTooltip] = useState<{ point: ProvisionPoint; x: number; y: number } | null>(
    null,
  )

  const onHover = useCallback(
    (_index: number | null, point: ProvisionPoint | null) => {
      setHoveredPoint(point)
      if (point) {
        setTooltip((prev) => (prev?.point.id === point.id ? prev : { point, x: 0, y: 0 }))
      } else {
        setTooltip(null)
      }
    },
    [setHoveredPoint],
  )

  const onNodeClick = useCallback(
    (_index: number, point: ProvisionPoint) => {
      setSelectedPoint(selectedPoint?.id === point.id ? null : point)
    },
    [setSelectedPoint, selectedPoint],
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
  }, [])

  return (
    <div className="w-full h-full relative" onMouseMove={handleMouseMove}>
      {/* 3D Canvas — full viewport */}
      <Universe
        provisions={provisions}
        connections={connections}
        positions={positions}
        onHover={onHover}
        onClick={onNodeClick}
      />

      {/* Minimal HUD — always visible */}
      <div className="absolute top-5 left-5 z-10">
        <h1 className="text-sm font-medium tracking-widest text-white/40 uppercase mb-3">
          Hololex
        </h1>
        <LayoutToggle />
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-5 z-10">
        <p className="text-[11px] text-white/20 tracking-wider">
          WASD to fly · Mouse to steer · Scroll to adjust speed
        </p>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-5 z-10">
        <p className="text-[11px] text-white/20 tracking-wider">
          {provisions.length.toLocaleString()} provisions · Title 42
        </p>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none glass rounded-lg px-3 py-2 max-w-xs"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 8,
          }}
        >
          <p className="text-xs font-medium text-white/90">{tooltip.point.citation}</p>
          <p className="text-[11px] text-white/50 mt-0.5">{tooltip.point.heading}</p>
        </div>
      )}

      {/* Selected node detail panel */}
      {selectedPoint && (
        <div className="absolute top-5 right-5 z-20 w-72 glass-prominent rounded-xl p-4 animate-slide-up">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-sm font-semibold text-white/90">{selectedPoint.citation}</h2>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-white/30 hover:text-white/60 text-lg leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-white/60 mb-2">{selectedPoint.heading}</p>
          <div className="space-y-1.5 text-[11px] text-white/40">
            <p>
              <span className="text-white/20">Title:</span> {selectedPoint.title}
            </p>
            <p>
              <span className="text-white/20">Chapter:</span> {selectedPoint.chapter}
            </p>
            <p>
              <span className="text-white/20">Section:</span> {selectedPoint.section}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
