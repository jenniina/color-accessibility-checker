import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type AuthUser = {
  _id: string
  username: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  login: (args: { username: string; password: string }) => Promise<void>
  register: (args: { username: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LS_TOKEN = 'accessible-colors.token'
const LS_USER = 'accessible-colors.user'

type AuthResponse = {
  success: boolean
  user?: AuthUser
  token?: string
  message?: string
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as T) : ({} as T)

  if (!res.ok) {
    const msg = (data as unknown as { message?: string })?.message
    throw new Error(msg || `Request failed (${res.status})`)
  }

  return data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedToken = window.localStorage.getItem(LS_TOKEN)
      const storedUser = window.localStorage.getItem(LS_USER)
      if (storedToken) setToken(storedToken)
      if (storedUser) setUser(JSON.parse(storedUser) as AuthUser)
    } catch {
      // ignore
    }
  }, [])

  const persist = useCallback((nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser)
    setToken(nextToken)
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LS_TOKEN, nextToken)
    window.localStorage.setItem(LS_USER, JSON.stringify(nextUser))
  }, [])

  const login = useCallback(
    async ({ username, password }: { username: string; password: string }) => {
      const data = await postJson<AuthResponse>('/api/login', {
        username,
        password,
      })
      if (!data.user || !data.token)
        throw new Error(data.message || 'Login failed')
      persist(data.user, data.token)
    },
    [persist]
  )

  const register = useCallback(
    async ({ username, password }: { username: string; password: string }) => {
      const data = await postJson<AuthResponse>('/api/users/register', {
        username,
        password,
      })
      if (!data.user || !data.token)
        throw new Error(data.message || 'Register failed')
      persist(data.user, data.token)
    },
    [persist]
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(LS_TOKEN)
    window.localStorage.removeItem(LS_USER)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, login, register, logout }),
    [user, token, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      user: null,
      token: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
    } as AuthContextValue
  }
  return ctx
}
