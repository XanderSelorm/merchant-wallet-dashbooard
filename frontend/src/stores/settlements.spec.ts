import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/lib/http'
import { useSettlementsStore } from '@/stores/settlements'
import type { Settlement } from '@/types/api'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn() },
}))

const mocked = vi.mocked(http)

function settlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    id: 1,
    merchant_id: 1,
    reference: 'STL-ABCDEFGHJK',
    amount: 121_605,
    settled_on: '2026-07-26',
    created_at: '2026-07-26T10:55:45.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('fetchList', () => {
  it('forwards merchant and date-range filters', async () => {
    mocked.get.mockResolvedValue({ data: { data: [], meta: {}, links: {} } })
    const store = useSettlementsStore()

    store.filters.merchant_id = 5
    store.filters.date_from = '2026-07-01'
    store.filters.date_to = '2026-07-26'
    await store.fetchList()

    expect(mocked.get).toHaveBeenCalledWith('/api/settlements', {
      params: { merchant_id: 5, date_from: '2026-07-01', date_to: '2026-07-26', page: 1 },
    })
  })
})

describe('runSettlement', () => {
  it('reports how many wallets were swept', async () => {
    mocked.post.mockResolvedValue({
      data: {
        message: 'Settled 6 merchant wallets.',
        settlements: Array.from({ length: 6 }, (_, i) => settlement({ id: i + 1 })),
      },
    })
    const store = useSettlementsStore()

    const result = await store.runSettlement()

    expect(mocked.post).toHaveBeenCalledWith('/api/settlements/run')
    expect(result).toEqual({ message: 'Settled 6 merchant wallets.', count: 6 })
  })

  it('reports a no-op run, which is what a second consecutive run produces', async () => {
    mocked.post.mockResolvedValue({
      data: { message: 'No positive wallet balances to settle.', settlements: [] },
    })
    const store = useSettlementsStore()

    const result = await store.runSettlement()

    // The view uses count to choose between a success and an info toast.
    expect(result.count).toBe(0)
    expect(result.message).toBe('No positive wallet balances to settle.')
  })

  it('holds the running flag for the duration and releases it after', async () => {
    let release: (value: unknown) => void = () => {}
    mocked.post.mockReturnValue(new Promise((resolve) => { release = resolve }))
    const store = useSettlementsStore()

    const pending = store.runSettlement()
    expect(store.running).toBe(true)

    release({ data: { message: 'done', settlements: [] } })
    await pending

    expect(store.running).toBe(false)
  })

  it('releases the running flag when the sweep fails, so the button is not stuck', async () => {
    mocked.post.mockRejectedValue(new Error('500'))
    const store = useSettlementsStore()

    await expect(store.runSettlement()).rejects.toThrow('500')
    expect(store.running).toBe(false)
  })
})
