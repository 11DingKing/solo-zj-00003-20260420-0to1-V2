import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Technician {
  id: number
  name: string
  phone: string
}

export interface Schedule {
  id: number
  technician_id: number
  date: string
  start_time: string
  end_time: string
  technician?: Technician
}

export interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
  booked: number
  max: number
}

export interface TechnicianSlots {
  technician_id: number
  technician_name: string
  slots: TimeSlot[]
}

export interface Appointment {
  id: number
  technician_id: number
  customer_name: string
  customer_phone: string
  date: string
  start_time: string
  end_time: string
  status: string
  created_at: string
  technician?: Technician
}

export const technicianApi = {
  getAll: () => api.get<{ success: boolean; data: Technician[] }>('/technicians'),
  getById: (id: number) => api.get<{ success: boolean; data: Technician }>(`/technicians/${id}`),
  create: (data: Omit<Technician, 'id'>) => api.post<{ success: boolean; data: Technician }>('/technicians', data),
  update: (id: number, data: Partial<Technician>) => api.put<{ success: boolean; data: Technician }>(`/technicians/${id}`, data),
  delete: (id: number) => api.delete(`/technicians/${id}`),
}

export const scheduleApi = {
  getAll: (params?: { date?: string; technician_id?: string }) => 
    api.get<{ success: boolean; data: Schedule[] }>('/schedules', { params }),
  getById: (id: number) => api.get<{ success: boolean; data: Schedule }>(`/schedules/${id}`),
  create: (data: Omit<Schedule, 'id' | 'technician'>) => 
    api.post<{ success: boolean; data: Schedule }>('/schedules', data),
  update: (id: number, data: Partial<Schedule>) => 
    api.put<{ success: boolean; data: Schedule }>(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
  getByTechnicianAndDate: (technicianId: number, date: string) => 
    api.get<{ success: boolean; data: Schedule[] }>(`/schedules/technician/${technicianId}/${date}`),
}

export const slotApi = {
  getAvailable: (date: string) => 
    api.get<{ success: boolean; data: TechnicianSlots[] }>(`/slots/${date}`),
}

export const appointmentApi = {
  getAll: (params?: { date?: string; technician_id?: string; status?: string }) => 
    api.get<{ success: boolean; data: Appointment[] }>('/appointments', { params }),
  getById: (id: number) => api.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`),
  create: (data: Omit<Appointment, 'id' | 'created_at' | 'technician'>) => 
    api.post<{ success: boolean; data: Appointment }>('/appointments', data),
  update: (id: number, data: Partial<Appointment>) => 
    api.put<{ success: boolean; data: Appointment }>(`/appointments/${id}`, data),
  delete: (id: number) => api.delete(`/appointments/${id}`),
  confirm: (id: number) => api.put<{ success: boolean; data: Appointment }>(`/appointments/${id}/confirm`),
  complete: (id: number) => api.put<{ success: boolean; data: Appointment }>(`/appointments/${id}/complete`),
  cancel: (id: number) => api.put<{ success: boolean; data: Appointment }>(`/appointments/${id}/cancel`),
  getByPhone: (phone: string) => 
    api.get<{ success: boolean; data: Appointment[] }>(`/appointments/customer/${phone}`),
}

export default api
