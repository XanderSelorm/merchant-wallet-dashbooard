import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { isValidationError, validationErrors } from '@/lib/http'

/** Builds a response-carrying AxiosError the way the interceptor would see it. */
function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed')
  const headers = new AxiosHeaders()

  error.response = { status, data, statusText: '', headers, config: { headers } } as never

  return error
}

const laravel422 = axiosErrorWith(422, {
  message: 'The given data was invalid.',
  errors: {
    email: ['The email has already been taken.', 'A second message for the same field.'],
    account_number: ['The account number must be 8–16 digits.'],
  },
})

describe('isValidationError', () => {
  it('recognises a 422', () => {
    expect(isValidationError(laravel422)).toBe(true)
  })

  it.each([
    ['a 500', axiosErrorWith(500, { message: 'Server error' })],
    ['a 401', axiosErrorWith(401, { message: 'Unauthenticated.' })],
    ['a 404', axiosErrorWith(404, {})],
  ])('rejects %s', (_label, error) => {
    expect(isValidationError(error)).toBe(false)
  })

  it('rejects a network failure, which carries no response at all', () => {
    expect(isValidationError(new AxiosError('Network Error'))).toBe(false)
  })

  it.each([
    ['a plain Error', new Error('boom')],
    ['a string', 'not an error'],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_label, value) => {
    expect(isValidationError(value)).toBe(false)
  })
})

describe('validationErrors', () => {
  it('maps each field to its first message, which is what a form field shows', () => {
    expect(validationErrors(laravel422)).toEqual({
      email: 'The email has already been taken.',
      account_number: 'The account number must be 8–16 digits.',
    })
  })

  it('returns null for anything that is not a 422, so callers fall back to a form-level message', () => {
    expect(validationErrors(axiosErrorWith(500, { message: 'Server error' }))).toBeNull()
    expect(validationErrors(new AxiosError('Network Error'))).toBeNull()
    expect(validationErrors(new Error('boom'))).toBeNull()
    expect(validationErrors(null)).toBeNull()
  })

  it('returns null when a 422 arrives without an errors bag', () => {
    expect(validationErrors(axiosErrorWith(422, { message: 'Invalid.' }))).toBeNull()
  })

  it('handles an empty errors bag without inventing fields', () => {
    expect(validationErrors(axiosErrorWith(422, { message: 'Invalid.', errors: {} }))).toEqual({})
  })
})
