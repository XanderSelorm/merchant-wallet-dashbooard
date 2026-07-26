<script setup lang="ts">
import { computed } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import type { MerchantStatus, TransactionStatus } from '@/types/api'

const props = defineProps<{ status: TransactionStatus | MerchantStatus }>()

/** Status colour is paired with a shape cue so it never relies on colour alone. */
const config = computed(
  () =>
    ({
      successful: { variant: 'success', label: 'Successful', dot: 'bg-success-600' },
      pending: { variant: 'warning', label: 'Pending', dot: 'bg-warning-600 animate-pulse' },
      failed: { variant: 'danger', label: 'Failed', dot: 'bg-danger-600' },
      active: { variant: 'success', label: 'Active', dot: 'bg-success-600' },
      inactive: { variant: 'neutral', label: 'Inactive', dot: 'bg-slate-400' },
    })[props.status],
)
</script>

<template>
  <BaseBadge :variant="config.variant as 'success' | 'warning' | 'danger' | 'neutral'">
    <span class="size-1.5 rounded-full" :class="config.dot" aria-hidden="true" />
    {{ config.label }}
  </BaseBadge>
</template>
