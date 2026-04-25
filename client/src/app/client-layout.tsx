'use client'

import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { NotificationProvider } from '@/lib/notification-context'
import NotificationBell from '@/components/NotificationBell'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            美容美发预约系统
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/booking"
              className="hover:bg-blue-700 px-3 py-2 rounded"
            >
              在线预约
            </Link>
            <Link
              href="/my-appointments"
              className="hover:bg-blue-700 px-3 py-2 rounded"
            >
              我的预约
            </Link>
            <Link
              href="/admin"
              className="hover:bg-blue-700 px-3 py-2 rounded"
            >
              管理后台
            </Link>
            <NotificationBell />
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">{children}</main>
      <Toaster />
    </NotificationProvider>
  )
}
