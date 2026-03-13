import { isCancel } from 'axios'
import api from './api'
import type { UniverseApiResponse, FetchUniverseOptions } from '@/types/explorerApi'
import { generateUniverse, type GeneratedUniverse } from '@/data/generateUniverse'
import type { ProvisionPoint, ProvisionDetail } from '@/types/provision'

// Color palette matching generateUniverse.ts CLUSTERS (for visual consistency with dummy data)
const CLUSTER_COLORS: [number, number, number][] = [
  [0.23, 0.51, 0.96], // blue — Public Health Service
  [0.02, 0.71, 0.83], // cyan — Communicable Diseases
  [0.49, 0.36, 0.96], // violet — Mental Health
  [0.63, 0.25, 0.85], // purple — Substance Abuse
  [0.06, 0.73, 0.51], // teal — Medicare & Medicaid
  [0.96, 0.62, 0.04], // amber — Maternal & Child Health
  [0.16, 0.65, 0.53], // green — Environmental Health
  [0.94, 0.27, 0.27], // red — Bioterrorism Preparedness
  [0.31, 0.76, 0.97], // sky — Health Information
  [0.85, 0.55, 0.20], // orange — Indian Health
  [0.55, 0.83, 0.33], // lime — Vaccine Programs
  [0.96, 0.47, 0.53], // pink — Food & Drug Safety
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
    if (arr.length !== n * 3) {
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
