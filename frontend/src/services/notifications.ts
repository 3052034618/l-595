import { get, post, put, del } from './api'
import type { Notification, PageResult, PageParams, ApiResponse } from '@/types'

export const getNotifications = (
  params?: PageParams
): Promise<ApiResponse<PageResult<Notification>>> => {
  return get<PageResult<Notification>>('/notifications', params)
}

export const getUnreadCount = (): Promise<ApiResponse<number>> => {
  return get<number>('/notifications/unread-count')
}

export const markAsRead = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/notifications/${id}/read`)
}

export const markAllAsRead = (): Promise<ApiResponse<void>> => {
  return post<void>('/notifications/mark-all-read')
}

export const deleteNotification = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/notifications/${id}`)
}

export const createNotification = (
  data: Partial<Notification>
): Promise<ApiResponse<Notification>> => {
  return post<Notification>('/notifications', data)
}
