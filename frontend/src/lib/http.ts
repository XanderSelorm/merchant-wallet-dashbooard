import axios from 'axios'

/**
 * Axios instance for the Laravel backend.
 * Sanctum SPA mode: session cookie + XSRF token, no bearer tokens.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

let csrfReady = false

/** Prime the XSRF cookie once before the first mutating request. */
export async function ensureCsrf(): Promise<void> {
  if (!csrfReady) {
    await http.get('/sanctum/csrf-cookie')
    csrfReady = true
  }
}

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
