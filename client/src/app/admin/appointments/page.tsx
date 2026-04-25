'use client'

import { useState, useEffect } from 'react'
import { appointmentApi, technicianApi, Appointment, Technician } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import dayjs from 'dayjs'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const [filters, setFilters] = useState({
    date: '',
    technician_id: '',
    status: '',
  })

  useEffect(() => {
    loadTechnicians()
    loadAppointments()
  }, [filters])

  const loadTechnicians = async () => {
    try {
      const response = await technicianApi.getAll()
      if (response.data.success) {
        setTechnicians(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load technicians:', error)
    }
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const params: { date?: string; technician_id?: string; status?: string } = {}
      if (filters.date) params.date = filters.date
      if (filters.technician_id) params.technician_id = filters.technician_id
      if (filters.status) params.status = filters.status

      const response = await appointmentApi.getAll(params)
      if (response.data.success) {
        setAppointments(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load appointments:', error)
      toast.error('加载预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (id: number) => {
    if (!confirm('确定要确认这个预约吗？')) {
      return
    }

    setActionLoading(id)
    try {
      const response = await appointmentApi.confirm(id)
      if (response.data.success) {
        toast.success('预约已确认')
        setAppointments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'confirmed' } : a
        ))
      }
    } catch (error: any) {
      console.error('Failed to confirm appointment:', error)
      toast.error(error.response?.data?.message || '确认预约失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (id: number) => {
    if (!confirm('确定要标记这个预约为已完成吗？')) {
      return
    }

    setActionLoading(id)
    try {
      const response = await appointmentApi.complete(id)
      if (response.data.success) {
        toast.success('预约已完成')
        setAppointments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'completed' } : a
        ))
      }
    } catch (error: any) {
      console.error('Failed to complete appointment:', error)
      toast.error(error.response?.data?.message || '完成预约失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('确定要取消这个预约吗？')) {
      return
    }

    setActionLoading(id)
    try {
      const response = await appointmentApi.cancel(id)
      if (response.data.success) {
        toast.success('预约已取消')
        setAppointments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'cancelled' } : a
        ))
      }
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error)
      toast.error(error.response?.data?.message || '取消预约失败')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待确认'
      case 'confirmed':
        return '已确认'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  const getAvailableActions = (appointment: Appointment) => {
    const actions: { label: string; onClick: () => void; class: string }[] = []

    switch (appointment.status) {
      case 'pending':
        actions.push({
          label: '确认',
          onClick: () => handleConfirm(appointment.id),
          class: 'text-green-600 hover:text-green-900',
        })
        actions.push({
          label: '取消',
          onClick: () => handleCancel(appointment.id),
          class: 'text-red-600 hover:text-red-900',
        })
        break
      case 'confirmed':
        actions.push({
          label: '完成',
          onClick: () => handleComplete(appointment.id),
          class: 'text-blue-600 hover:text-blue-900',
        })
        actions.push({
          label: '取消',
          onClick: () => handleCancel(appointment.id),
          class: 'text-red-600 hover:text-red-900',
        })
        break
      default:
        break
    }

    return actions
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">预约管理</h1>
        <Link 
          href="/admin" 
          className="text-blue-600 hover:text-blue-800"
        >
          ← 返回后台首页
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">筛选条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              技师
            </label>
            <select
              value={filters.technician_id}
              onChange={(e) => setFilters({ ...filters, technician_id: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部技师</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ date: '', technician_id: '', status: '' })}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">暂无预约记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间段
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    技师
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客户
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    手机号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => {
                  const actions = getAvailableActions(appointment)
                  const isLoading = actionLoading === appointment.id

                  return (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {dayjs(appointment.date).format('YYYY年MM月DD日')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {appointment.start_time} - {appointment.end_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {appointment.technician?.name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {appointment.customer_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {appointment.customer_phone}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {isLoading ? (
                          <span className="text-gray-400">处理中...</span>
                        ) : actions.length > 0 ? (
                          <div className="flex gap-3">
                            {actions.map((action, index) => (
                              <button
                                key={index}
                                onClick={action.onClick}
                                className={action.class}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-2">状态说明</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">待确认</span>
            <span className="text-gray-600">客户已提交，等待确认</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">已确认</span>
            <span className="text-gray-600">已确认预约</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">已完成</span>
            <span className="text-gray-600">服务已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">已取消</span>
            <span className="text-gray-600">预约已取消</span>
          </div>
        </div>
      </div>
    </div>
  )
}
