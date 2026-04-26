'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotification } from '@/lib/notification-context'
import { useRouter } from 'next/navigation'
import { Notification } from '@/lib/api'
import dayjs from 'dayjs'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [userType, setUserType] = useState<'technician' | 'customer'>('technician')
  const [inputValue, setInputValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const { 
    unreadCount, 
    notifications, 
    user, 
    setUser, 
    markAsRead, 
    markAllAsRead,
    loadNotifications 
  } = useNotification()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleConnect = () => {
    if (!inputValue.trim()) return
    
    setUser({
      receiverId: inputValue.trim(),
      receiverType: userType,
    })
  }

  const handleDisconnect = () => {
    setUser(null)
    setInputValue('')
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    if (notification.appointment_id) {
      setIsOpen(false)
      router.push(`/admin/appointments`)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const formatTime = (dateStr: string) => {
    return dayjs(dateStr).format('MM-DD HH:mm')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment_created':
        return '📅'
      case 'appointment_cancelled':
        return '❌'
      case 'schedule_changed':
        return '🔄'
      default:
        return '🔔'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'appointment_created':
        return '新预约'
      case 'appointment_cancelled':
        return '预约取消'
      case 'schedule_changed':
        return '排班变更'
      default:
        return '通知'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full min-w-[1.25rem]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">通知中心</h3>
          </div>

          {!user ? (
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setUserType('technician')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                    userType === 'technician'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  技师身份
                </button>
                <button
                  onClick={() => setUserType('customer')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                    userType === 'customer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  客户身份
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {userType === 'technician' ? '技师ID' : '手机号'}
                </label>
                <input
                  type={userType === 'technician' ? 'number' : 'tel'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={userType === 'technician' ? '请输入技师ID' : '请输入手机号'}
                  maxLength={userType === 'customer' ? 11 : undefined}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <button
                onClick={handleConnect}
                disabled={!inputValue.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                查看通知
              </button>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {user.receiverType === 'technician' ? '技师' : '客户'}: {user.receiverId}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  切换
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>暂无通知</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer transition-colors ${
                          notification.is_read
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{getTypeIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${
                                notification.is_read ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </span>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className={`text-sm mb-1 line-clamp-2 ${
                              notification.is_read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.content}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                {getTypeLabel(notification.type)}
                              </span>
                              <span>{formatTime(notification.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    全部标记已读
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
