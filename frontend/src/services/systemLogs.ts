import { get } from './api'
import type { SystemLog, PageResult, PageParams, ApiResponse } from '@/types'

export const getSystemLogs = (
  params?: PageParams
): Promise<ApiResponse<PageResult<SystemLog>>> => {
  return get<PageResult<SystemLog>>('/system-logs', params)
}

export const getSystemLog = (id: string): Promise<ApiResponse<SystemLog>> => {
  return get<SystemLog>(`/system-logs/${id}`)
}

export const getModuleStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/system-logs/module-statistics')
}

export const getActionStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/system-logs/action-statistics')
}

export const exportLogs = (params?: PageParams): Promise<ApiResponse<{ downloadUrl: string }>> => {
  return get<{ downloadUrl: string }>('/system-logs/export', params)
}
