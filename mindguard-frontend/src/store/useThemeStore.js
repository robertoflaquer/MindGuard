// src/store/useThemeStore.js
import { create } from 'zustand'

function applyTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  try { localStorage.setItem('mg-theme', isDark ? 'dark' : 'light') } catch {}
}

function readSaved() {
  try { return localStorage.getItem('mg-theme') } catch { return null }
}

const saved = readSaved()
const initialDark = saved ? saved === 'dark' : true  // default: dark

// Apply immediately to avoid flash of wrong theme
applyTheme(initialDark)

export const useThemeStore = create((set) => ({
  isDark: initialDark,
  toggle: () => set((s) => {
    const next = !s.isDark
    applyTheme(next)
    return { isDark: next }
  }),
  setDark: (isDark) => set(() => {
    applyTheme(isDark)
    return { isDark }
  }),
}))
