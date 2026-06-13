import { get, post, put, del } from './api'
import type { Report, PageResult, PageParams, ApiResponse } from '@/types'

export const getReports = (
  params?: PageParams
): Promise<ApiResponse<PageResult<Report>>> => {
  return get<PageResult<Report>>('/reports', params)
}

export const getReport = (id: string): Promise<ApiResponse<Report>> => {
  return get<Report>(`/reports/${id}`)
}

export const createReport = (
  data: Partial<Report>
): Promise<ApiResponse<Report>> => {
  return post<Report>('/reports', data)
}

export const updateReport = (
  id: string,
  data: Partial<Report>
): Promise<ApiResponse<Report>> => {
  return put<Report>(`/reports/${id}`, data)
}

export const deleteReport = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/reports/${id}`)
}

export const generateReport = (data: {
  auditPlanId: string
  title: string
  type: string
}): Promise<ApiResponse<Report>> => {
  return post<Report>('/reports/generate', data)
}

export const approveReport = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/reports/${id}/approve`)
}

export const rejectReport = (id: string, reason: string): Promise<ApiResponse<void>> => {
  return post<void>(`/reports/${id}/reject`, { reason })
}

export const issueReport = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/reports/${id}/issue`)
}

export const downloadReport = (id: string): Promise<ApiResponse<{ downloadUrl: string }>> => {
  return get<{ downloadUrl: string }>(`/reports/${id}/download`)
}
