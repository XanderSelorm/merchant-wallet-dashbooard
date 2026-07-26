import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { http } from '@/lib/http'
import type { Paginated, Transaction, TransactionStatus } from '@/types/api'

export interface PaymentPayload {
  merchant_id: number
  amount: number
  reference: string
  status?: TransactionStatus
}

export const useTransactionsStore = defineStore('transactions', () => {
  const list = ref<Transaction[]>([])
  const meta = ref<Paginated<Transaction>['meta'] | null>(null)
  const loading = ref(false)
  const filters = reactive({
    search: '',
    status: '' as TransactionStatus | '',
    date_from: '',
    date_to: '',
    page: 1,
  })

  async function fetchList(): Promise<void> {
    loading.value = true
    try {
      const { data } = await http.get<Paginated<Transaction>>('/api/transactions', {
        params: {
          search: filters.search || undefined,
          status: filters.status || undefined,
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

  async function simulatePayment(payload: PaymentPayload): Promise<Transaction> {
    const { data } = await http.post<{ data: Transaction }>('/api/payments', payload)
    return data.data
  }

  return { list, meta, loading, filters, fetchList, simulatePayment }
})
