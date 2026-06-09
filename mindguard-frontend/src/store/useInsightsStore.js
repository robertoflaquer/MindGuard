// store/useInsightsStore.js
import { create } from 'zustand'
import api from '../services/api'

export const useInsightsStore = create((set, get) => ({
  recommendations: [],
  weeklyNarrative: null,
  loading: false,
  error: null,

  fetchInsights: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const res = await api.get('/api/insights')
      set({
        recommendations: res.data.data.recommendations || [],
        weeklyNarrative: res.data.data.weekly_narrative || null,
        loading: false,
      })
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },
}))
