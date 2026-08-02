import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/lib/http'
import { useMerchantsStore } from '@/stores/merchants'
import type { Merchant } from '@/types/api'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const mocked = vi.mocked(http)

function merchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: 1,
    name: 'Ama Mensah',
    email: 'ama@adom.test',
    business_name: 'Adom Provisions Ltd',
    account_number: '0241558899',
    bank_name: 'GCB Bank',
    status: 'active',
    wallet_balance: 121_605,
    created_at: '2026-07-26T10:00:00.000Z',
    updated_at: '2026-07-26T10:00:00.000Z',
    ...overrides,
  }
}

const paginated = (data: Merchant[]) => ({
  data: { data, meta: { current_page: 1, last_page: 1, per_page: 10, total: data.length, from: 1, to: data.length }, links: {} },
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('fetchList', () => {
  it('sends the active filters as query params', async () => {
    mocked.get.mockResolvedValue(paginated([merchant()]))
    const store = useMerchantsStore()

    store.filters.search = 'adom'
    store.filters.status = 'active'
    store.filters.page = 3
    await store.fetchList()

    expect(mocked.get).toHaveBeenCalledWith('/api/merchants', {
      params: { search: 'adom', status: 'active', page: 3 },
    })
  })

  it('omits empty filters rather than sending blanks the API would have to ignore', async () => {
    mocked.get.mockResolvedValue(paginated([]))
    const store = useMerchantsStore()

    await store.fetchList()

    expect(mocked.get).toHaveBeenCalledWith('/api/merchants', {
      params: { search: undefined, status: undefined, page: 1 },
    })
  })

  it('stores the rows and pagination meta', async () => {
    mocked.get.mockResolvedValue(paginated([merchant(), merchant({ id: 2 })]))
    const store = useMerchantsStore()

    await store.fetchList()

    expect(store.list).toHaveLength(2)
    expect(store.meta?.total).toBe(2)
  })

  it('clears the loading flag even when the request fails', async () => {
    mocked.get.mockRejectedValue(new Error('network down'))
    const store = useMerchantsStore()

    await expect(store.fetchList()).rejects.toThrow('network down')
    expect(store.loading).toBe(false)
  })
})

describe('fetchOptions', () => {
  it('requests an unpaginated set for merchant pickers', async () => {
    mocked.get.mockResolvedValue(paginated([merchant()]))
    const store = useMerchantsStore()

    await store.fetchOptions()

    expect(mocked.get).toHaveBeenCalledWith('/api/merchants', { params: { per_page: 200 } })
    expect(store.options).toHaveLength(1)
  })

  it('keeps options separate from the filtered table list', async () => {
    const store = useMerchantsStore()

    mocked.get.mockResolvedValueOnce(paginated([merchant({ id: 1 }), merchant({ id: 2 })]))
    await store.fetchOptions()

    mocked.get.mockResolvedValueOnce(paginated([merchant({ id: 2 })]))
    store.filters.search = 'only-one'
    await store.fetchList()

    // A table filter must not shrink what a dropdown can offer.
    expect(store.list).toHaveLength(1)
    expect(store.options).toHaveLength(2)
  })
})

describe('setStatus', () => {
  it('patches the row in place across list, options and current', async () => {
    const store = useMerchantsStore()

    mocked.get.mockResolvedValue(paginated([merchant({ id: 1 }), merchant({ id: 2 })]))
    await store.fetchList()
    await store.fetchOptions()
    store.current = merchant({ id: 1 })

    mocked.patch.mockResolvedValue({ data: { data: merchant({ id: 1, status: 'inactive' }) } })
    await store.setStatus(1, 'inactive')

    expect(mocked.patch).toHaveBeenCalledWith('/api/merchants/1/status', { status: 'inactive' })
    expect(store.list.find((m) => m.id === 1)?.status).toBe('inactive')
    expect(store.options.find((m) => m.id === 1)?.status).toBe('inactive')
    expect(store.current?.status).toBe('inactive')
  })

  it('leaves other merchants untouched', async () => {
    const store = useMerchantsStore()

    mocked.get.mockResolvedValue(paginated([merchant({ id: 1 }), merchant({ id: 2 })]))
    await store.fetchList()

    mocked.patch.mockResolvedValue({ data: { data: merchant({ id: 1, status: 'inactive' }) } })
    await store.setStatus(1, 'inactive')

    expect(store.list.find((m) => m.id === 2)?.status).toBe('active')
  })

  it('does not touch current when a different merchant is being viewed', async () => {
    const store = useMerchantsStore()
    store.current = merchant({ id: 99, business_name: 'Someone Else' })

    mocked.patch.mockResolvedValue({ data: { data: merchant({ id: 1, status: 'inactive' }) } })
    await store.setStatus(1, 'inactive')

    expect(store.current?.id).toBe(99)
    expect(store.current?.status).toBe('active')
  })
})

describe('register', () => {
  it('posts the payload and returns the created merchant', async () => {
    const payload = {
      name: 'Kwame Boateng',
      email: 'kwame@okada.test',
      business_name: 'Okada Logistics Ltd',
      account_number: '0559871234',
      bank_name: 'Stanbic Bank',
    }
    mocked.post.mockResolvedValue({ data: { data: merchant({ id: 9, ...payload }) } })
    const store = useMerchantsStore()

    const created = await store.register(payload)

    expect(mocked.post).toHaveBeenCalledWith('/api/merchants', payload)
    expect(created.id).toBe(9)
    expect(created.business_name).toBe('Okada Logistics Ltd')
  })
})

describe('detail fetches', () => {
  it('loads one merchant, its transactions and its settlements by id', async () => {
    const store = useMerchantsStore()

    mocked.get.mockResolvedValueOnce({ data: { data: merchant({ id: 8 }) } })
    await store.fetchOne(8)
    expect(mocked.get).toHaveBeenCalledWith('/api/merchants/8')
    expect(store.current?.id).toBe(8)

    mocked.get.mockResolvedValueOnce({ data: { data: [], meta: {}, links: {} } })
    await store.fetchTransactions(8, 2)
    expect(mocked.get).toHaveBeenCalledWith('/api/merchants/8/transactions', { params: { page: 2 } })

    mocked.get.mockResolvedValueOnce({ data: { data: [], meta: {}, links: {} } })
    await store.fetchSettlements(8)
    expect(mocked.get).toHaveBeenCalledWith('/api/merchants/8/settlements', { params: { page: 1 } })
  })
})
