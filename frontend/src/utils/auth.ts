import config from '@/config'
import type { User } from '@/types'

const TOKEN_KEY = config.tokenKey
const USER_KEY = 'audit_platform_user'

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY)
}

export const clearAuth = (): void => {
  removeToken()
  removeUser()
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}
