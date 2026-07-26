<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import type { Column } from '@/components/base/table'
import BasePagination from '@/components/BasePagination.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MoneyFigure from '@/components/MoneyFigure.vue'
import PageHeader from '@/components/PageHeader.vue'
import RegisterMerchantModal from '@/components/merchants/RegisterMerchantModal.vue'
import SearchInput from '@/components/SearchInput.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useToast } from '@/composables/useToast'
import { useMerchantsStore } from '@/stores/merchants'
import type { Merchant } from '@/types/api'

const merchants = useMerchantsStore()
const router = useRouter()
const toast = useToast()

const search = useDebouncedRef('', 300)
const status = ref<'' | 'active' | 'inactive'>('')
const registerOpen = ref(false)

const pendingToggle = ref<Merchant | null>(null)
const toggling = ref(false)

const columns: Column<Merchant>[] = [
  { key: 'business', label: 'Business' },
  { key: 'bank', label: 'Bank account', hideBelow: 'lg' },
  { key: 'status', label: 'Status' },
  { key: 'balance', label: 'Wallet balance', align: 'right' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const statusOptions = [
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
]

// Filter changes reset to page one; page changes keep the filters.
watch([search, status], () => {
  merchants.filters.search = search.value
  merchants.filters.status = status.value
  merchants.filters.page = 1
  merchants.fetchList()
})

function goToPage(page: number) {
  merchants.filters.page = page
  merchants.fetchList()
}

const isFiltered = computed(() => Boolean(search.value || status.value))

function openMerchant(merchant: Merchant) {
  router.push({ name: 'merchant-detail', params: { id: merchant.id } })
}

async function confirmToggle() {
  const merchant = pendingToggle.value
  if (!merchant) return

  toggling.value = true
  const next = merchant.status === 'active' ? 'inactive' : 'active'

  try {
    await merchants.setStatus(merchant.id, next)
    toast.success(
      next === 'inactive'
        ? `${merchant.business_name} deactivated. It can no longer take payments.`
        : `${merchant.business_name} reactivated.`,
    )
    pendingToggle.value = null
  } catch {
    toast.error('Could not update the merchant status. Try again.')
  } finally {
    toggling.value = false
  }
}

onMounted(() => {
  merchants.filters.page = 1
  merchants.fetchList()
})
</script>

<template>
  <div>
    <PageHeader title="Merchants" subtitle="Businesses accepting payments on the platform.">
      <template #actions>
        <BaseButton @click="registerOpen = true">
          <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              d="M10 4a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 0110 4z"
            />
          </svg>
          Register merchant
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard flush>
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div class="sm:max-w-xs sm:flex-1">
          <SearchInput
            v-model="search"
            label="Search merchants"
            placeholder="Search business, contact or email"
          />
        </div>
        <div class="sm:w-44">
          <BaseSelect
            v-model="status"
            label="Filter by status"
            label-hidden
            placeholder="All statuses"
            :options="statusOptions"
          />
        </div>
      </div>

      <BaseTable
        :columns="columns"
        :rows="merchants.list"
        :loading="merchants.loading"
        caption="Merchants with status and wallet balance"
        :on-row-click="openMerchant"
      >
        <template #cell:business="{ row }">
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-900">{{ row.business_name }}</p>
            <p class="truncate text-xs text-slate-500">{{ row.name }} · {{ row.email }}</p>
          </div>
        </template>

        <template #cell:bank="{ row }">
          <p class="text-slate-700">{{ row.bank_name }}</p>
          <p class="font-mono text-xs text-slate-500">{{ row.account_number }}</p>
        </template>

        <template #cell:status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <template #cell:balance="{ row }">
          <MoneyFigure :amount="row.wallet_balance" size="sm" />
        </template>

        <template #cell:actions="{ row }">
          <div class="flex items-center justify-end gap-1" @click.stop>
            <BaseButton variant="ghost" size="sm" @click="openMerchant(row)">View</BaseButton>
            <BaseButton variant="ghost" size="sm" @click="pendingToggle = row">
              {{ row.status === 'active' ? 'Deactivate' : 'Activate' }}
            </BaseButton>
          </div>
        </template>

        <template #empty>
          <p class="font-display text-sm font-semibold text-slate-900">
            {{ isFiltered ? 'No merchants match those filters' : 'No merchants yet' }}
          </p>
          <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {{
              isFiltered
                ? 'Try a different search term or clear the status filter.'
                : 'Register your first merchant to start accepting payments.'
            }}
          </p>
          <BaseButton v-if="!isFiltered" size="sm" class="mt-4" @click="registerOpen = true">
            Register merchant
          </BaseButton>
        </template>
      </BaseTable>

      <BasePagination :meta="merchants.meta" label="merchants" @change="goToPage" />
    </BaseCard>

    <RegisterMerchantModal v-model="registerOpen" @registered="merchants.fetchList()" />

    <ConfirmDialog
      :model-value="pendingToggle !== null"
      :title="pendingToggle?.status === 'active' ? 'Deactivate merchant?' : 'Activate merchant?'"
      :confirm-label="pendingToggle?.status === 'active' ? 'Deactivate' : 'Activate'"
      :variant="pendingToggle?.status === 'active' ? 'danger' : 'primary'"
      :loading="toggling"
      @update:model-value="(open) => !open && (pendingToggle = null)"
      @confirm="confirmToggle"
    >
      <p class="text-sm text-slate-600">
        <template v-if="pendingToggle?.status === 'active'">
          <span class="font-medium text-slate-900">{{ pendingToggle?.business_name }}</span> will stop
          accepting new payments. Its wallet balance and history are kept, and you can reactivate it at
          any time.
        </template>
        <template v-else>
          <span class="font-medium text-slate-900">{{ pendingToggle?.business_name }}</span> will be
          able to accept payments again.
        </template>
      </p>
    </ConfirmDialog>
  </div>
</template>
