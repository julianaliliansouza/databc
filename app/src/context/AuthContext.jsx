import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const u = localStorage.getItem('usuario')
    const t = localStorage.getItem('tenant')
    if (token && u && t) {
      setUsuario(JSON.parse(u))
      setTenant(JSON.parse(t))
    }
    setLoading(false)
  }, [])

  const login = async (email, senha, slug) => {
    const { data } = await api.post('/auth/login', { email, senha, slug })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    localStorage.setItem('tenant', JSON.stringify(data.tenant))
    setUsuario(data.usuario)
    setTenant(data.tenant)
    return data
  }

  const logout = () => {
    localStorage.clear()
    setUsuario(null)
    setTenant(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ usuario, tenant, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
