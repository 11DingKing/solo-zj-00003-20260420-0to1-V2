'use client'

import { useState, useEffect } from 'react'
import { technicianApi, Technician } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newTechnician, setNewTechnician] = useState({
    name: '',
    phone: '',
  })

  useEffect(() => {
    loadTechnicians()
  }, [])

  const loadTechnicians = async () => {
    setLoading(true)
    try {
      const response = await technicianApi.getAll()
      if (response.data.success) {
        setTechnicians(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load technicians:', error)
      toast.error('加载技师列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTechnician.name.trim()) {
      toast.error('请输入技师姓名')
      return
    }

    setSaving(true)
    try {
      const response = await technicianApi.create({
        name: newTechnician.name,
        phone: newTechnician.phone,
      })

      if (response.data.success) {
        toast.success('技师添加成功')
        setNewTechnician({ name: '', phone: '' })
        loadTechnicians()
      }
    } catch (error: any) {
      console.error('Failed to add technician:', error)
      toast.error(error.response?.data?.message || '添加技师失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTechnician = async (id: number) => {
    if (!confirm('确定要删除这个技师吗？')) {
      return
    }

    try {
      await technicianApi.delete(id)
      toast.success('技师已删除')
      loadTechnicians()
    } catch (error) {
      console.error('Failed to delete technician:', error)
      toast.error('删除技师失败')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">技师管理</h1>
        <Link 
          href="/admin" 
          className="text-blue-600 hover:text-blue-800"
        >
          ← 返回后台首页
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">添加技师</h2>
            
            <form onSubmit={handleAddTechnician} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTechnician.name}
                  onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                  placeholder="请输入技师姓名"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  手机号
                </label>
                <input
                  type="tel"
                  value={newTechnician.phone}
                  onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '添加中...' : '添加技师'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">技师列表</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>加载中...</p>
              </div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无技师记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        姓名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        手机号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {technicians.map((technician) => (
                      <tr key={technician.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {technician.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          {technician.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {technician.phone || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteTechnician(technician.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 添加技师后，可以在排班管理中为其设置工作时间段</li>
          <li>• 删除技师前，请确保该技师没有未完成的预约</li>
          <li>• 系统默认会创建3个示例技师：张师傅、李师傅、王师傅</li>
        </ul>
      </div>
    </div>
  )
}
