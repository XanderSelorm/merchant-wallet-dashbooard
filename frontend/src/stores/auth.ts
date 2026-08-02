import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

import { http, getToken, setToken } from '@/lib/http'
import type { User } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)

  /** Resolve the current session once on app start. */
  async function init(): Promise<void> {
    if (initialized.value) return
    if (!getToken()) {
      initialized.value = true
      return
    }
    try {
      const { data } = await http.get<User>('/api/user')
      user.value = data
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error
      setToken(null)
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const { data } = await http.post<{ user: User; token: string }>('/api/login', { email, password })
    setToken(data.token)
    user.value = data.user
  }

  async function logout(): Promise<void> {
    await http.post('/api/logout')
    setToken(null)
    user.value = null
  }

  return { user, initialized, init, login, logout }
})
