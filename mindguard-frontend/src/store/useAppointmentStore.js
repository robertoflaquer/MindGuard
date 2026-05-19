import { create } from 'zustand'
import api from '../services/api'

export const useAppointmentStore = create((set, get) => ({
  specialists: [],
  appointments: [],
  loading: false,
  error: null,

  fetchSpecialists: async () => {
    try {
      const { data } = await api.get('/api/appointments/specialists')
      set({ specialists: data.data })
    } catch {
      // falls back to static list in Treatment.jsx
    }
  },

  fetchAppointments: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/api/appointments')
      set({ appointments: data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createAppointment: async (payload) => {
    const { data } = await api.post('/api/appointments', payload)
    await get().fetchAppointments()
    return data.data
  },

  cancelAppointment: async (id) => {
    await api.patch(`/api/appointments/${id}/cancel`)
    await get().fetchAppointments()
  },

  getAvailableSlots: async (specialistId, date) => {
    const { data } = await api.get('/api/appointments/slots', { params: { specialistId, date } })
    return data.data
  },
}))
