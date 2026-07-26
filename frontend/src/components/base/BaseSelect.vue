<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  options: { value: string | number; label: string }[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  /** Visually hide the label (still announced to screen readers). */
  labelHidden?: boolean
}>()

const model = defineModel<string | number>({ default: '' })
const id = useId()
</script>

<template>
  <div>
    <label
      :for="id"
      class="mb-1.5 block text-sm font-medium text-slate-700"
      :class="labelHidden && 'sr-only'"
    >
      {{ label }}<span v-if="required" class="text-danger-600" aria-hidden="true"> *</span>
    </label>
    <select
      :id="id"
      v-model="model"
      :required="required"
      :disabled="disabled"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="block w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-50"
      :class="error && 'ring-danger-600 focus:ring-danger-600'"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="mt-1.5 text-xs text-danger-700">{{ error }}</p>
  </div>
</template>
