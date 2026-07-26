import { customRef } from 'vue'

/**
 * A ref whose writes are debounced — used for search inputs so typing does
 * not fire a request per keystroke.
 */
export function useDebouncedRef<T>(initial: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>

  return customRef<T>((track, trigger) => {
    let value = initial

    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        value = newValue
        clearTimeout(timeout)
        timeout = setTimeout(trigger, delay)
      },
    }
  })
}
