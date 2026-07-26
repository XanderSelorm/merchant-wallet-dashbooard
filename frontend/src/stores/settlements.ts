import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { http } from '@/lib/http'
import type { Paginated, Settlement } from '@/types/api'

export const useSettlementsStore = defineStore('settlements', () => {
  const list = ref<Settlement[]>([])
  const meta = ref<Paginated<Settlement>['meta'] | null>(null)
  const loading = ref(false)
  const running = ref(false)
  const filters = reactive({
    merchant_id: '' as number | '',
    date_from: '',
    date_to: '',
    page: 1,
  })

  async function fetchList(): Promise<void> {
    loading.value = true
    try {
      const { data } = await http.get<Paginated<Settlement>>('/api/settlements', {
        params: {
          merchant_id: filters.merchant_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          page: filters.page,
        },
      })
      list.value = data.data
      meta.value = data.meta
    } finally {
      loading.value = false
    }
  }

  /** Trigger the settlement sweep; returns the API's outcome message. */
  async function runSettlement(): Promise<{ message: string; count: number }> {
    running.value = true
    try {
      const { data } = await http.post<{ message: string; settlements: Settlement[] }>(
        '/api/settlements/run',
      )
      return { message: data.message, count: data.settlements.length }
    } finally {
      running.value = false
    }
  }

  return { list, meta, loading, running, filters, fetchList, runSettlement }
})
