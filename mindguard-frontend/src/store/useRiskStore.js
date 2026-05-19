// src/store/useRiskStore.js
import { create } from 'zustand'
import api from '../services/api'

export const useRiskStore = create((set) => ({
  currentRisk: null,
  isLoading: false,
  error: null,

  fetchCurrentRisk: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/api/risk/current')
      set({ currentRisk: data.data, isLoading: false })
      return data.data
    } catch (error) {
      set({ error: 'Erro ao buscar risco atual', isLoading: false })
      throw error
    }
  },
}))
