import type { ProvisionPoint, CrossReference, Cluster, LayoutMode } from '@/types/provision'

// Seeded random for deterministic generation
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussianRandom(rng: () => number, mean: number, stdDev: number): number {
  const u1 = rng()
  const u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stdDev
}

const CLUSTERS = [
  { label: 'Public Health Service', color: [0.25, 0.50, 0.95] },
  { label: 'Communicable Diseases', color: [0.05, 0.72, 0.85] },
  { label: 'Mental Health', color: [0.45, 0.35, 0.90] },
  { label: 'Substance Abuse', color: [0.55, 0.30, 0.80] },
  { label: 'Medicare & Medicaid', color: [0.05, 0.75, 0.65] },
  { label: 'Maternal & Child Health', color: [0.35, 0.60, 0.95] },
  { label: 'Environmental Health', color: [0.08, 0.65, 0.60] },
  { label: 'Bioterrorism Preparedness', color: [0.50, 0.42, 0.85] },
  { label: 'Health Information', color: [0.15, 0.78, 0.95] },
  { label: 'Indian Health', color: [0.20, 0.45, 0.70] },
  { label: 'Vaccine Programs', color: [0.10, 0.72, 0.78] },
  { label: 'Food & Drug Safety', color: [0.40, 0.55, 0.92] },
]

export interface GeneratedUniverse {
  provisions: ProvisionPoint[]
  clusters: Cluster[]
  connections: CrossReference[]
  /** Position arrays per layout — Float32Array of [x,y,z, x,y,z, ...] */
  positions: Record<LayoutMode, Float32Array>
}

