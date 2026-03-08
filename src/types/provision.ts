export type LayoutMode = 'hierarchical' | 'semantic' | 'structural'

export interface ProvisionPoint {
  id: string
  citation: string
  heading: string
  x: number
  y: number
  z: number
  color: string
  clusterId: number | null
  title: string
  chapter: string
  section: string
}

export interface Cluster {
  id: number
  label: string
  centroidX: number
  centroidY: number
  centroidZ: number
  size: number
}

export interface UniverseData {
  provisions: ProvisionPoint[]
  clusters: Cluster[]
  layout: LayoutMode
  version: number
}

export interface ProvisionDetail {
  id: string
  citation: string
  title: string
  chapter: string
  section: string
  heading: string
  body: string
  status: string
  crossReferences: CrossReference[]
  neighbors: ProvisionPoint[]
}

export interface CrossReference {
  sourceCitation: string
  targetCitation: string
  relationshipType: string
}
