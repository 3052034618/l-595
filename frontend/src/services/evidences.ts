import { get, post, put, del } from './api'
import type { Evidence, PageResult, PageParams, ApiResponse } from '@/types'

export const getEvidences = (
  params?: PageParams
): Promise<ApiResponse<PageResult<Evidence>>> => {
  return get<PageResult<Evidence>>('/evidences', params)
}

export const getEvidence = (id: string): Promise<ApiResponse<Evidence>> => {
  return get<Evidence>(`/evidences/${id}`)
}

export const createEvidence = (
  data: Partial<Evidence>
): Promise<ApiResponse<Evidence>> => {
  return post<Evidence>('/evidences', data)
}

export const updateEvidence = (
  id: string,
  data: Partial<Evidence>
): Promise<ApiResponse<Evidence>> => {
  return put<Evidence>(`/evidences/${id}`, data)
}

export const deleteEvidence = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/evidences/${id}`)
}

export const uploadEvidence = (
  file: File,
  data: Partial<Evidence>
): Promise<ApiResponse<Evidence>> => {
  const formData = new FormData()
  formData.append('file', file)
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })
  return post<Evidence>('/evidences/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const verifyEvidence = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/evidences/${id}/verify`)
}

export const rejectEvidence = (id: string, reason: string): Promise<ApiResponse<void>> => {
  return post<void>(`/evidences/${id}/reject`, { reason })
}

export const exportPackage = (
  evidenceIds: string[]
): Promise<ApiResponse<{ downloadUrl: string }>> => {
  return post<{ downloadUrl: string }>('/evidences/export-package', {
    evidenceIds,
  })
}
