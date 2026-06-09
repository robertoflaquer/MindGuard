// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Questionnaires from './pages/Questionnaires'
import Contexts from './pages/Contexts'
import Treatment from './pages/Treatment'
import Prescriptions from './pages/Prescriptions'
import Enterprise from './pages/Enterprise'
import Metodologia from './pages/Metodologia'
import WeeklyReport from './pages/WeeklyReport'
import Connect from './pages/Connect'
import MedicoView from './pages/MedicoView'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

function PrivateRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const initialized = useAuthStore((state) => state.initialized)
  if (!initialized) return null
  return user ? children : <Navigate to="/login" />
}

// Mostra Welcome para deslogados; vai direto para Dashboard se já autenticado
function HomeRoute() {
  const user = useAuthStore((state) => state.user)
  const initialized = useAuthStore((state) => state.initialized)
  if (!initialized) return null
  return user ? <Navigate to="/dashboard" /> : <Welcome />
}

export default function App() {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    init()
  }, [])

  return (
    <ErrorBoundary>
      <Router>
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
          <Route
            path="/questionnaires"
            element={
              <PrivateRoute>
                <Questionnaires />
              </PrivateRoute>
            }
          />
          <Route
            path="/contexts"
            element={
              <PrivateRoute>
                <Contexts />
              </PrivateRoute>
            }
          />
          <Route
            path="/treatment"
            element={
              <PrivateRoute>
                <Treatment />
              </PrivateRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <PrivateRoute>
                <Prescriptions />
              </PrivateRoute>
            }
          />
          <Route path="/empresa" element={<Enterprise />} />
          <Route path="/metodologia" element={<Metodologia />} />
          <Route
            path="/medico"
            element={
              <PrivateRoute>
                <MedicoView />
              </PrivateRoute>
            }
          />
          <Route
            path="/conectar"
            element={
              <PrivateRoute>
                <Connect />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorio-semanal"
            element={
              <PrivateRoute>
                <WeeklyReport />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<HomeRoute />} />
        </Routes>
        <Toast />
      </Router>
    </ErrorBoundary>
  )
}
