import { post, get } from './api'
import type { LoginRequest, LoginResponse, User, ApiResponse } from '@/types'

export const login = (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return post<LoginResponse>('/auth/login', data)
}

export const logout = (): Promise<ApiResponse<void>> => {
  return post<void>('/auth/logout')
}

export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  return get<User>('/auth/me')
}

export const changePassword = (data: {
  oldPassword: string
  newPassword: string
}): Promise<ApiResponse<void>> => {
  return post<void>('/auth/change-password', data)
}
