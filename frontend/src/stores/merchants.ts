import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { http } from '@/lib/http'
import type { Merchant, MerchantStatus, Paginated, Settlement, Transaction } from '@/types/api'

export interface MerchantPayload {
  name: string
  email: string
  business_name: string
  account_number: string
  bank_name: string
}

export const useMerchantsStore = defineStore('merchants', () => {
  const list = ref<Merchant[]>([])
  const meta = ref<Paginated<Merchant>['meta'] | null>(null)
  const loading = ref(false)
  const filters = reactive({ search: '', status: '' as MerchantStatus | '', page: 1 })

  const current = ref<Merchant | null>(null)
  const currentTransactions = ref<Paginated<Transaction> | null>(null)
  const currentSettlements = ref<Paginated<Settlement> | null>(null)

  async function fetchList(): Promise<void> {
    loading.value = true
    try {
      const { data } = await http.get<Paginated<Merchant>>('/api/merchants', {
        params: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          page: filters.page,
        },
      })
      list.value = data.data
      meta.value = data.meta
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number): Promise<void> {
    const { data } = await http.get<{ data: Merchant }>(`/api/merchants/${id}`)
    current.value = data.data
  }

  async function fetchTransactions(id: number, page = 1): Promise<void> {
    const { data } = await http.get<Paginated<Transaction>>(`/api/merchants/${id}/transactions`, {
      params: { page },
    })
    currentTransactions.value = data
  }

  async function fetchSettlements(id: number, page = 1): Promise<void> {
    const { data } = await http.get<Paginated<Settlement>>(`/api/merchants/${id}/settlements`, {
      params: { page },
    })
    currentSettlements.value = data
  }

  async function register(payload: MerchantPayload): Promise<Merchant> {
    const { data } = await http.post<{ data: Merchant }>('/api/merchants', payload)
    return data.data
  }

  async function setStatus(id: number, status: MerchantStatus): Promise<Merchant> {
    const { data } = await http.patch<{ data: Merchant }>(`/api/merchants/${id}/status`, { status })

    const updated = data.data
    list.value = list.value.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    if (current.value?.id === updated.id) current.value = { ...current.value, ...updated }

    return updated
  }

  return {
    list,
    meta,
    loading,
    filters,
    current,
    currentTransactions,
    currentSettlements,
    fetchList,
    fetchOne,
    fetchTransactions,
    fetchSettlements,
    register,
    setStatus,
  }
})
