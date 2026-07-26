import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

import { http, ensureCsrf } from '@/lib/http'
import type { User } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)

  /** Resolve the current session once on app start. */
  async function init(): Promise<void> {
    if (initialized.value) return
    try {
      const { data } = await http.get<User>('/api/user')
      user.value = data
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function login(email: string, password: string): Promise<void> {
    await ensureCsrf()
    const { data } = await http.post<{ user: User }>('/login', { email, password })
    user.value = data.user
  }

  async function logout(): Promise<void> {
    await http.post('/logout')
    user.value = null
  }

  return { user, initialized, init, login, logout }
})