export function generateUniverse(count = 2000, seed = 42): GeneratedUniverse {
  const rng = mulberry32(seed)
  const clusterCount = CLUSTERS.length

  // --- Assign each provision to a cluster ---
  const weights = CLUSTERS.map(() => 0.5 + rng() * 1.5)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const assignments: number[] = []
  for (let i = 0; i < count; i++) {
    let r = rng() * totalWeight
    let clusterId = 0
    for (let c = 0; c < clusterCount; c++) {
      r -= weights[c]
      if (r <= 0) { clusterId = c; break }
    }
    assignments.push(clusterId)
  }

  // --- SEMANTIC layout: gaussian clusters around 3D centroids ---
  const semanticCentroids: [number, number, number][] = []
  for (let i = 0; i < clusterCount; i++) {
    const theta = (i / clusterCount) * Math.PI * 2 + rng() * 0.5
    const phi = Math.acos(2 * rng() - 1)
    const r = 45 + rng() * 50
    semanticCentroids.push([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ])
  }

  const semanticPos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const c = semanticCentroids[assignments[i]]
    const spread = 6 + rng() * 4
    semanticPos[i * 3] = gaussianRandom(rng, c[0], spread)
    semanticPos[i * 3 + 1] = gaussianRandom(rng, c[1], spread)
    semanticPos[i * 3 + 2] = gaussianRandom(rng, c[2], spread)
  }

  // --- HIERARCHICAL layout: tree rings by chapter, shelves by section ---
  const hierarchicalPos = new Float32Array(count * 3)
  const provsByCluster: number[][] = Array.from({ length: clusterCount }, () => [])
  for (let i = 0; i < count; i++) provsByCluster[assignments[i]].push(i)

  for (let c = 0; c < clusterCount; c++) {
    const indices = provsByCluster[c]
    // Each cluster forms a ring at a different height — spread out for legibility
    const ringY = (c - clusterCount / 2) * 18
    const ringRadius = 45 + (c % 3) * 18

    for (let j = 0; j < indices.length; j++) {
      const idx = indices[j]
      const angle = (j / indices.length) * Math.PI * 2
      const jitter = rng() * 4 - 2
      hierarchicalPos[idx * 3] = Math.cos(angle) * (ringRadius + jitter)
      hierarchicalPos[idx * 3 + 1] = ringY + (rng() - 0.5) * 4
      hierarchicalPos[idx * 3 + 2] = Math.sin(angle) * (ringRadius + jitter)
    }
  }

  // --- STRUCTURAL layout: hub-and-spoke from cross-references ---
  // First generate connections, then use them to compute a simple force layout
  const connections: CrossReference[] = []
  const connectionCounts = new Int32Array(count) // degree per node

  for (let i = 0; i < count; i++) {
    const numConns = Math.floor(rng() * 3)
    for (let c = 0; c < numConns; c++) {
      const sameCluster = rng() < 0.7
      let targetIdx: number
      if (sameCluster) {
        const clusterMembers = provsByCluster[assignments[i]]
        if (clusterMembers.length < 2) continue
        targetIdx = clusterMembers[Math.floor(rng() * clusterMembers.length)]
        if (targetIdx === i) continue
      } else {
        targetIdx = Math.floor(rng() * count)
        if (targetIdx === i) continue
      }
      connectionCounts[i]++
      connectionCounts[targetIdx]++
      connections.push({
        sourceCitation: `42 USC §${200 + i}`,
        targetCitation: `42 USC §${200 + targetIdx}`,
        relationshipType: sameCluster ? 'amends' : 'references',
      })
    }
  }

  // Structural: place high-degree nodes at center, push low-degree outward
  const structuralPos = new Float32Array(count * 3)
  const maxDegree = Math.max(1, ...Array.from(connectionCounts))
  for (let i = 0; i < count; i++) {
    const degree = connectionCounts[i]
    const importance = degree / maxDegree // 0 = peripheral, 1 = hub
    const r = 15 + (1 - importance) * 85 // hubs closer to center
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    // Cluster angle offset so same-cluster nodes stay somewhat grouped
    const clusterAngle = (assignments[i] / clusterCount) * Math.PI * 2
    structuralPos[i * 3] = r * Math.sin(phi) * Math.cos(theta + clusterAngle * 0.3)
    structuralPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta + clusterAngle * 0.3)
    structuralPos[i * 3 + 2] = r * Math.cos(phi)
  }

  // --- Build provision objects (using semantic positions as default x/y/z) ---
  const provisions: ProvisionPoint[] = []
  const clusterSizes = new Int32Array(clusterCount)

  for (let i = 0; i < count; i++) {
    const clusterId = assignments[i]
    const clusterDef = CLUSTERS[clusterId]
    clusterSizes[clusterId]++

    const colorVar = 0.12
    const cr = Math.max(0, Math.min(1, clusterDef.color[0] + (rng() - 0.5) * colorVar))
    const cg = Math.max(0, Math.min(1, clusterDef.color[1] + (rng() - 0.5) * colorVar))
    const cb = Math.max(0, Math.min(1, clusterDef.color[2] + (rng() - 0.5) * colorVar))

    const sectionNum = 200 + i
    provisions.push({
      id: `prov-${i}`,
      citation: `42 USC §${sectionNum}`,
      heading: `${clusterDef.label} — §${sectionNum}`,
      x: semanticPos[i * 3],
      y: semanticPos[i * 3 + 1],
      z: semanticPos[i * 3 + 2],
      color: `rgb(${Math.round(cr * 255)}, ${Math.round(cg * 255)}, ${Math.round(cb * 255)})`,
      clusterId,
      title: 'Title 42',
      chapter: `Chapter ${Math.floor(i / (count / clusterCount)) + 1}`,
      section: `§${sectionNum}`,
    })
  }

  const clusters: Cluster[] = semanticCentroids.map((c, i) => ({
    id: i,
    label: CLUSTERS[i].label,
    centroidX: c[0],
    centroidY: c[1],
    centroidZ: c[2],
    size: clusterSizes[i],
  }))

  return {
    provisions,
    clusters,
    connections,
    positions: {
      hierarchical: hierarchicalPos,
      semantic: semanticPos,
      structural: structuralPos,
    },
  }
}
