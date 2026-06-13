import { get, post, put, del } from './api'
import type { AuditObject, PageResult, PageParams, ApiResponse } from '@/types'

export const getAuditObjects = (
  params?: PageParams
): Promise<ApiResponse<PageResult<AuditObject>>> => {
  return get<PageResult<AuditObject>>('/audit-objects', params)
}

export const getAuditObject = (id: string): Promise<ApiResponse<AuditObject>> => {
  return get<AuditObject>(`/audit-objects/${id}`)
}

export const createAuditObject = (
  data: Partial<AuditObject>
): Promise<ApiResponse<AuditObject>> => {
  return post<AuditObject>('/audit-objects', data)
}

export const updateAuditObject = (
  id: string,
  data: Partial<AuditObject>
): Promise<ApiResponse<AuditObject>> => {
  return put<AuditObject>(`/audit-objects/${id}`, data)
}

export const deleteAuditObject = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/audit-objects/${id}`)
}

export const batchDeleteAuditObjects = (
  ids: string[]
): Promise<ApiResponse<void>> => {
  return post<void>('/audit-objects/batch-delete', { ids })
}

export const getAuditObjectStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/audit-objects/statistics')
}
