// src/store/useAuthStore.js
import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  initialized: false,
  isLoading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('token')
    const userRaw = localStorage.getItem('user')
    if (token && userRaw) {
      try {
        set({ token, user: JSON.parse(userRaw), initialized: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ initialized: true })
      }
    } else {
      set({ initialized: true })
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/register', {
        email,
        password,
        fullName,
      })

      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      set({
        token: data.data.token,
        user: data.data.user,
        isLoading: false,
      })

      return data.data
    } catch (error) {
      const message = error.response?.data?.error || 'Erro no registro'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/login', { email, password })

      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      set({
        token: data.data.token,
        user: data.data.user,
        isLoading: false,
      })

      return data.data
    } catch (error) {
      const message = error.response?.data?.error || 'Erro no login'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
