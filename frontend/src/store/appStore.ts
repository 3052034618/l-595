import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'
import { getUnreadCount, getNotifications } from '@/services/notifications'

interface AppState {
  collapsed: boolean
  theme: 'light' | 'dark'
  loading: boolean
  notifications: Notification[]
  unreadCount: number
  currentPage: string
  setCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean) => void
  setCurrentPage: (page: string) => void
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markNotificationRead: (id: string) => void
  addNotification: (notification: Notification) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      theme: 'light',
      loading: false,
      notifications: [],
      unreadCount: 0,
      currentPage: '/',

      setCollapsed: (collapsed) => set({ collapsed }),
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setCurrentPage: (page) => set({ currentPage: page }),

      fetchNotifications: async () => {
        try {
          const response = await getNotifications({ pageSize: 10 })
          set({ notifications: response.data.items })
        } catch (error) {
          console.error('Fetch notifications error:', error)
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await getUnreadCount()
          set({ unreadCount: response.data })
        } catch (error) {
          console.error('Fetch unread count error:', error)
        }
      },

      markNotificationRead: (id) => {
        const { notifications } = get()
        const updated = notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        })
      },

      addNotification: (notification) => {
        const { notifications } = get()
        set({
          notifications: [notification, ...notifications].slice(0, 50),
          unreadCount: get().unreadCount + 1,
        })
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 })
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        collapsed: state.collapsed,
        theme: state.theme,
      }),
    }
  )
)
