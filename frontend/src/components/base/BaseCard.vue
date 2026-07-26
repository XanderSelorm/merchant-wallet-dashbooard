<script setup lang="ts">
defineProps<{
  title?: string
  /** Remove inner padding (for cards whose body is a full-bleed table). */
  flush?: boolean
}>()
</script>

<template>
  <section class="rounded-card bg-white shadow-card">
    <header
      v-if="title || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"
    >
      <h2 class="font-display text-base font-semibold text-slate-900">{{ title }}</h2>
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <div :class="flush ? '' : 'p-5'">
      <slot />
    </div>
  </section>
</template>
