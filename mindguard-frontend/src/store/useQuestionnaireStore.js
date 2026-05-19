// src/store/useQuestionnaireStore.js
import { create } from 'zustand'
import api from '../services/api'

export const useQuestionnaireStore = create((set) => ({
  due: [],
  history: [],
  isLoading: false,
  error: null,

  fetchDue: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/api/questionnaires/due')
      set({ due: data.data, isLoading: false })
      return data.data
    } catch (error) {
      set({ error: 'Erro ao buscar questionários pendentes', isLoading: false })
    }
  },

  fetchHistory: async (code = null, limit = 10) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams({ limit })
      if (code) params.set('code', code)
      const { data } = await api.get(`/api/questionnaires/history?${params}`)
      set({ history: data.data, isLoading: false })
      return data.data
    } catch (error) {
      set({ error: 'Erro ao buscar histórico', isLoading: false })
    }
  },

  submitQuestionnaire: async (questionnaireCode, responses, contextNotes = null) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/questionnaires/submit', {
        questionnaireCode,
        responses,
        contextNotes,
      })
      set({ isLoading: false })
      return data.data
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao enviar questionário'
      set({ error: message, isLoading: false })
      throw error
    }
  },
}))
