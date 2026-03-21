import { create } from 'zustand'
import type { LayoutMode, ProvisionPoint } from '@/types/provision'

interface ExplorerState {
  // Layout
  activeLayout: LayoutMode
  setActiveLayout: (layout: LayoutMode) => void

  // Selection
  hoveredPoint: ProvisionPoint | null
  selectedPoint: ProvisionPoint | null
  setHoveredPoint: (point: ProvisionPoint | null) => void
  setSelectedPoint: (point: ProvisionPoint | null) => void

  // Isolation — click a node to dim everything except its first-degree neighborhood
  isolatedIndex: number | null
  isolatedNeighbors: Set<number> | null
  setIsolation: (index: number | null, neighbors: Set<number> | null) => void

  // UI
  showEdges: boolean
  toggleEdges: () => void
  isTransitioning: boolean
  setIsTransitioning: (v: boolean) => void
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  activeLayout: 'hierarchical',
  setActiveLayout: (layout) => set({ activeLayout: layout }),

  hoveredPoint: null,
  selectedPoint: null,
  setHoveredPoint: (point) => set({ hoveredPoint: point }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),

  isolatedIndex: null,
  isolatedNeighbors: null,
  setIsolation: (index, neighbors) => set({ isolatedIndex: index, isolatedNeighbors: neighbors }),

  showEdges: false,
  toggleEdges: () => set((s) => ({ showEdges: !s.showEdges })),
  isTransitioning: false,
  setIsTransitioning: (v) => set({ isTransitioning: v }),
}))
