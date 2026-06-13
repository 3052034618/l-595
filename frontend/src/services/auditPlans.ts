import { get, post, put, del } from './api'
import type { AuditPlan, PageResult, PageParams, ApiResponse } from '@/types'

export const getAuditPlans = (
  params?: PageParams
): Promise<ApiResponse<PageResult<AuditPlan>>> => {
  return get<PageResult<AuditPlan>>('/audit-plans', params)
}

export const getAuditPlan = (id: string): Promise<ApiResponse<AuditPlan>> => {
  return get<AuditPlan>(`/audit-plans/${id}`)
}

export const createAuditPlan = (
  data: Partial<AuditPlan>
): Promise<ApiResponse<AuditPlan>> => {
  return post<AuditPlan>('/audit-plans', data)
}

export const updateAuditPlan = (
  id: string,
  data: Partial<AuditPlan>
): Promise<ApiResponse<AuditPlan>> => {
  return put<AuditPlan>(`/audit-plans/${id}`, data)
}

export const deleteAuditPlan = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/audit-plans/${id}`)
}

export const generatePlan = (data: {
  name: string
  auditObjectId: string
  auditType: string
}): Promise<ApiResponse<AuditPlan>> => {
  return post<AuditPlan>('/audit-plans/generate', data)
}

export const reassignAuditor = (
  id: string,
  data: { leadAuditorId: string; auditorIds: string[]; reason?: string }
): Promise<ApiResponse<void>> => {
  return post<void>(`/audit-plans/${id}/reassign`, data)
}

export const startAudit = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/audit-plans/${id}/start`)
}

export const completeAudit = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/audit-plans/${id}/complete`)
}

export const getAuditPlanStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/audit-plans/statistics')
}
