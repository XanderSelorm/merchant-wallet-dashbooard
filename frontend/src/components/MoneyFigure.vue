<script setup lang="ts">
import { computed } from 'vue'

import { formatMoney, splitMoney } from '@/lib/money'

const props = withDefaults(
  defineProps<{
    /** Amount in integer minor units. */
    amount: number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    tone?: 'default' | 'inverse' | 'muted'
  }>(),
  { size: 'md', tone: 'default' },
)

const parts = computed(() => splitMoney(props.amount))

const sizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-4xl sm:text-5xl',
}

const tones = {
  default: 'text-slate-900',
  inverse: 'text-white',
  muted: 'text-slate-500',
}

const decimalTones = {
  default: 'text-slate-400',
  inverse: 'text-white/55',
  muted: 'text-slate-400',
}
</script>

<template>
  <!--
    Signature treatment: currency and decimals recede so the magnitude reads
    first. tabular-nums keeps columns of figures aligned.
  -->
  <span class="font-display font-semibold tracking-tight tabular-nums" :class="[sizes[size], tones[tone]]">
    <span class="mr-0.5 align-baseline text-[0.6em] font-medium opacity-60">GH₵</span>
    <span :aria-hidden="true">{{ parts.units }}</span>
    <span :aria-hidden="true" class="text-[0.65em] font-medium" :class="decimalTones[tone]">
      .{{ parts.decimals }}
    </span>
    <span class="sr-only">{{ formatMoney(amount) }}</span>
  </span>
</template>
