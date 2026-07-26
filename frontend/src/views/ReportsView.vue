<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/BasePagination.vue'
import MoneyFigure from '@/components/MoneyFigure.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Column } from '@/components/base/table'
import { formatDate, formatDateTime, formatMoney } from '@/lib/money'
import { useCsvExport } from '@/composables/useCsvExport'
import { useMerchantsStore } from '@/stores/merchants'
import { useReportsStore } from '@/stores/reports'
import { useSettlementsStore } from '@/stores/settlements'
import { useTransactionsStore } from '@/stores/transactions'
import type { Settlement, Transaction, TransactionStatus } from '@/types/api'

type Tab = 'transactions' | 'settlements'

const transactions = useTransactionsStore()
const settlements = useSettlementsStore()
const merchants = useMerchantsStore()
const reports = useReportsStore()
const { exporting, download } = useCsvExport()

const tab = ref<Tab>('transactions')
const status = ref<'' | TransactionStatus>('')
const merchantId = ref<number | ''>('')
const dateFrom = ref('')
const dateTo = ref('')

const transactionColumns: Column<Transaction>[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'date', label: 'Date', hideBelow: 'md' },
  { key: 'status', label: 'Status' },
  { key: 'gross', label: 'Gross', align: 'right', hideBelow: 'sm' },
  { key: 'fee', label: 'Fee', align: 'right', hideBelow: 'lg' },
  { key: 'net', label: 'Net credit', align: 'right' },
]

