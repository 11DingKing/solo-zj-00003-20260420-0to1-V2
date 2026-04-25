'use client'

import { useState, useEffect } from 'react'
import { technicianApi, scheduleApi, Technician, Schedule } from '@/lib/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import Link from 'next/link'

const timeToMinutes = (timeStr: string): number => {
  const [hour, minute] = timeStr.split(':').map(Number)
  return hour * 60 + minute
}

export default function SchedulePage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState<number | ''>('')
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newSchedule, setNewSchedule] = useState({
    technician_id: '',
    date: dayjs().format('YYYY-MM-DD'),
    start_time: '09:00',
    end_time: '12:00',
  })

  const timeOptions = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00',
  ]

  useEffect(() => {
    loadTechnicians()
  }, [])

  useEffect(() => {
    loadSchedules()
  }, [selectedTechnician, selectedDate])

  const loadTechnicians = async () => {
    try {
      const response = await technicianApi.getAll()
      if (response.data.success) {
        setTechnicians(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load technicians:', error)
      toast.error('加载技师列表失败')
    }
  }

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const params: { date?: string; technician_id?: string } = {}
      if (selectedDate) params.date = selectedDate
      if (selectedTechnician) params.technician_id = String(selectedTechnician)

      const response = await scheduleApi.getAll(params)
      if (response.data.success) {
        setSchedules(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load schedules:', error)
      toast.error('加载排班列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSchedule.technician_id) {
      toast.error('请选择技师')
      return
    }

    if (timeToMinutes(newSchedule.start_time) >= timeToMinutes(newSchedule.end_time)) {
      toast.error('开始时间必须早于结束时间')
      return
    }

    setSaving(true)
    try {
      const response = await scheduleApi.create({
        technician_id: Number(newSchedule.technician_id),
        date: newSchedule.date,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
      })

      if (response.data.success) {
        toast.success('排班添加成功')
        loadSchedules()
        setNewSchedule({
          technician_id: '',
          date: dayjs().format('YYYY-MM-DD'),
          start_time: '09:00',
          end_time: '12:00',
        })
      }
    } catch (error: any) {
      console.error('Failed to add schedule:', error)
      toast.error(error.response?.data?.message || '添加排班失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('确定要删除这个排班吗？')) {
      return
    }

    try {
      await scheduleApi.delete(id)
      toast.success('排班已删除')
      loadSchedules()
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      toast.error('删除排班失败')
    }
  }

  const getTechnicianName = (id: number) => {
    return technicians.find(t => t.id === id)?.name || '未知技师'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">排班管理</h1>
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
            <h2 className="text-xl font-semibold mb-4">添加排班</h2>
            
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  技师 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSchedule.technician_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, technician_id: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择技师</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  min={dayjs().format('YYYY-MM-DD')}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 rounded p-3 text-sm text-blue-700">
                <p><strong>说明：</strong></p>
                <ul className="list-disc list-inside mt-1">
                  <li>时间段将按30分钟切割成可预约的slot</li>
                  <li>例如：9:0-12:0 将生成 9:0-9:30, 9:30-10:0 等时间段</li>
                  <li>可以为同一天设置多个时间段（如上午和下午）</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '添加中...' : '添加排班'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
              <h2 className="text-xl font-semibold">排班列表</h2>
              
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value ? Number(e.target.value) : '')}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部技师</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>加载中...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无排班记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        技师
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间段
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {getTechnicianName(schedule.technician_id)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {schedule.date}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {schedule.start_time} - {schedule.end_time}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
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
    </div>
  )
}
