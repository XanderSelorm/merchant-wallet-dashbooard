import { defineStore } from 'pinia'
import { ref } from 'vue'

import { http } from '@/lib/http'
import type { ReportSummary } from '@/types/api'

export interface ReportFilters {
  merchant_id?: number | ''
  date_from?: string
  date_to?: string
}

export const useReportsStore = defineStore('reports', () => {
  const summary = ref<ReportSummary | null>(null)
  const loading = ref(false)

  async function fetchSummary(filters: ReportFilters = {}): Promise<void> {
    loading.value = true
    try {
      const { data } = await http.get<ReportSummary>('/api/reports/summary', {
        params: {
          merchant_id: filters.merchant_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        },
      })
      summary.value = data
    } finally {
      loading.value = false
    }
  }

  return { summary, loading, fetchSummary }
})
