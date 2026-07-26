<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/BasePagination.vue'
import PageHeader from '@/components/PageHeader.vue'
import SearchInput from '@/components/SearchInput.vue'
import SimulatePaymentModal from '@/components/payments/SimulatePaymentModal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Column } from '@/components/base/table'
import { formatDateTime, formatMoney } from '@/lib/money'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useMerchantsStore } from '@/stores/merchants'
import { useTransactionsStore } from '@/stores/transactions'
import type { Transaction, TransactionStatus } from '@/types/api'

const transactions = useTransactionsStore()
const merchants = useMerchantsStore()
const route = useRoute()
const router = useRouter()

const search = useDebouncedRef('', 300)
const status = ref<'' | TransactionStatus>('')
const dateFrom = ref('')
const dateTo = ref('')
const payOpen = ref(false)

/**
 * Arriving from a merchant page pre-selects that merchant. Captured into a ref
 * because the query string is cleared straight after, before the modal's own
 * watcher runs.
 */
const presetMerchantId = ref<number | undefined>()

const columns: Column<Transaction>[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'date', label: 'Date', hideBelow: 'md' },
  { key: 'status', label: 'Status' },
  { key: 'gross', label: 'Gross', align: 'right', hideBelow: 'sm' },
  { key: 'fee', label: 'Fee', align: 'right', hideBelow: 'lg' },
  { key: 'net', label: 'Net credit', align: 'right' },
]

const statusOptions = [
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const isFiltered = computed(() =>
  Boolean(search.value || status.value || dateFrom.value || dateTo.value),
)

function applyFilters() {
  transactions.filters.search = search.value
  transactions.filters.status = status.value
  transactions.filters.date_from = dateFrom.value
  transactions.filters.date_to = dateTo.value
  transactions.filters.page = 1
  transactions.fetchList()
}

watch([search, status, dateFrom, dateTo], applyFilters)

function clearFilters() {
  search.value = ''
  status.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

function goToPage(page: number) {
  transactions.filters.page = page
  transactions.fetchList()
}

/** After a payment, refresh the list and the merchant balances behind it. */
async function onPaid() {
  await Promise.all([transactions.fetchList(), merchants.fetchOptions()])
}

onMounted(async () => {
  transactions.filters.page = 1
  await Promise.all([transactions.fetchList(), merchants.fetchOptions()])

  // Deep link from a merchant detail page opens the form straight away.
  const requested = Number(route.query.merchant)
  if (Number.isFinite(requested) && requested > 0) {
    presetMerchantId.value = requested
    payOpen.value = true
    router.replace({ name: 'transactions' })
  }
})
</script>

<template>
  <div>
    <PageHeader
      title="Payments"
      subtitle="Customer payments, the fee taken, and what reached each wallet."
    >
      <template #actions>
        <BaseButton @click="payOpen = true">
          <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              d="M10 4a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 0110 4z"
            />
          </svg>
          Simulate payment
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard flush>
      <div class="border-b border-slate-100 p-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div class="lg:max-w-xs lg:flex-1">
            <SearchInput
              v-model="search"
              label="Search transactions"
              placeholder="Search reference or merchant"
            />
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-end">
            <div class="lg:w-40">
              <BaseSelect
                v-model="status"
                label="Filter by status"
                label-hidden
                placeholder="All statuses"
                :options="statusOptions"
              />
            </div>
            <BaseInput v-model="dateFrom" label="From" type="date" />
            <BaseInput v-model="dateTo" label="To" type="date" />
          </div>
          <BaseButton v-if="isFiltered" variant="ghost" size="sm" class="lg:mb-0.5" @click="clearFilters">
            Clear filters
          </BaseButton>
        </div>
      </div>

      <BaseTable
        :columns="columns"
        :rows="transactions.list"
        :loading="transactions.loading"
        caption="Customer payments with fee and net wallet credit"
      >
        <template #cell:reference="{ row }">
          <span class="font-mono text-xs text-slate-700">{{ row.reference }}</span>
        </template>

        <template #cell:merchant="{ row }">
          <RouterLink
            v-if="row.merchant"
            :to="{ name: 'merchant-detail', params: { id: row.merchant_id } }"
            class="rounded font-medium text-slate-900 transition-colors hover:text-brand-700"
          >
            {{ row.merchant.business_name }}
          </RouterLink>
          <span v-else class="text-slate-500">—</span>
        </template>

        <template #cell:date="{ row }">
          <span class="text-slate-500">{{ formatDateTime(row.created_at) }}</span>
        </template>

        <template #cell:status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <template #cell:gross="{ row }">
          <span class="tabular-nums text-slate-600">{{ formatMoney(row.gross_amount) }}</span>
        </template>

        <template #cell:fee="{ row }">
          <span class="tabular-nums text-slate-500">−{{ formatMoney(row.fee_amount) }}</span>
        </template>

        <template #cell:net="{ row }">
          <span
            class="font-medium tabular-nums"
            :class="row.status === 'successful' ? 'text-slate-900' : 'text-slate-500'"
            :title="row.status === 'successful' ? undefined : 'Only successful payments credit the wallet'"
          >
            {{ formatMoney(row.net_amount) }}
          </span>
        </template>

        <template #empty>
          <p class="font-display text-sm font-semibold text-slate-900">
            {{ isFiltered ? 'No payments match those filters' : 'No payments yet' }}
          </p>
          <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {{
              isFiltered
                ? 'Try a wider date range, or clear the filters to see everything.'
                : 'Simulate a customer payment to see it appear here.'
            }}
          </p>
          <BaseButton
            v-if="isFiltered"
            variant="secondary"
            size="sm"
            class="mt-4"
            @click="clearFilters"
          >
            Clear filters
          </BaseButton>
          <BaseButton v-else size="sm" class="mt-4" @click="payOpen = true">
            Simulate payment
          </BaseButton>
        </template>
      </BaseTable>

      <BasePagination :meta="transactions.meta" label="payments" @change="goToPage" />
    </BaseCard>

    <SimulatePaymentModal
      v-model="payOpen"
      :merchants="merchants.options"
      :preset-merchant-id="presetMerchantId"
      @paid="onPaid"
    />
  </div>
</template>
