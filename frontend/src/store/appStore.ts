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
  pollingInterval: NodeJS.Timeout | null
  setCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean) => void
  setCurrentPage: (page: string) => void
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markNotificationRead: (id: string) => void
  addNotification: (notification: Notification) => void
  clearNotifications: () => void
  startPolling: () => void
  stopPolling: () => void
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
      pollingInterval: null,

      setCollapsed: (collapsed) => set({ collapsed }),
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setCurrentPage: (page) => set({ currentPage: page }),

      fetchNotifications: async () => {
        try {
          const response = await getNotifications({ pageSize: 10 })
          set({
            notifications: response.data.items,
            unreadCount: response.data.unreadCount,
          })
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

      startPolling: () => {
        const { pollingInterval, fetchUnreadCount } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        const interval = setInterval(() => {
          fetchUnreadCount()
        }, 30000)
        set({ pollingInterval: interval })
      },

      stopPolling: () => {
        const { pollingInterval } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
          set({ pollingInterval: null })
        }
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
