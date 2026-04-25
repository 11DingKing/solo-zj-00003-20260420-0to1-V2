'use client'

import { useState } from 'react'
import { appointmentApi, Appointment } from '@/lib/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function MyAppointmentsPage() {
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone.trim() || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号')
      return
    }

    setSearching(true)
    try {
      const response = await appointmentApi.getByPhone(phone)
      if (response.data.success) {
        setAppointments(response.data.data)
        setSearched(true)
        if (response.data.data.length === 0) {
          toast('暂无预约记录')
        }
      }
    } catch (error) {
      console.error('Failed to load appointments:', error)
      toast.error('加载预约记录失败')
    } finally {
      setSearching(false)
    }
  }

  const handleCancel = async (appointmentId: number) => {
    if (!confirm('确定要取消这个预约吗？')) {
      return
    }

    setLoading(true)
    try {
      const response = await appointmentApi.cancel(appointmentId)
      if (response.data.success) {
        toast.success('预约已取消')
        setAppointments(prev => prev.map(a => 
          a.id === appointmentId ? { ...a, status: 'cancelled' } : a
        ))
      }
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error)
      toast.error(error.response?.data?.message || '取消预约失败')
    } finally {
      setLoading(false)
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

  const canCancel = (appointment: Appointment) => {
    return appointment.status !== 'cancelled' && appointment.status !== 'completed'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">我的预约</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              手机号查询
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入预约时使用的手机号"
              maxLength={11}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={searching}
              className="w-full sm:w-auto bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {searching ? '查询中...' : '查询'}
            </button>
          </div>
        </form>
      </div>

      {searched && (
        <div className="bg-white rounded-lg shadow">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">暂无预约记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间段
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      技师
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {dayjs(appointment.date).format('YYYY年MM月DD日')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {appointment.start_time} - {appointment.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {appointment.technician?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {canCancel(appointment) ? (
                          <button
                            onClick={() => handleCancel(appointment.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            取消预约
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">温馨提示</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 预约前2小时内无法取消预约</li>
          <li>• 如需取消预约，请提前2小时操作</li>
          <li>• 如有问题，请联系客服</li>
        </ul>
      </div>
    </div>
  )
}
