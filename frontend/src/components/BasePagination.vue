<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import type { Paginated } from '@/types/api'

const props = defineProps<{
  meta: Paginated<unknown>['meta'] | null
  /** Plural noun for the range summary, e.g. "transactions". */
  label: string
}>()

const emit = defineEmits<{ change: [page: number] }>()

function go(page: number) {
  if (props.meta && page >= 1 && page <= props.meta.last_page) emit('change', page)
}
</script>

<template>
  <nav
    v-if="meta && meta.total > 0"
    class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3"
    :aria-label="`${label} pagination`"
  >
    <p class="text-xs text-slate-500">
      Showing <span class="font-medium text-slate-700">{{ meta.from ?? 0 }}–{{ meta.to ?? 0 }}</span>
      of <span class="font-medium text-slate-700">{{ meta.total }}</span> {{ label }}
    </p>

    <div v-if="meta.last_page > 1" class="flex items-center gap-2">
      <BaseButton
        variant="secondary"
        size="sm"
        :disabled="meta.current_page <= 1"
        @click="go(meta.current_page - 1)"
      >
        Previous
      </BaseButton>
      <span class="px-1 text-xs text-slate-500" aria-current="page">
        Page {{ meta.current_page }} of {{ meta.last_page }}
      </span>
      <BaseButton
        variant="secondary"
        size="sm"
        :disabled="meta.current_page >= meta.last_page"
        @click="go(meta.current_page + 1)"
      >
        Next
      </BaseButton>
    </div>
  </nav>
</template>
