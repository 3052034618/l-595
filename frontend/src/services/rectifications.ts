import { get, post, put, del } from './api'
import type { Rectification, RectificationComment, PageResult, PageParams, ApiResponse } from '@/types'

export const getRectifications = (
  params?: PageParams
): Promise<ApiResponse<PageResult<Rectification>>> => {
  return get<PageResult<Rectification>>('/rectifications', params)
}

export const getRectification = (id: string): Promise<ApiResponse<Rectification>> => {
  return get<Rectification>(`/rectifications/${id}`)
}

export const createRectification = (
  data: Partial<Rectification>
): Promise<ApiResponse<Rectification>> => {
  return post<Rectification>('/rectifications', data)
}

export const updateRectification = (
  id: string,
  data: Partial<Rectification>
): Promise<ApiResponse<Rectification>> => {
  return put<Rectification>(`/rectifications/${id}`, data)
}

export const deleteRectification = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/rectifications/${id}`)
}

export const addRectificationUpdate = (
  id: string,
  data: { progress: number; description: string; attachments?: string[] }
): Promise<ApiResponse<void>> => {
  return post<void>(`/rectifications/${id}/update`, data)
}

export const verifyCompletion = (
  id: string,
  data: { verified: boolean; comment?: string }
): Promise<ApiResponse<void>> => {
  return post<void>(`/rectifications/${id}/verify`, data)
}

export const addComment = (
  id: string,
  content: string
): Promise<ApiResponse<RectificationComment>> => {
  return post<RectificationComment>(`/rectifications/${id}/comments`, { content })
}

export const getComments = (
  id: string
): Promise<ApiResponse<RectificationComment[]>> => {
  return get<RectificationComment[]>(`/rectifications/${id}/comments`)
}

export const getRectificationStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/rectifications/statistics')
}
