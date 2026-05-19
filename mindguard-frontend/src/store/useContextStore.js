// src/store/useContextStore.js
import { create } from 'zustand'
import api from '../services/api'

export const useContextStore = create((set) => ({
  contextTypes: [],
  activeContexts: [],
  isLoading: false,
  error: null,

  fetchTypes: async () => {
    try {
      const { data } = await api.get('/api/contexts/types')
      set({ contextTypes: data.data })
    } catch (err) {
      set({ error: 'Erro ao buscar tipos de contexto' })
    }
  },

  fetchActive: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/api/contexts/active')
      set({ activeContexts: data.data, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: 'Erro ao buscar contextos ativos' })
    }
  },

  addContext: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/contexts', payload)
      set({ isLoading: false })
      return data.data
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao registrar contexto'
      set({ isLoading: false, error: msg })
      throw new Error(msg)
    }
  },

  closeContext: async (id) => {
    try {
      await api.patch(`/api/contexts/${id}/close`)
      set((s) => ({
        activeContexts: s.activeContexts.filter((c) => c.id !== id),
      }))
    } catch (err) {
      set({ error: 'Erro ao encerrar contexto' })
      throw err
    }
  },
}))
