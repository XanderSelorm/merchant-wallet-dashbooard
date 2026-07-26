<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const styles = {
  success: 'bg-white ring-success-600/25 text-slate-800',
  error: 'bg-white ring-danger-600/25 text-slate-800',
  info: 'bg-white ring-brand-600/25 text-slate-800',
}

const dotStyles = {
  success: 'bg-success-600',
  error: 'bg-danger-600',
  info: 'bg-brand-600',
}
</script>

<template>
  <!-- Polite live region so outcomes are announced without stealing focus -->
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex flex-col items-center gap-2 p-4 sm:items-end"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-lg ring-1"
        :class="styles[toast.variant]"
      >
        <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="dotStyles[toast.variant]" />
        <p class="flex-1 text-sm">{{ toast.message }}</p>
        <button
          type="button"
          class="-mt-0.5 -mr-1 rounded p-1 text-slate-400 transition-colors hover:text-slate-700"
          @click="dismiss(toast.id)"
        >
          <span class="sr-only">Dismiss</span>
          <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
