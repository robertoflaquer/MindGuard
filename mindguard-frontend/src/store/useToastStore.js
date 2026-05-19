// src/store/useToastStore.js
import { create } from 'zustand'

let _nextId = 0

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (type, message, duration = 4000) => {
    const id = ++_nextId
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
