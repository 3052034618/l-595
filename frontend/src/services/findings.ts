import { get, post, put, del } from './api'
import type { Finding, PageResult, PageParams, ApiResponse } from '@/types'

export const getFindings = (
  params?: PageParams
): Promise<ApiResponse<PageResult<Finding>>> => {
  return get<PageResult<Finding>>('/findings', params)
}

export const getFinding = (id: string): Promise<ApiResponse<Finding>> => {
  return get<Finding>(`/findings/${id}`)
}

export const createFinding = (
  data: Partial<Finding>
): Promise<ApiResponse<Finding>> => {
  return post<Finding>('/findings', data)
}

export const updateFinding = (
  id: string,
  data: Partial<Finding>
): Promise<ApiResponse<Finding>> => {
  return put<Finding>(`/findings/${id}`, data)
}

export const deleteFinding = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/findings/${id}`)
}

export const confirmFinding = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/findings/${id}/confirm`)
}

export const closeFinding = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/findings/${id}/close`)
}

export const getFindingStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/findings/statistics')
}
