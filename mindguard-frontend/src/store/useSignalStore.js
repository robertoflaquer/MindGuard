// src/store/useSignalStore.js
import { create } from 'zustand'
import api from '../services/api'

export const useSignalStore = create((set) => ({
  signals: [],
  signalTypes: [],
  isLoading: false,
  error: null,

  fetchSignalTypes: async () => {
    try {
      const { data } = await api.get('/api/signals/types')
      set({ signalTypes: data.data })
    } catch (error) {
      set({ error: 'Erro ao buscar tipos de sinais' })
    }
  },

  fetchRecentSignals: async (type = null, limit = 30) => {
    set({ isLoading: true, error: null })
    try {
      const url = `/api/signals/recent?limit=${limit}${type ? `&type=${type}` : ''}`
      const { data } = await api.get(url)
      set({ signals: data.data, isLoading: false })
      return data.data
    } catch (error) {
      set({ error: 'Erro ao buscar sinais', isLoading: false })
      throw error
    }
  },

  ingestSignals: async (signals) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/signals/batch', { signals })
      set({ isLoading: false })
      return data.data
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao enviar sinais'
      set({ error: message, isLoading: false })
      throw error
    }
  },

}))
