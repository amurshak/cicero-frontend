import { isCancel } from 'axios'
import api from './api'
import type { UniverseApiResponse, FetchUniverseOptions } from '@/types/explorerApi'
import { generateUniverse, type GeneratedUniverse } from '@/data/generateUniverse'
import type { ProvisionPoint, ProvisionDetail } from '@/types/provision'

// Cool palette with enough hue variation to distinguish clusters visually
const CLUSTER_COLORS: [number, number, number][] = [
  [0.25, 0.50, 0.95], // blue — Public Health Service
  [0.05, 0.72, 0.85], // cyan — Communicable Diseases
  [0.45, 0.35, 0.90], // indigo — Mental Health
  [0.55, 0.30, 0.80], // violet — Substance Abuse
  [0.05, 0.75, 0.65], // teal — Medicare & Medicaid
  [0.35, 0.60, 0.95], // periwinkle — Maternal & Child Health
  [0.08, 0.65, 0.60], // dark teal — Environmental Health
  [0.50, 0.42, 0.85], // lavender — Bioterrorism Preparedness
  [0.15, 0.78, 0.95], // sky — Health Information
  [0.20, 0.45, 0.70], // steel — Indian Health
  [0.10, 0.72, 0.78], // ocean — Vaccine Programs
  [0.40, 0.55, 0.92], // cornflower — Food & Drug Safety
]

function clusterColor(clusterId: number | null): string {
  if (clusterId === null || clusterId < 0) {
    return 'rgb(100, 100, 120)' // gray for HDBSCAN noise / unclustered
  }
  const [r, g, b] = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length]
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

function transformUniverseResponse(data: UniverseApiResponse): GeneratedUniverse {
  const { provisions: apiProvisions, clusters, connections, positions: apiPositions } = data
  const n = apiProvisions.length

  // Validate position array lengths before handing to Three.js.
  // PointCloud.tsx iterates cur.length in its transition loop — a short array would
  // cause out-of-bounds reads in the BufferAttribute and corrupt the WebGL context.
  for (const layout of ['hierarchical', 'semantic', 'structural'] as const) {
    const arr = apiPositions[layout]
    if (!arr || arr.length !== n * 3) {
      throw new Error(
        `[Explorer] positions.${layout} length mismatch: expected ${n * 3}, got ${arr.length}`
      )
    }
  }

  // Convert flat number[] to Float32Array per layout for Three.js BufferAttribute
  const positions = {
    hierarchical: new Float32Array(apiPositions.hierarchical),
    semantic: new Float32Array(apiPositions.semantic),
    structural: new Float32Array(apiPositions.structural),
  }

  // Map API provisions → ProvisionPoint
  // x/y/z are set from semantic positions for consistency with generateUniverse.ts
  // (PointCloud.tsx drives rendering from the positions Float32Array, not provision.x/y/z)
  const semanticPos = positions.semantic
  const provisions: ProvisionPoint[] = apiProvisions.map((p, i) => ({
    id: p.id,
    citation: p.citation,
    heading: p.heading,
    title: p.title,
    chapter: p.chapter,
    section: p.section,
    clusterId: p.clusterId,
    color: clusterColor(p.clusterId),
    x: semanticPos[i * 3],
    y: semanticPos[i * 3 + 1],
    z: semanticPos[i * 3 + 2],
  }))

  return { provisions, clusters, connections, positions }
}

/**
 * Fetch the full 3D universe from the backend.
 *
 * Returns all 3 layouts (hierarchical, semantic, structural) in a single request.
 * On network failure or unreachable backend, falls back to generateUniverse(2000)
 * so the explorer always has something to show.
 *
 * Note: if the universe data is replaced (e.g. fetch after fallback), callers must
 * clear any stale ProvisionPoint refs held in explorerStore (selectedPoint, hoveredPoint)
 * since provision indices differ between dummy (2000) and real data (~8460).
 */
export async function fetchUniverse(options?: FetchUniverseOptions): Promise<GeneratedUniverse> {
  let apiData: UniverseApiResponse
  try {
    const { data } = await api.get<UniverseApiResponse>('/api/v1/explorer/universe', {
      signal: options?.signal,
    })
    apiData = data
  } catch (err: unknown) {
    // Intentional cancellation (AbortController / React unmount cleanup) — do not fall back
    if (isCancel(err)) throw err
    console.warn('[Explorer] API unavailable, falling back to dummy data:', err)
    return generateUniverse(2000)
  }

  // Transform outside the network catch so schema/validation errors propagate to the
  // caller (ExplorerPage) rather than silently producing dummy data.
  return transformUniverseResponse(apiData)
}

export async function fetchProvision(citation: string): Promise<ProvisionDetail> {
  const { data } = await api.get<ProvisionDetail>(
    `/api/v1/explorer/provision/${encodeURIComponent(citation)}`
  )
  return data
}
