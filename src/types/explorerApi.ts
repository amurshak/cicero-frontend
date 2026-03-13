/**
 * API contract types for GET /api/v1/explorer/*
 *
 * These types describe the raw JSON returned by the backend.
 * They are intentionally separate from the frontend's rendering types
 * (ProvisionPoint, GeneratedUniverse) — a thin transform layer converts
 * between them.
 *
 * Key differences from frontend rendering types:
 *   - `positions` is a flat number[] (JSON-serializable), not Float32Array
 *   - `color` is NOT in the API — frontend computes it from clusterId
 *   - `ProvisionApiPoint.x/y/z` are NOT in the universe response — positions
 *     are in the separate `positions` map, indexed by provision order
 *
 * Corresponds to backend docs/uslm_analysis.md decision log.
 */

import type { LayoutMode, CrossReference, ProvisionDetail } from './provision'

// ---------------------------------------------------------------------------
// GET /api/v1/explorer/universe?layout=all
// ---------------------------------------------------------------------------

/**
 * A single provision as returned by the universe endpoint.
 * Does NOT include x/y/z (those are in `positions`) or `color` (frontend computes).
 * Order matches the flat position arrays: provisions[i] uses positions[layout][i*3..i*3+2].
 */
export interface ProvisionApiPoint {
  /** UUID from the database */
  id: string
  /** USLM citation, e.g. '/us/usc/t42/s1395' */
  citation: string
  /** Section heading, e.g. 'Definitions' */
  heading: string
  /** Title string, e.g. 'Title 42' */
  title: string
  /** Chapter heading, e.g. 'CHAPTER 7—SOCIAL SECURITY' */
  chapter: string
  /** Section number, e.g. '1395x' */
  section: string
  /** Cluster ID (integer >= 0), or null for HDBSCAN noise points */
  clusterId: number | null
}

/**
 * Cluster metadata as returned by the universe endpoint.
 * Centroid is the mean position of cluster members in the semantic layout.
 */
export interface ClusterApiData {
  id: number
  /** Phase 0: most common chapter heading among cluster members */
  label: string
  centroidX: number
  centroidY: number
  centroidZ: number
  size: number
}

/**
 * Response from GET /api/v1/explorer/universe
 *
 * `positions` contains flat [x,y,z, x,y,z, ...] arrays for each layout mode.
 * provisions[i] corresponds to positions[layout][i*3], positions[layout][i*3+1],
 * positions[layout][i*3+2].
 *
 * The frontend converts positions to Float32Array for direct use in Three.js
 * BufferAttribute.
 *
 * Size estimate for Title 42 (8,460 sections):
 *   - provisions: ~8,460 × 100B ≈ 850 KB
 *   - positions: 8,460 × 3 × 3 × 4B ≈ 305 KB (before JSON encoding)
 *   - connections: variable, but intra-T42 refs only
 *   Total: ~1–1.5 MB JSON, ~200 KB gzipped — single response, no pagination.
 */
export interface UniverseApiResponse {
  provisions: ProvisionApiPoint[]
  clusters: ClusterApiData[]
  connections: CrossReference[]
  /**
   * Flat float arrays per layout. Each is an ordered sequence of [x,y,z]
   * triples, one per provision, in the same order as `provisions`.
   * Wrap with `new Float32Array(positions.semantic)` in the frontend.
   */
  positions: Record<LayoutMode, number[]>
}

// ---------------------------------------------------------------------------
// GET /api/v1/explorer/provision/{citation}
// ---------------------------------------------------------------------------

/**
 * Response from GET /api/v1/explorer/provision/{citation}
 * Matches the existing ProvisionDetail frontend type exactly.
 * `neighbors` is empty in Phase 0 (no pgvector similarity search yet).
 */
export type ProvisionDetailApiResponse = ProvisionDetail

// ---------------------------------------------------------------------------
// Frontend transform helpers (types only — implementation in explorerApi.ts)
// ---------------------------------------------------------------------------

/**
 * Options for the universe fetch.
 * Phase 0: layout param unused (all 3 layouts returned in one call).
 */
export interface FetchUniverseOptions {
  /** Signal for AbortController — use for cleanup on unmount */
  signal?: AbortSignal
}
