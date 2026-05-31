# Frontend (React + Vite)

## Estrutura de Pastas (estado atual)

```
mindguard-frontend/
├── src/
│   ├── main.jsx              — Entry point
│   ├── App.jsx               — Router + PrivateRoute
│   ├── index.css             — CSS Variables (dark/light) + Tailwind + animações
│   ├── services/
│   │   └── api.js            — Axios + interceptors (token, 401 auto-logout)
│   ├── store/
│   │   ├── useAuthStore.js        — user, token, login, logout, init
│   │   ├── useSignalStore.js      — signals, signalTypes, ingestSignals
│   │   ├── useRiskStore.js        — currentRisk, fetchCurrentRisk
│   │   ├── useQuestionnaireStore.js — due, history, submitQuestionnaire
│   │   ├── useThemeStore.js       — isDark, toggle (persiste localStorage, sem flash)
│   │   ├── useToastStore.js       — addToast, removeToast (fila global)
│   │   └── useAppointmentStore.js — specialists, appointments, createAppointment, getSlots
│   ├── pages/
│   │   ├── Login.jsx         — Glass card + rings animados
│   │   ├── Register.jsx      — Mesmo visual do Login
│   │   ├── Dashboard.jsx     — Abas: Visão Geral / Registrar Sinais + botão Simular Wearable
│   │   ├── Questionnaires.jsx — Lista + formulários + histórico
│   │   ├── Contexts.jsx      — Contextos ativos + cadastro
│   │   ├── Treatment.jsx     — Agendamento real (3 steps) integrado ao backend
│   │   └── Prescriptions.jsx — Lista de prescrições com hash SHA-256 de auditoria
│   └── components/
│       ├── RiskCard.jsx          — Gauge SVG circular + nível + fatores
│       ├── SignalForm.jsx         — Multi-sinais com nomes em português
│       ├── SignalChart.jsx        — Grid de sparklines por tipo de sinal
│       ├── PSSForm.jsx            — PSS-10 (10 perguntas, escala 0-4)
│       ├── CBIForm.jsx            — CBI (19 itens, 3 seções)
│       ├── OLBIForm.jsx           — OLBI (16 itens, subscalas E/D)
│       ├── DailyCheckinForm.jsx   — Check-in diário (0-10)
│       ├── GAD7Form.jsx           — GAD-7 Ansiedade (7 perguntas, escala 0-3, score 0–21)
│       ├── Toast.jsx              — Notificações globais
│       └── ErrorBoundary.jsx      — Fallback para crashes
├── index.html            — Inclui Google Fonts (Nunito)
├── vite.config.js
├── tailwind.config.js    — fontFamily: { display: Nunito, sans: Nunito }
├── postcss.config.js
└── package.json
```

### Rotas (App.jsx)

| Rota | Componente | Protegida |
|------|-----------|-----------|
| `/login` | Login | Não |
| `/register` | Register | Não |
| `/dashboard` | Dashboard | Sim |
| `/questionnaires` | Questionnaires | Sim |
| `/contexts` | Contexts | Sim |
| `/treatment` | Treatment | Sim |
| `/prescriptions` | Prescriptions | Sim |
| `/` | → `/dashboard` | — |

---

## API Service (axios)

### services/api.js

```javascript
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

const api = axios.create({
  // Em dev, VITE_API_URL fica vazio e o Vite proxy resolve /api → http://localhost:3000
  // Em produção (Railway), VITE_API_URL é a URL absoluta do backend
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000
})

// Interceptor de Request - Adicionar token
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de Response - Tratar erros
api.interceptors.response.use(
  response => response,
  error => {
    // Se 401, limpar token e redirecionar para login
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## Stores (Zustand)

### useAuthStore

```javascript
import create from 'zustand'

