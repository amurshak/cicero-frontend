import type { LayoutMode } from '@/types/provision'
import { useExplorerStore } from '@/stores/explorerStore'

const LAYOUTS: { key: LayoutMode; label: string }[] = [
  { key: 'hierarchical', label: 'Hierarchy' },
  { key: 'semantic', label: 'Semantic' },
  { key: 'structural', label: 'Structural' },
]

export function LayoutToggle() {
  const { activeLayout, setActiveLayout } = useExplorerStore()

  return (
    <div className="glass rounded-lg p-1 flex gap-1">
      {LAYOUTS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveLayout(key)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            activeLayout === key
              ? 'bg-accent-blue text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
