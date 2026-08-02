import { AxiosError, AxiosHeaders } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureCsrf, http } from '@/lib/http'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  ensureCsrf: vi.fn().mockResolvedValue(undefined),
}))

const mocked = vi.mocked(http)
const mockedEnsureCsrf = vi.mocked(ensureCsrf)

const user = { id: 1, name: 'Demo Admin', email: 'admin@kudi.test' }

function httpError(status: number): AxiosError {
  const error = new AxiosError('Request failed')
  const headers = new AxiosHeaders()
  error.response = { status, data: {}, statusText: '', headers, config: { headers } } as never
  return error
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockedEnsureCsrf.mockResolvedValue(undefined)
})

describe('init', () => {
  it('resolves an existing session', async () => {
    mocked.get.mockResolvedValue({ data: user })
    const store = useAuthStore()

    await store.init()

    expect(mocked.get).toHaveBeenCalledWith('/api/user')
    expect(store.user).toEqual(user)
    expect(store.initialized).toBe(true)
  })

  it('treats a 401 as signed out rather than an error, so the guard can redirect', async () => {
    mocked.get.mockRejectedValue(httpError(401))
    const store = useAuthStore()

    await expect(store.init()).resolves.toBeUndefined()
    expect(store.user).toBeNull()
    expect(store.initialized).toBe(true)
  })

  it('rethrows a genuine failure instead of silently signing the user out', async () => {
    mocked.get.mockRejectedValue(httpError(500))
    const store = useAuthStore()

    await expect(store.init()).rejects.toBeInstanceOf(AxiosError)
  })

  it('probes only once, however many guarded routes are visited', async () => {
    mocked.get.mockResolvedValue({ data: user })
    const store = useAuthStore()

    await store.init()
    await store.init()
    await store.init()

    expect(mocked.get).toHaveBeenCalledTimes(1)
  })
})

describe('login', () => {
  it('primes the CSRF cookie before posting credentials', async () => {
    mocked.post.mockResolvedValue({ data: { user } })
    const store = useAuthStore()

    await store.login('admin@kudi.test', 'password')

    expect(mockedEnsureCsrf).toHaveBeenCalled()
    expect(mocked.post).toHaveBeenCalledWith('/login', {
      email: 'admin@kudi.test',
      password: 'password',
    })
    expect(store.user).toEqual(user)
  })

  it('leaves the store signed out when credentials are rejected', async () => {
    mocked.post.mockRejectedValue(httpError(422))
    const store = useAuthStore()

    await expect(store.login('admin@kudi.test', 'wrong')).rejects.toBeInstanceOf(AxiosError)
    expect(store.user).toBeNull()
  })
})

describe('logout', () => {
  it('clears the user', async () => {
    mocked.get.mockResolvedValue({ data: user })
    mocked.post.mockResolvedValue({ data: { message: 'Logged out.' } })
    const store = useAuthStore()
    await store.init()

    await store.logout()

    expect(mocked.post).toHaveBeenCalledWith('/logout')
    expect(store.user).toBeNull()
  })

  it('keeps the user signed in if the request fails, rather than faking a logout', async () => {
    mocked.get.mockResolvedValue({ data: user })
    mocked.post.mockRejectedValue(httpError(500))
    const store = useAuthStore()
    await store.init()

    await expect(store.logout()).rejects.toBeInstanceOf(AxiosError)
    expect(store.user).toEqual(user)
  })
})
