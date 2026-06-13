import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { setToken, setUser, clearAuth, getToken, getUser } from '@/utils/auth'
import { login, logout, getCurrentUser } from '@/services/auth'
import type { LoginRequest, LoginResponse } from '@/types'

interface UserState {
  user: User | null
  token: string | null
  permissions: string[]
  isAuthenticated: boolean
  loading: boolean
  login: (data: LoginRequest) => Promise<LoginResponse>
  logoutUser: () => Promise<void>
  fetchCurrentUser: () => Promise<User | null>
  clearUserState: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: getUser(),
      token: getToken(),
      permissions: [],
      isAuthenticated: !!getToken(),
      loading: false,

      login: async (data: LoginRequest) => {
        set({ loading: true })
        try {
          const response = await login(data)
          const { token, user } = response.data
          setToken(token)
          setUser(user)
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          })
          return { token, user }
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logoutUser: async () => {
        set({ loading: true })
        try {
          await logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          clearAuth()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            permissions: [],
            loading: false,
          })
        }
      },

      fetchCurrentUser: async () => {
        set({ loading: true })
        try {
          const response = await getCurrentUser()
          const user = response.data
          setUser(user)
          set({
            user,
            isAuthenticated: true,
            loading: false,
          })
          return user
        } catch (error) {
          clearAuth()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            permissions: [],
            loading: false,
          })
          return null
        }
      },

      clearUserState: () => {
        clearAuth()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: [],
        })
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
