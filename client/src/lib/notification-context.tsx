'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notificationApi, Notification } from '@/lib/api'

interface NotificationUser {
  receiverId: string
  receiverType: 'technician' | 'customer'
}

interface NotificationContextType {
  unreadCount: number
  notifications: Notification[]
  user: NotificationUser | null
  isConnected: boolean
  setUser: (user: NotificationUser | null) => void
  loadNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<NotificationUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connectSSE = useCallback(() => {
    if (!user) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.host
    const url = `${protocol}//${host}/api/notifications/stream?receiver_id=${encodeURIComponent(user.receiverId)}&receiver_type=${user.receiverType}`

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'unread_count') {
          setUnreadCount(data.count)
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', e)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      setTimeout(() => {
        if (user) {
          connectSSE()
        }
      }, 3000)
    }
  }, [user])

  const loadNotifications = useCallback(async () => {
    if (!user) return

    try {
      const response = await notificationApi.getAll({
        receiver_id: user.receiverId,
        receiver_type: user.receiverType,
        page_size: 50,
      })

      if (response.data.success) {
        const sorted = [...response.data.data].sort((a, b) => {
          if (a.is_read !== b.is_read) {
            return a.is_read ? 1 : -1
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        setNotifications(sorted)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [user])

  const markAsRead = useCallback(async (id: number) => {
    try {
      const response = await notificationApi.markAsRead(id)
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        )
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const response = await notificationApi.markAllAsRead({
        receiver_id: user.receiverId,
        receiver_type: user.receiverType,
      })
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        )
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      connectSSE()
      loadNotifications()
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
      setUnreadCount(0)
      setNotifications([])
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [user, connectSSE, loadNotifications])

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    user,
    isConnected,
    setUser,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
