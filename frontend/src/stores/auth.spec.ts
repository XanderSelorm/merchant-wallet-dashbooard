import { AxiosError, AxiosHeaders } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getToken, http, setToken } from '@/lib/http'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  getToken: vi.fn(),
  setToken: vi.fn(),
}))

const mocked = vi.mocked(http)
const mockedGetToken = vi.mocked(getToken)
const mockedSetToken = vi.mocked(setToken)

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
  mockedGetToken.mockReturnValue('stored-token')
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

  it('skips the probe entirely when no token is stored', async () => {
    mockedGetToken.mockReturnValue(null)
    const store = useAuthStore()

    await store.init()

    expect(mocked.get).not.toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.initialized).toBe(true)
  })

  it('treats a 401 as signed out and clears the stale token, so the guard can redirect', async () => {
    mocked.get.mockRejectedValue(httpError(401))
    const store = useAuthStore()

    await expect(store.init()).resolves.toBeUndefined()
    expect(mockedSetToken).toHaveBeenCalledWith(null)
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
  it('stores the returned token and user', async () => {
    mocked.post.mockResolvedValue({ data: { user, token: 'fresh-token' } })
    const store = useAuthStore()

    await store.login('admin@kudi.test', 'password')

    expect(mocked.post).toHaveBeenCalledWith('/api/login', {
      email: 'admin@kudi.test',
      password: 'password',
    })
    expect(mockedSetToken).toHaveBeenCalledWith('fresh-token')
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
  it('clears the token and user', async () => {
    mocked.get.mockResolvedValue({ data: user })
    mocked.post.mockResolvedValue({ data: { message: 'Logged out.' } })
    const store = useAuthStore()
    await store.init()

    await store.logout()

    expect(mocked.post).toHaveBeenCalledWith('/api/logout')
    expect(mockedSetToken).toHaveBeenCalledWith(null)
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
