<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', loading: false, disabled: false },
)

const classes = computed(() => {
  const variants = {
    primary:
      'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900 disabled:bg-brand-800/50',
    secondary:
      'bg-white text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
    danger:
      'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 disabled:bg-danger-600/50',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 disabled:text-slate-400',
  }
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
  }
  return `${variants[props.variant]} ${sizes[props.size]}`
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
