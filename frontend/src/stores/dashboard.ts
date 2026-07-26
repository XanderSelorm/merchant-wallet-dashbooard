import { defineStore } from 'pinia'
import { ref } from 'vue'

import { http } from '@/lib/http'
import type { DashboardSummary } from '@/types/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary | null>(null)
  const loading = ref(false)

  async function fetchSummary(): Promise<void> {
    loading.value = true
    try {
      const { data } = await http.get<DashboardSummary>('/api/dashboard/summary')
      summary.value = data
    } finally {
      loading.value = false
    }
  }

  return { summary, loading, fetchSummary }
})
