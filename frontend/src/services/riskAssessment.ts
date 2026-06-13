import { get, post, put, del } from './api'
import type { RiskAssessment, RiskFactor, PageResult, PageParams, ApiResponse } from '@/types'

export const getRiskAssessments = (
  auditObjectId?: string,
  params?: PageParams
): Promise<ApiResponse<PageResult<RiskAssessment>>> => {
  const url = auditObjectId
    ? `/risk-assessment/history/${auditObjectId}`
    : '/risk-assessment/history'
  return get<PageResult<RiskAssessment>>(url, params)
}

export const getRiskAssessment = (id: string): Promise<ApiResponse<RiskAssessment>> => {
  return get<RiskAssessment>(`/risk-assessment/${id}`)
}

export const createRiskAssessment = (
  data: Partial<RiskAssessment>
): Promise<ApiResponse<RiskAssessment>> => {
  return post<RiskAssessment>('/risk-assessment', data)
}

export const updateRiskAssessment = (
  id: string,
  data: Partial<RiskAssessment>
): Promise<ApiResponse<RiskAssessment>> => {
  return put<RiskAssessment>(`/risk-assessment/${id}`, data)
}

export const deleteRiskAssessment = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/risk-assessment/${id}`)
}

export const getRiskFactors = (
  assessmentId: string
): Promise<ApiResponse<RiskFactor[]>> => {
  return get<RiskFactor[]>(`/risk-assessment/${assessmentId}/factors`)
}

export const triggerAssessment = (): Promise<ApiResponse<RiskAssessment[]>> => {
  return post<RiskAssessment[]>('/risk-assessment/trigger', { isManual: true })
}

export const getRiskMatrix = (): Promise<ApiResponse<unknown>> => {
  return get<unknown>('/risk-assessment/matrix')
}

export const getRiskModel = (): Promise<ApiResponse<{ dimensions: any[] }>> => {
  return get<{ dimensions: any[] }>('/risk-assessment/model')
}

export const updateRiskModel = (dimensions: any[]): Promise<ApiResponse<{ dimensions: any[] }>> => {
  return post<{ dimensions: any[] }>('/risk-assessment/model', { dimensions })
}