const settlementColumns: Column<Settlement>[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'date', label: 'Settled on' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

const statusOptions = [
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const merchantOptions = computed(() =>
  merchants.options.map((m) => ({ value: m.id, label: m.business_name })),
)

const isFiltered = computed(() =>
  Boolean(status.value || merchantId.value || dateFrom.value || dateTo.value),
)

/** Filters shared by both tabs; status applies to transactions only. */
const activeParams = computed(() => ({
  status: tab.value === 'transactions' ? status.value || undefined : undefined,
  merchant_id: merchantId.value || undefined,
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
}))

/** Human-readable description of the range the totals cover. */
const rangeLabel = computed(() => {
  const from = dateFrom.value ? formatDate(dateFrom.value) : null
  const to = dateTo.value ? formatDate(dateTo.value) : null

  if (from && to) return `${from} – ${to}`
  if (from) return `From ${from}`
  if (to) return `Up to ${to}`
  return 'All time'
})

const merchantLabel = computed(
  () => merchants.options.find((m) => m.id === merchantId.value)?.business_name ?? null,
)

function fetchActive() {
  reports.fetchSummary({
    merchant_id: merchantId.value,
    date_from: dateFrom.value,
    date_to: dateTo.value,
  })

  if (tab.value === 'transactions') {
    transactions.filters.search = ''
    transactions.filters.status = status.value
    transactions.filters.merchant_id = merchantId.value
    transactions.filters.date_from = dateFrom.value
    transactions.filters.date_to = dateTo.value
    transactions.filters.page = 1
    return transactions.fetchList()
  }

  settlements.filters.merchant_id = merchantId.value
  settlements.filters.date_from = dateFrom.value
  settlements.filters.date_to = dateTo.value
  settlements.filters.page = 1
  return settlements.fetchList()
}

watch([tab, status, merchantId, dateFrom, dateTo], fetchActive)

function clearFilters() {
  status.value = ''
  merchantId.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

function goToPage(page: number) {
  if (tab.value === 'transactions') {
    transactions.filters.page = page
    transactions.fetchList()
  } else {
    settlements.filters.page = page
    settlements.fetchList()
  }
}

onMounted(() => {
  merchants.fetchOptions()
  fetchActive()
})
</script>

<template>
  <div>
    <PageHeader
      title="Reports"
      subtitle="Payment and settlement history, filtered and exportable."
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          :loading="exporting === tab"
          @click="download(tab, activeParams)"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
          </svg>
          Export {{ tab }} CSV
        </BaseButton>
      </template>
    </PageHeader>

    <!--
      Totals are scoped to the filters below, not platform-wide — otherwise
      they would just restate the dashboard. The banner names the scope so the
      figures are never ambiguous.
    -->
    <section class="mb-6 rounded-card bg-white shadow-card" aria-labelledby="report-totals">
      <header
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-5 py-3"
      >
        <h2 id="report-totals" class="text-2xs font-semibold tracking-wider text-slate-500 uppercase">
          Totals for this selection
        </h2>
        <p class="text-xs text-slate-500">
          <span class="font-medium text-slate-700">{{ rangeLabel }}</span>
          <template v-if="merchantLabel">
            · <span class="font-medium text-slate-700">{{ merchantLabel }}</span>
          </template>
          <template v-else> · all merchants</template>
        </p>
      </header>

      <dl class="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div class="p-5">
          <dt class="text-2xs tracking-wider text-slate-500 uppercase">Platform fees earned</dt>
          <dd class="mt-2.5">
            <MoneyFigure :amount="reports.summary?.total_fees_earned ?? 0" size="lg" />
          </dd>
          <dd class="mt-1.5 text-xs text-slate-500">1.5% of successful payment volume</dd>
        </div>
        <div class="p-5">
          <dt class="text-2xs tracking-wider text-slate-500 uppercase">Payment volume</dt>
          <dd class="mt-2.5">
            <MoneyFigure :amount="reports.summary?.total_payment_volume ?? 0" size="lg" />
          </dd>
          <dd class="mt-1.5 text-xs text-slate-500">
            Across {{ reports.summary?.successful_count ?? 0 }} successful
            {{ reports.summary?.successful_count === 1 ? 'payment' : 'payments' }}
          </dd>
        </div>
        <div class="p-5">
          <dt class="text-2xs tracking-wider text-slate-500 uppercase">Settled</dt>
          <dd class="mt-2.5">
            <MoneyFigure :amount="reports.summary?.total_settled ?? 0" size="lg" />
          </dd>
          <dd class="mt-1.5 text-xs text-slate-500">
            Across {{ reports.summary?.settlement_count ?? 0 }}
            {{ reports.summary?.settlement_count === 1 ? 'settlement' : 'settlements' }}
          </dd>
        </div>
      </dl>
    </section>

    <BaseCard flush>
      <div class="border-b border-slate-100 px-4 pt-4">
        <!-- Tabs as radio-style buttons so keyboard users get a single stop -->
        <div class="flex gap-1" role="tablist" aria-label="Report type">
          <button
            v-for="option in (['transactions', 'settlements'] as Tab[])"
            :key="option"
            type="button"
            role="tab"
            :aria-selected="tab === option"
            class="rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium capitalize transition-colors"
            :class="
              tab === option
                ? 'border-brand-700 text-brand-800'
                : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
            "
            @click="tab = option"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-end">
          <div v-if="tab === 'transactions'" class="lg:w-40">
            <BaseSelect
              v-model="status"
              label="Filter by status"
              label-hidden
              placeholder="All statuses"
              :options="statusOptions"
            />
          </div>
          <div class="lg:w-48">
            <BaseSelect
              v-model="merchantId"
              label="Filter by merchant"
              label-hidden
              placeholder="All merchants"
              :options="merchantOptions"
            />
          </div>
          <BaseInput v-model="dateFrom" label="From" type="date" />
          <BaseInput v-model="dateTo" label="To" type="date" />
        </div>
        <BaseButton v-if="isFiltered" variant="ghost" size="sm" class="lg:mb-0.5" @click="clearFilters">
          Clear filters
        </BaseButton>
      </div>

      <BaseTable
        v-if="tab === 'transactions'"
        :columns="transactionColumns"
        :rows="transactions.list"
        :loading="transactions.loading"
        caption="Transaction history"
        empty-title="No payments match those filters"
        empty-body="Try a wider date range or clear the filters."
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
          >
            {{ formatMoney(row.net_amount) }}
          </span>
        </template>
      </BaseTable>

      <BaseTable
        v-else
        :columns="settlementColumns"
        :rows="settlements.list"
        :loading="settlements.loading"
        caption="Settlement history"
        empty-title="No settlements match those filters"
        empty-body="Try a wider date range or clear the filters."
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
          <span class="text-slate-600">{{ formatDate(row.settled_on) }}</span>
        </template>
        <template #cell:amount="{ row }">
          <MoneyFigure :amount="row.amount" size="sm" />
        </template>
      </BaseTable>

      <BasePagination
        :meta="tab === 'transactions' ? transactions.meta : settlements.meta"
        :label="tab === 'transactions' ? 'payments' : 'settlements'"
        @change="goToPage"
      />
    </BaseCard>
  </div>
</template>
