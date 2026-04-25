import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '美容美发预约系统',
  description: '一个完整的美容美发店预约管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              美容美发预约系统
            </Link>
            <div className="space-x-4">
              <Link href="/booking" className="hover:bg-blue-700 px-3 py-2 rounded">
                在线预约
              </Link>
              <Link href="/my-appointments" className="hover:bg-blue-700 px-3 py-2 rounded">
                我的预约
              </Link>
              <Link href="/admin" className="hover:bg-blue-700 px-3 py-2 rounded">
                管理后台
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
