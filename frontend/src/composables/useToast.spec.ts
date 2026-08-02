import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/composables/useToast'

/**
 * Toast state is module-scoped by design — any component can announce an
 * outcome without prop drilling — so each test drains it first.
 */
beforeEach(() => {
  vi.useFakeTimers()

  const { toasts, dismiss } = useToast()
  toasts.value.forEach((toast) => dismiss(toast.id))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('pushing toasts', () => {
  it('adds a success toast', () => {
    const { toasts, success } = useToast()

    success('Settled 6 merchant wallets.')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ message: 'Settled 6 merchant wallets.', variant: 'success' })
  })

  it.each([
    ['success', 'success'],
    ['error', 'error'],
    ['info', 'info'],
  ])('%s() tags the toast as %s', (method, variant) => {
    const toast = useToast()

    ;(toast[method as 'success' | 'error' | 'info'])('message')

    expect(toast.toasts.value[0].variant).toBe(variant)
  })

  it('stacks multiple toasts in order', () => {
    const { toasts, success, error } = useToast()

    success('first')
    error('second')

    expect(toasts.value.map((t) => t.message)).toEqual(['first', 'second'])
  })

  it('gives every toast a distinct id, so dismissing one leaves the rest', () => {
    const { toasts, success } = useToast()

    success('a')
    success('b')

    expect(toasts.value[0].id).not.toBe(toasts.value[1].id)
  })
})

describe('dismissal', () => {
  it('auto-dismisses after five seconds', () => {
    const { toasts, success } = useToast()

    success('Payment recorded.')
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(4_999)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('dismisses on demand before the timeout', () => {
    const { toasts, success, dismiss } = useToast()

    success('Payment recorded.')
    dismiss(toasts.value[0].id)

    expect(toasts.value).toHaveLength(0)
  })

  it('removes only the requested toast', () => {
    const { toasts, success, dismiss } = useToast()

    success('keep me')
    success('remove me')
    dismiss(toasts.value[1].id)

    expect(toasts.value.map((t) => t.message)).toEqual(['keep me'])
  })

  it('expires each toast on its own clock', () => {
    const { toasts, success } = useToast()

    success('first')
    vi.advanceTimersByTime(3_000)
    success('second')

    // First is 3s old, second is new.
    vi.advanceTimersByTime(2_000)
    expect(toasts.value.map((t) => t.message)).toEqual(['second'])

    vi.advanceTimersByTime(3_000)
    expect(toasts.value).toHaveLength(0)
  })

  it('ignores a dismissal for an id that has already gone', () => {
    const { toasts, success, dismiss } = useToast()

    success('once')
    const id = toasts.value[0].id
    dismiss(id)

    expect(() => dismiss(id)).not.toThrow()
    expect(toasts.value).toHaveLength(0)
  })
})
