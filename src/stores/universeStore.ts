import { create } from 'zustand'
import type { UniverseData, LayoutMode, Cluster } from '@/types/provision'

interface UniverseState {
  // Data per layout
  layouts: Partial<Record<LayoutMode, UniverseData>>
  isLoading: boolean
  error: string | null

  // Actions
  setLayoutData: (layout: LayoutMode, data: UniverseData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Selectors
  getActiveData: (layout: LayoutMode) => UniverseData | undefined
  getClusters: (layout: LayoutMode) => Cluster[]
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  layouts: {},
  isLoading: false,
  error: null,

  setLayoutData: (layout, data) =>
    set((s) => ({
      layouts: { ...s.layouts, [layout]: data },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getActiveData: (layout) => get().layouts[layout],
  getClusters: (layout) => get().layouts[layout]?.clusters ?? [],
}))