export const useAuthStore = create((set) => ({
  // State
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Async
  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/register', {
        email, password, fullName
      })
      set({
        user: data.data.user,
        token: data.data.token,
        isLoading: false
      })
      useAuthStore.getState().setToken(data.data.token)
    } catch (err) {
      set({ error: err.response?.data?.error, isLoading: false })
      throw err
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/login', {
        email, password
      })
      set({
        user: data.data.user,
        token: data.data.token,
        isLoading: false
      })
      useAuthStore.getState().setToken(data.data.token)
    } catch (err) {
      set({ error: err.response?.data?.error, isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  }
}))
```

### useSignalStore

```javascript
export const useSignalStore = create((set) => ({
  signals: [],
  signalTypes: [],
  isLoading: false,

  setSignals: (signals) => set({ signals }),
  setSignalTypes: (types) => set({ signalTypes: types }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchSignalTypes: async () => {
    try {
      const { data } = await api.get('/api/signals/types')
      set({ signalTypes: data.data })
    } catch (err) {
      console.error('Error fetching signal types:', err)
    }
  },

  fetchRecentSignals: async (type, limit = 30) => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/api/signals/recent', {
        params: { type, limit }
      })
      set({ signals: data.data, isLoading: false })
    } catch (err) {
      console.error('Error fetching signals:', err)
      set({ isLoading: false })
    }
  },

  ingestSignals: async (signals) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/api/signals/batch', { signals })
      set({
        signals: data.data.signals,
        isLoading: false
      })
      return data
    } catch (err) {
      console.error('Error ingesting signals:', err)
      set({ isLoading: false })
      throw err
    }
  }
}))
```

### useRiskStore

```javascript
export const useRiskStore = create((set) => ({
  currentRisk: null,
  riskHistory: [],
  isLoading: false,

  setCurrentRisk: (risk) => set({ currentRisk: risk }),
  setRiskHistory: (history) => set({ riskHistory: history }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchCurrentRisk: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/api/risk/current')
      set({ currentRisk: data.data, isLoading: false })
    } catch (err) {
      console.error('Error fetching risk:', err)
      set({ isLoading: false })
    }
  },

  fetchRiskHistory: async (limit = 30, days = 30) => {
    try {
      const { data } = await api.get('/api/risk/history', {
        params: { limit, days }
      })
      set({ riskHistory: data.data })
    } catch (err) {
      console.error('Error fetching history:', err)
    }
  },

  assessRisk: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/api/risk/assess')
      set({ currentRisk: data.data, isLoading: false })
      await useRiskStore.getState().fetchRiskHistory()
      return data
    } catch (err) {
      console.error('Error assessing risk:', err)
      set({ isLoading: false })
      throw err
    }
  }
}))
```

---

## Pages

### Login.jsx

```javascript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const error = useAuthStore(s => s.error)
  const isLoading = useAuthStore(s => s.isLoading)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      // Error tratado no store
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">MindGuard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center mt-4">
          Não tem conta? <a href="/register" className="text-blue-500 hover:underline">Criar</a>
        </p>
      </form>
    </div>
  )
}
```

### Dashboard.jsx

```javascript
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useSignalStore } from '../store/useSignalStore'
import { useRiskStore } from '../store/useRiskStore'
import RiskCard from '../components/RiskCard'
import SignalForm from '../components/SignalForm'
import SignalChart from '../components/SignalChart'

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const currentRisk = useRiskStore(s => s.currentRisk)
  const fetchCurrentRisk = useRiskStore(s => s.fetchCurrentRisk)
  const signals = useSignalStore(s => s.signals)
  const fetchRecentSignals = useSignalStore(s => s.fetchRecentSignals)
  
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchCurrentRisk()
    fetchRecentSignals('HRV', 30)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-600">MindGuard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.fullName}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'register'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Registrar Sinais
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Risk Card */}
            <RiskCard risk={currentRisk} />
            
            {/* Chart */}
            {signals.length > 0 && <SignalChart signals={signals} />}
          </div>
        )}

        {activeTab === 'register' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Registrar Sinais</h2>
            <SignalForm />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Components

### RiskCard.jsx

```javascript
export default function RiskCard({ risk }) {
  if (!risk) {
    return (
      <div className="bg-gray-100 p-8 rounded-lg text-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  const riskColors = {
    stable: 'bg-green-500',
    attention: 'bg-yellow-500',
    elevated_risk: 'bg-orange-500',
    high_risk: 'bg-red-500'
  }

  const color = riskColors[risk.risk_level] || 'bg-gray-500'

  return (
    <div className={`${color} p-8 rounded-lg shadow-lg text-white`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm opacity-90">Nível de Risco</p>
          <h2 className="text-4xl font-bold">{risk.risk_level_name}</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{risk.risk_score.toFixed(1)}</p>
          <p className="text-xs opacity-75">/100</p>
        </div>
      </div>
      
      <p className="mb-4">{risk.primary_explanation}</p>
      
      {risk.recommended_action && (
        <button className="bg-white text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-100">
          {risk.recommended_action}
        </button>
      )}
    </div>
  )
}
```

### SignalForm.jsx

```javascript
import { useState } from 'react'
import { useSignalStore } from '../store/useSignalStore'

export default function SignalForm() {
  const ingestSignals = useSignalStore(s => s.ingestSignals)
  const signalTypes = useSignalStore(s => s.signalTypes)
  const isLoading = useSignalStore(s => s.isLoading)
  
  const [formData, setFormData] = useState({
    signalType: 'HRV',
    value: '',
    timestamp: new Date().toISOString()
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await ingestSignals([formData])
      alert('Sinal registrado com sucesso!')
      setFormData({ signalType: 'HRV', value: '', timestamp: new Date().toISOString() })
    } catch (err) {
      alert('Erro ao registrar sinal')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-2">Tipo de Sinal</label>
        <select
          name="signalType"
          value={formData.signalType}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          {signalTypes.map(st => (
            <option key={st.id} value={st.name}>{st.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-2">Valor</label>
        <input
          type="number"
          step="0.1"
          name="value"
          value={formData.value}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Registrando...' : 'Registrar Sinal'}
      </button>
    </form>
  )
}
```

### SignalChart.jsx

```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function SignalChart({ signals }) {
  if (!signals.length) return null

  const data = signals
    .slice()
    .reverse()
    .map(s => ({
      timestamp: new Date(s.timestamp).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat(s.value)
    }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Histórico de Sinais</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

## App.jsx (Router)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

---

## Fluxo de Autenticação no Frontend

```
1. Usuário clica "Entrar"
   ↓
2. handleSubmit() chama login() do store
   ↓
3. Store faz POST /api/auth/login
   ↓
4. Backend retorna {user, token}
   ↓
5. Store salva em localStorage
   ↓
6. useAuthStore.setToken() atualiza estado
   ↓
7. Component redireciona para /dashboard
   ↓
8. Todos requests HTTP incluem token via interceptor
   ↓
9. Se token expira (401), logout automático
```


[[Arquitetura]]
[[Guia-Contribuicao]]
[[Problemas-Solucoes]]
[[Backend]]
[[Database]]
[[Setup-Instalacao]]