import api from './api'
import type { UniverseData, ProvisionDetail, LayoutMode } from '@/types/provision'

export async function fetchUniverse(layout: LayoutMode): Promise<UniverseData> {
  const { data } = await api.get<UniverseData>(`/api/v1/explorer/universe`, {
    params: { layout },
  })
  return data
}

export async function fetchProvision(citation: string): Promise<ProvisionDetail> {
  const { data } = await api.get<ProvisionDetail>(
    `/api/v1/explorer/provision/${encodeURIComponent(citation)}`
  )
  return data
}

export async function searchProvisions(
  query: string,
  limit = 10
): Promise<{ results: ProvisionDetail[]; query: string }> {
  const { data } = await api.get(`/api/v1/explorer/search`, {
    params: { q: query, limit },
  })
  return data
}
