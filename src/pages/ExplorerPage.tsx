import { useEffect, useState, useCallback, useMemo } from 'react'
import { Universe } from '@/components/explorer/Universe'
import { LayoutToggle } from '@/components/explorer/LayoutToggle'
import { fetchUniverse } from '@/services/explorerApi'
import type { GeneratedUniverse } from '@/data/generateUniverse'
import type { ProvisionPoint } from '@/types/provision'
import { useExplorerStore } from '@/stores/explorerStore'

export function ExplorerPage() {
  const [universe, setUniverse] = useState<GeneratedUniverse | null>(null)
  const setHoveredPoint = useExplorerStore((s) => s.setHoveredPoint)
  const setSelectedPoint = useExplorerStore((s) => s.setSelectedPoint)
  const selectedPoint = useExplorerStore((s) => s.selectedPoint)
  const setIsolation = useExplorerStore((s) => s.setIsolation)
  const isolatedIndex = useExplorerStore((s) => s.isolatedIndex)

  useEffect(() => {
    const controller = new AbortController()
    fetchUniverse({ signal: controller.signal })
      .then((result) => {
        // Clear stale ProvisionPoint refs — provision indices differ between
        // dummy data (2000 entries) and real data (~8460 entries)
        setHoveredPoint(null)
        setSelectedPoint(null)
        setIsolation(null, null)
        setUniverse(result)
      })
      .catch((err) => {
        if (err?.name !== 'CanceledError') {
          console.error('[Explorer] Failed to load universe:', err)
        }
      })
    return () => controller.abort()
  }, [setHoveredPoint, setSelectedPoint, setIsolation])

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

  // Build adjacency map: provision index → set of neighbor indices
  // And connection details: "srcIdx-tgtIdx" → relationship type
  const { adjacency, connectionDetails } = useMemo(() => {
    if (!universe) return { adjacency: null, connectionDetails: null }
    const { provisions, connections } = universe
    const ctoi = new Map<string, number>()
    for (let i = 0; i < provisions.length; i++) {
      ctoi.set(provisions[i].citation, i)
    }
    const adj = new Map<number, Set<number>>()
    const details = new Map<string, string>() // "srcIdx-tgtIdx" → relationshipType
    for (const conn of connections) {
      const si = ctoi.get(conn.sourceCitation)
      const ti = ctoi.get(conn.targetCitation)
      if (si === undefined || ti === undefined) continue
      if (!adj.has(si)) adj.set(si, new Set())
      if (!adj.has(ti)) adj.set(ti, new Set())
      adj.get(si)!.add(ti)
      adj.get(ti)!.add(si)
      details.set(`${si}-${ti}`, conn.relationshipType)
      details.set(`${ti}-${si}`, conn.relationshipType)
    }
    return { adjacency: adj, connectionDetails: details }
  }, [universe])

  const selectNode = useCallback(
    (index: number, point: ProvisionPoint) => {
      setSelectedPoint(point)
      const neighbors = new Set<number>([index])
      const adj = adjacency?.get(index)
      if (adj) adj.forEach((n) => neighbors.add(n))
      setIsolation(index, neighbors)
    },
    [setSelectedPoint, setIsolation, adjacency],
  )

  const onNodeClick = useCallback(
    (index: number, point: ProvisionPoint) => {
      if (selectedPoint?.id === point.id) {
        setSelectedPoint(null)
        setIsolation(null, null)
      } else {
        selectNode(index, point)
      }
    },
    [selectNode, setSelectedPoint, setIsolation, selectedPoint],
  )

  const clearIsolation = useCallback(() => {
    setSelectedPoint(null)
    setIsolation(null, null)
  }, [setSelectedPoint, setIsolation])

  const onMiss = useCallback(() => {
    if (isolatedIndex !== null) clearIsolation()
  }, [isolatedIndex, clearIsolation])

  // ESC key clears isolation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearIsolation()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clearIsolation])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
  }, [])

  if (!universe) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#060d1a]">
        <p className="text-white/30 text-sm tracking-widest uppercase">Loading universe…</p>
      </div>
    )
  }

  const { provisions, connections, positions } = universe

  return (
    <div className="w-full h-full relative" onMouseMove={handleMouseMove}>
      {/* 3D Canvas — full viewport */}
      <Universe
        provisions={provisions}
        connections={connections}
        positions={positions}
        onHover={onHover}
        onClick={onNodeClick}
        onMiss={onMiss}
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
          {universe.provisions.length.toLocaleString()} provisions · Title 42
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
      {selectedPoint && isolatedIndex !== null && (() => {
        // Gather connected nodes for display
        const neighborIndices = adjacency?.get(isolatedIndex)
        const connectedNodes: { index: number; point: ProvisionPoint; relationship: string }[] = []
        if (neighborIndices && universe) {
          neighborIndices.forEach((ni) => {
            const rel = connectionDetails?.get(`${isolatedIndex}-${ni}`) ?? 'related'
            connectedNodes.push({ index: ni, point: universe.provisions[ni], relationship: rel })
          })
        }

        return (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[420px] max-h-[70vh] glass-prominent rounded-2xl p-6 animate-slide-up overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">{selectedPoint.citation}</h2>
                <p className="text-sm text-white/50 mt-1">{selectedPoint.heading}</p>
              </div>
              <button
                onClick={clearIsolation}
                className="text-white/30 hover:text-white/60 text-xl leading-none ml-4 flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Metadata */}
            <div className="flex gap-4 mb-5 text-xs text-white/40">
              <div>
                <span className="text-white/20 uppercase tracking-wider text-[10px]">Title</span>
                <p className="text-white/60 mt-0.5">{selectedPoint.title}</p>
              </div>
              <div>
                <span className="text-white/20 uppercase tracking-wider text-[10px]">Chapter</span>
                <p className="text-white/60 mt-0.5">{selectedPoint.chapter}</p>
              </div>
              <div>
                <span className="text-white/20 uppercase tracking-wider text-[10px]">Section</span>
                <p className="text-white/60 mt-0.5">{selectedPoint.section}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/8 mb-4" />

            {/* Connected nodes */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <h3 className="text-[11px] text-white/30 uppercase tracking-widest mb-3">
                Connected Provisions ({connectedNodes.length})
              </h3>
              {connectedNodes.length > 0 ? (
                <div className="space-y-1.5">
                  {connectedNodes.map(({ index, point, relationship }) => (
                    <button
                      key={point.id}
                      onClick={() => selectNode(index, point)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/8 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-300/90 group-hover:text-blue-200 font-medium">
                          {point.citation}
                        </span>
                        <span className="text-[10px] text-white/20 uppercase tracking-wider">
                          {relationship}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5 truncate">{point.heading}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/20 italic">No direct connections</p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
