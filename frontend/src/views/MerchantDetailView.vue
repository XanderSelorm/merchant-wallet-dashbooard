<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import BaseCard from '@/components/base/BaseCard.vue'

defineProps<{ id: number }>()
</script>

<template>
  <div>
    <PageHeader title="Merchant detail" :subtitle="`Merchant #${id}`" />
    <BaseCard>
      <p class="text-sm text-slate-500">This view is scaffolded and routed.</p>
    </BaseCard>
  </div>
</template>
