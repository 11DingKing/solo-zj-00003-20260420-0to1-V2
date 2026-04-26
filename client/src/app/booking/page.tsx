'use client'

import { useState, useEffect } from 'react'
import { slotApi, appointmentApi, TechnicianSlots, TimeSlot } from '@/lib/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [technicianSlots, setTechnicianSlots] = useState<TechnicianSlots[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const loadSlots = async (date: string) => {
    setLoading(true)
    try {
      const response = await slotApi.getAvailable(date)
      if (response.data.success) {
        setTechnicianSlots(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load slots:', error)
      toast.error('加载时间段失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate)
      setSelectedTechnician(null)
      setSelectedSlot(null)
    }
  }, [selectedDate])

  const handleSlotClick = (technicianId: number, slot: TimeSlot) => {
    if (!slot.available) {
      return
    }
    setSelectedTechnician(technicianId)
    setSelectedSlot(slot)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTechnician || !selectedSlot) {
      toast.error('请选择技师和时间段')
      return
    }

    if (!customerName.trim()) {
      toast.error('请输入姓名')
      return
    }

    if (!customerPhone.trim() || !/^1[3-9]\d{9}$/.test(customerPhone)) {
      toast.error('请输入正确的手机号')
      return
    }

    setBookingLoading(true)
    try {
      const response = await appointmentApi.create({
        technician_id: selectedTechnician,
        customer_name: customerName,
        customer_phone: customerPhone,
        date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        status: 'pending',
      })

      if (response.data.success) {
        toast.success('预约成功！')
        setCustomerName('')
        setCustomerPhone('')
        setSelectedTechnician(null)
        setSelectedSlot(null)
        loadSlots(selectedDate)
      }
    } catch (error: any) {
      console.error('Failed to book appointment:', error)
      const status = error.response?.status
      const message = error.response?.data?.message || '预约失败'
      
      if (status === 409) {
        const conflict = error.response?.data?.conflict
        if (conflict) {
          toast.error(`时间段冲突：${conflict.date} ${conflict.start_time}-${conflict.end_time} 已被预约`, {
            duration: 4000,
          })
        } else {
          toast.error('该时间段已被预约，请选择其他时间', {
            duration: 4000,
          })
        }
      } else if (status === 400) {
        toast.error(message, { duration: 4000 })
      } else {
        toast.error(message)
      }
    } finally {
      setBookingLoading(false)
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">在线预约</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2">
            <label className="font-medium">选择日期：</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={dayjs().format('YYYY-MM-DD')}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">可用时间段</h2>
              
              {technicianSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>该日期暂无排班，请选择其他日期</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {technicianSlots.map((tech) => (
                    <div key={tech.technician_id} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-medium text-lg mb-3">{tech.technician_name}</h3>
                      
                      {tech.slots.length === 0 ? (
                        <p className="text-gray-500">该技师当天暂无排班</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {tech.slots.map((slot, index) => {
                            const isSelected = 
                              selectedTechnician === tech.technician_id && 
                              selectedSlot?.start_time === slot.start_time
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleSlotClick(tech.technician_id, slot)}
                                disabled={!slot.available}
                                className={`
                                  px-3 py-2 rounded text-sm font-medium transition-colors
                                  ${!slot.available 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  }
                                `}
                              >
                                <div>{slot.start_time} - {slot.end_time}</div>
                                <div className="text-xs">
                                  {slot.available ? `${slot.booked}/${slot.max}` : '已满'}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">预约信息</h2>
              
              {selectedTechnician && selectedSlot ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">技师：</span>
                      <span className="font-medium">
                        {technicianSlots.find(t => t.technician_id === selectedTechnician)?.technician_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">日期：</span>
                      <span className="font-medium">{dayjs(selectedDate).format('YYYY年MM月DD日')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">时间段：</span>
                      <span className="font-medium">{selectedSlot.start_time} - {selectedSlot.end_time}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="请输入您的姓名"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      手机号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="请输入您的手机号"
                      maxLength={11}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bookingLoading ? '提交中...' : '确认预约'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>请先选择技师和时间段</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
