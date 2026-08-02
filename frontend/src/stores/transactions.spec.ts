import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/lib/http'
import { useTransactionsStore } from '@/stores/transactions'
import type { Transaction } from '@/types/api'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn() },
}))

const mocked = vi.mocked(http)

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    merchant_id: 1,
    reference: 'PAY-ABCDEFGHJK',
    gross_amount: 123_457,
    fee_amount: 1_852,
    net_amount: 121_605,
    status: 'successful',
    created_at: '2026-07-26T10:55:45.000Z',
    ...overrides,
  }
}

const page = (data: Transaction[]) => ({
  data: { data, meta: { current_page: 1, last_page: 1, per_page: 10, total: data.length, from: 1, to: data.length }, links: {} },
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('fetchList', () => {
  it('forwards every filter the reports and payments views expose', async () => {
    mocked.get.mockResolvedValue(page([]))
    const store = useTransactionsStore()

    store.filters.search = 'PAY-123'
    store.filters.status = 'failed'
    store.filters.merchant_id = 4
    store.filters.date_from = '2026-07-01'
    store.filters.date_to = '2026-07-26'
    store.filters.page = 2
    await store.fetchList()

    expect(mocked.get).toHaveBeenCalledWith('/api/transactions', {
      params: {
        search: 'PAY-123',
        status: 'failed',
        merchant_id: 4,
        date_from: '2026-07-01',
        date_to: '2026-07-26',
        page: 2,
      },
    })
  })

  it('drops unset filters', async () => {
    mocked.get.mockResolvedValue(page([]))
    const store = useTransactionsStore()

    await store.fetchList()

    expect(mocked.get).toHaveBeenCalledWith('/api/transactions', {
      params: {
        search: undefined,
        status: undefined,
        merchant_id: undefined,
        date_from: undefined,
        date_to: undefined,
        page: 1,
      },
    })
  })

  it('treats merchant_id 0 as unset rather than sending a falsy id', async () => {
    mocked.get.mockResolvedValue(page([]))
    const store = useTransactionsStore()

    store.filters.merchant_id = 0
    await store.fetchList()

    expect(mocked.get.mock.calls[0][1]?.params.merchant_id).toBeUndefined()
  })

  it('clears loading after a failure', async () => {
    mocked.get.mockRejectedValue(new Error('offline'))
    const store = useTransactionsStore()

    await expect(store.fetchList()).rejects.toThrow('offline')
    expect(store.loading).toBe(false)
  })
})

describe('simulatePayment', () => {
  it('posts the payment and returns the recorded transaction', async () => {
    mocked.post.mockResolvedValue({ data: { data: transaction() } })
    const store = useTransactionsStore()

    const result = await store.simulatePayment({
      merchant_id: 1,
      amount: 123_457,
      reference: 'PAY-ABCDEFGHJK',
    })

    expect(mocked.post).toHaveBeenCalledWith('/api/payments', {
      merchant_id: 1,
      amount: 123_457,
      reference: 'PAY-ABCDEFGHJK',
    })
    expect(result.net_amount).toBe(121_605)
  })

  it('sends the amount in minor units, matching what the API validates', async () => {
    mocked.post.mockResolvedValue({ data: { data: transaction() } })
    const store = useTransactionsStore()

    await store.simulatePayment({ merchant_id: 1, amount: 25_000, reference: 'PAY-X' })

    expect(mocked.post).toHaveBeenCalledWith('/api/payments', expect.objectContaining({ amount: 25_000 }))
  })

  it('propagates a rejection so the form can surface validation errors', async () => {
    mocked.post.mockRejectedValue(new Error('422'))
    const store = useTransactionsStore()

    await expect(
      store.simulatePayment({ merchant_id: 1, amount: 100, reference: 'PAY-DUPLICATE' }),
    ).rejects.toThrow('422')
  })
})
