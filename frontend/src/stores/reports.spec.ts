import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/lib/http'
import { useDashboardStore } from '@/stores/dashboard'
import { useReportsStore } from '@/stores/reports'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn() },
}))

const mocked = vi.mocked(http)

const reportSummary = {
  total_payment_volume: 124_026_14,
  total_fees_earned: 186_043,
  successful_count: 96,
  total_settled: 4_957_339,
  settlement_count: 3,
  filtered: false,
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('reports summary', () => {
  it('scopes totals to the active selection', async () => {
    mocked.get.mockResolvedValue({ data: { ...reportSummary, filtered: true } })
    const store = useReportsStore()

    await store.fetchSummary({ merchant_id: 5, date_from: '2026-07-20', date_to: '2026-07-26' })

    expect(mocked.get).toHaveBeenCalledWith('/api/reports/summary', {
      params: { merchant_id: 5, date_from: '2026-07-20', date_to: '2026-07-26' },
    })
    expect(store.summary?.filtered).toBe(true)
  })

  it('sends no params when nothing is selected, giving platform-wide totals', async () => {
    mocked.get.mockResolvedValue({ data: reportSummary })
    const store = useReportsStore()

    await store.fetchSummary()

    expect(mocked.get).toHaveBeenCalledWith('/api/reports/summary', {
      params: { merchant_id: undefined, date_from: undefined, date_to: undefined },
    })
  })

  it('treats an empty merchant selection as unset', async () => {
    mocked.get.mockResolvedValue({ data: reportSummary })
    const store = useReportsStore()

    await store.fetchSummary({ merchant_id: '', date_from: '', date_to: '' })

    expect(mocked.get.mock.calls[0][1]?.params).toEqual({
      merchant_id: undefined,
      date_from: undefined,
      date_to: undefined,
    })
  })

  it('clears loading after a failure', async () => {
    mocked.get.mockRejectedValue(new Error('boom'))
    const store = useReportsStore()

    await expect(store.fetchSummary()).rejects.toThrow('boom')
    expect(store.loading).toBe(false)
  })
})

describe('dashboard summary', () => {
  it('fetches the platform-wide summary without filters', async () => {
    mocked.get.mockResolvedValue({
      data: { total_wallet_balance: 7_259_232, transaction_counts: { successful: 96, pending: 7, failed: 11 } },
    })
    const store = useDashboardStore()

    await store.fetchSummary()

    expect(mocked.get).toHaveBeenCalledWith('/api/dashboard/summary')
    expect(store.summary?.total_wallet_balance).toBe(7_259_232)
  })

  it('clears loading after a failure', async () => {
    mocked.get.mockRejectedValue(new Error('boom'))
    const store = useDashboardStore()

    await expect(store.fetchSummary()).rejects.toThrow('boom')
    expect(store.loading).toBe(false)
  })
})
