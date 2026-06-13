import { get, post, put, del } from './api'
import type { Notification, PageParams, ApiResponse, NotificationPageResult } from '@/types'

export const getNotifications = (
  params?: PageParams
): Promise<ApiResponse<NotificationPageResult<Notification>>> => {
  return get<NotificationPageResult<Notification>>('/notifications', params)
}

export const getUnreadCount = async (): Promise<ApiResponse<number>> => {
  const response = await getNotifications({ pageSize: 1 })
  return {
    ...response,
    data: response.data.unreadCount,
  }
}

export const markAsRead = (id: string): Promise<ApiResponse<void>> => {
  return post<void>(`/notifications/${id}/read`)
}

export const markAllAsRead = (): Promise<ApiResponse<void>> => {
  return post<void>('/notifications/read-all')
}

export const deleteNotification = (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/notifications/${id}`)
}

export const createNotification = (
  data: Partial<Notification>
): Promise<ApiResponse<Notification>> => {
  return post<Notification>('/notifications', data)
}
