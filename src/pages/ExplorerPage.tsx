import { Universe } from '@/components/explorer/Universe'
import { LayoutToggle } from '@/components/explorer/LayoutToggle'
import type { ProvisionPoint } from '@/types/provision'

// Placeholder data for development — will be replaced by API fetch
function generatePlaceholderData(): ProvisionPoint[] {
  const points: ProvisionPoint[] = []
  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  for (let i = 0; i < 500; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 8 + Math.random() * 12

    points.push({
      id: `provision-${i}`,
      citation: `usc:42:${1000 + i}`,
      heading: `Section ${1000 + i} — Public Health Provision`,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      color: colors[Math.floor(Math.random() * colors.length)],
      clusterId: Math.floor(Math.random() * 6),
      title: 'Title 42',
      chapter: `Chapter ${Math.floor(i / 50) + 1}`,
      section: `Section ${1000 + i}`,
    })
  }

  return points
}

const placeholderData = generatePlaceholderData()

export function ExplorerPage() {
  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas — full viewport */}
      <Universe provisions={placeholderData} />

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-lg font-semibold text-white/90 mb-3">Hololex</h1>
        <LayoutToggle />
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <p className="text-xs text-slate-500">
          {placeholderData.length} provisions · Title 42 · Placeholder data
        </p>
      </div>
    </div>
  )
}
