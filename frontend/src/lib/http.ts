import axios from 'axios'

const TOKEN_KEY = 'auth_token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** Read the persisted Sanctum bearer token from the cookie, if any. */
export function getToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_KEY}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Persist the token in a first-party cookie (or clear it when null) so it
 * survives reloads. The token is read back in JS and sent as a bearer header,
 * so `SameSite=Strict` is safe — we never rely on the browser auto-sending it.
 */
export function setToken(token: string | null): void {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  const attrs = `Path=/; SameSite=Strict${secure}`

  document.cookie = token
    ? `${TOKEN_KEY}=${encodeURIComponent(token)}; Max-Age=${TOKEN_MAX_AGE}; ${attrs}`
    : `${TOKEN_KEY}=; Max-Age=0; ${attrs}`
}

/**
 * Axios instance for the Laravel backend.
 * Sanctum token mode: bearer token in the Authorization header, no cookies —
 * so the frontend and backend can live on separate domains.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function isValidationError(error: unknown): error is import('axios').AxiosError<{
  message: string
  errors: Record<string, string[]>
}> {
  return axios.isAxiosError(error) && error.response?.status === 422
}

/** Field → first message map from a Laravel 422, or null. */
export function validationErrors(error: unknown): Record<string, string> | null {
  if (!isValidationError(error) || !error.response?.data.errors) return null

  return Object.fromEntries(
    Object.entries(error.response.data.errors).map(([field, messages]) => [field, messages[0]]),
  )
}
