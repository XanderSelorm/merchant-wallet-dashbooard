<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'brand' }>(),
  { variant: 'neutral' },
)

const classes = computed(
  () =>
    ({
      success: 'bg-success-50 text-success-700 ring-success-600/20',
      warning: 'bg-warning-50 text-warning-700 ring-warning-600/20',
      danger: 'bg-danger-50 text-danger-700 ring-danger-600/20',
      neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
      brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
    })[props.variant],
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="classes"
  >
    <slot />
  </span>
</template>
