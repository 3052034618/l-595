import { get, post, put, del } from './api'
import type { RiskAssessment, RiskFactor, PageResult, PageParams, ApiResponse } from '@/types'

export const getRiskAssessments = (
  params?: PageParams
): Promise<ApiResponse<PageResult<RiskAssessment>>> => {
  return get<PageResult<RiskAssessment>>('/risk-assessments', params)
}

export const getRiskAssessment = (id: string): Promise<ApiResponse<RiskAssessment>> => {
  return get<RiskAssessment>(`/risk-assessments/${id}`)
}

export const createRiskAssessment = (
  data: Partial<RiskAssessment>
): Promise<ApiResponse<RiskAssessment>> => {
  return post<RiskAssessment>('/risk-assessments', data)
}

export const updateRiskAssessment = (
  id: string,
  data: Partial<RiskAssessment>
): Promise<ApiResponse<RiskAssessment>> => {
  return put<RiskAssessment>(`/risk-assessments/${id}`, data)
}

export const deleteRiskAssessment = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/risk-assessments/${id}`)
}

export const getRiskFactors = (
  assessmentId: string
): Promise<ApiResponse<RiskFactor[]>> => {
  return get<RiskFactor[]>(`/risk-assessments/${assessmentId}/factors`)
}

export const triggerAssessment = (
  auditObjectId: string
): Promise<ApiResponse<RiskAssessment>> => {
  return post<RiskAssessment>('/risk-assessments/trigger', { auditObjectId })
}

export const getRiskMatrix = (): Promise<ApiResponse<unknown>> => {
  return get<unknown>('/risk-assessments/matrix')
}
