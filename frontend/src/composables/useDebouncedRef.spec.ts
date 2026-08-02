import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watch } from 'vue'

import { useDebouncedRef } from '@/composables/useDebouncedRef'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

/**
 * Vue schedules watcher callbacks on the microtask queue, so advancing timers
 * synchronously fires the debounce but never runs the watcher. The async
 * variant drains both, which is what the search inputs actually experience.
 */
const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms)

describe('useDebouncedRef', () => {
  it('exposes the initial value immediately', () => {
    const search = useDebouncedRef('initial')

    expect(search.value).toBe('initial')
  })

  it('reflects a write straight away when read directly', () => {
    const search = useDebouncedRef('')

    search.value = 'adom'

    expect(search.value).toBe('adom')
  })

  it('delays notifying watchers until the interval has passed', async () => {
    const search = useDebouncedRef('', 300)
    const onChange = vi.fn()
    watch(search, onChange)

    search.value = 'a'
    await advance(299)
    expect(onChange).not.toHaveBeenCalled()

    await advance(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('fires once for a burst of typing rather than once per keystroke', async () => {
    const search = useDebouncedRef('', 300)
    const onChange = vi.fn()
    watch(search, onChange)

    for (const value of ['a', 'ad', 'ado', 'adom']) {
      search.value = value
      await advance(100)
    }

    // 400ms of typing, but each keystroke restarted the timer.
    expect(onChange).not.toHaveBeenCalled()

    await advance(300)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('notifies with the final value of the burst', async () => {
    const search = useDebouncedRef('', 300)
    let seen: string | undefined
    watch(search, (value) => { seen = value })

    search.value = 'a'
    search.value = 'ad'
    search.value = 'adom'
    await advance(300)

    expect(seen).toBe('adom')
  })

  it('honours a custom delay', async () => {
    const search = useDebouncedRef('', 1_000)
    const onChange = vi.fn()
    watch(search, onChange)

    search.value = 'slow'
    await advance(300)
    expect(onChange).not.toHaveBeenCalled()

    await advance(700)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('notifies again for a later, separate edit', async () => {
    const search = useDebouncedRef('', 300)
    const onChange = vi.fn()
    watch(search, onChange)

    search.value = 'first'
    await advance(300)

    search.value = 'second'
    await advance(300)

    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('does not notify when nothing was written', async () => {
    const search = useDebouncedRef('', 300)
    const onChange = vi.fn()
    watch(search, onChange)

    await advance(1_000)

    expect(onChange).not.toHaveBeenCalled()
  })
})
