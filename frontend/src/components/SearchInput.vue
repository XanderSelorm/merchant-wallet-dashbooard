<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{ label: string; placeholder?: string }>(), {
  placeholder: 'Search…',
})

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="relative">
    <label :for="id" class="sr-only">{{ label }}</label>
    <svg
      class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clip-rule="evenodd"
      />
    </svg>
    <input
      :id="id"
      v-model="model"
      type="search"
      :placeholder="placeholder"
      class="block w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm text-slate-900 ring-1 ring-slate-300 ring-inset placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
    />
  </div>
</template>
