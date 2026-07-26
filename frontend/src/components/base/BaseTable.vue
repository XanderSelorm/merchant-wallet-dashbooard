<script setup lang="ts" generic="T extends { id: number }">
import type { Column } from '@/components/base/table'

defineProps<{
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  caption: string
  emptyTitle?: string
  emptyBody?: string
  /** Rows become clickable when a handler is provided. */
  onRowClick?: (row: T) => void
}>()

defineSlots<{
  [key: `cell:${string}`]: (props: { row: T }) => unknown
  empty?: () => unknown
}>()

const hideClass = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-full border-collapse text-sm">
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr class="border-b border-slate-200">
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-5 py-3 text-2xs font-semibold tracking-wider text-slate-500 uppercase"
            :class="[
              column.align === 'right' ? 'text-right' : 'text-left',
              column.hideBelow && hideClass[column.hideBelow],
            ]"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <tbody v-if="loading">
        <tr v-for="n in 5" :key="`skeleton-${n}`" class="border-b border-slate-100">
          <td v-for="column in columns" :key="column.key" class="px-5 py-4" :class="column.hideBelow && hideClass[column.hideBelow]">
            <div class="h-3 animate-pulse rounded-full bg-slate-200" :style="{ width: `${40 + ((n * 17) % 45)}%` }" />
          </td>
        </tr>
      </tbody>

      <tbody v-else-if="rows.length">
        <tr
          v-for="row in rows"
          :key="row.id"
          class="border-b border-slate-100 last:border-0"
          :class="
            onRowClick
              ? 'cursor-pointer transition-colors hover:bg-brand-50/60 focus-within:bg-brand-50/60'
              : 'transition-colors hover:bg-slate-50/80'
          "
          @click="onRowClick?.(row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-5 py-3.5 text-slate-700"
            :class="[
              column.align === 'right' ? 'text-right' : 'text-left',
              column.hideBelow && hideClass[column.hideBelow],
            ]"
          >
            <slot :name="`cell:${column.key}`" :row="row">
              {{ column.cell?.(row) ?? '' }}
            </slot>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr>
          <td :colspan="columns.length" class="px-5 py-14 text-center">
            <slot name="empty">
              <p class="font-display text-sm font-semibold text-slate-900">
                {{ emptyTitle ?? 'Nothing here yet' }}
              </p>
              <p v-if="emptyBody" class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {{ emptyBody }}
              </p>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
