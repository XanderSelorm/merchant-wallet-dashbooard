import { readonly, ref } from 'vue'

export interface Toast {
  id: number
  message: string
  variant: 'success' | 'error' | 'info'
}

const items = ref<Toast[]>([])
let nextId = 1

/**
 * App-wide feedback messages. Module-scoped state so any component can
 * announce an outcome without prop drilling.
 */
export function useToast() {
  function push(message: string, variant: Toast['variant'] = 'success'): void {
    const id = nextId++
    items.value.push({ id, message, variant })
    setTimeout(() => dismiss(id), 5000)
  }

  function dismiss(id: number): void {
    items.value = items.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts: readonly(items),
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
    dismiss,
  }
}
