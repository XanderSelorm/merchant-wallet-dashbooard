<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    variant?: 'primary' | 'danger'
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirm', variant: 'primary' },
)

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <BaseModal v-model="open" :title="title" :description="description" size="sm">
    <slot />

    <template #footer>
      <BaseButton variant="secondary" :disabled="loading" @click="open = false">Cancel</BaseButton>
      <BaseButton :variant="variant" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
