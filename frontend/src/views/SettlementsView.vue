<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/BasePagination.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MoneyFigure from '@/components/MoneyFigure.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { Column } from '@/components/base/table'
import { formatDate, formatMoney } from '@/lib/money'
import { useMerchantsStore } from '@/stores/merchants'
import { useSettlementsStore } from '@/stores/settlements'
import { useDashboardStore } from '@/stores/dashboard'
import { useToast } from '@/composables/useToast'
import type { Settlement } from '@/types/api'

const settlements = useSettlementsStore()
const merchants = useMerchantsStore()
const dashboard = useDashboardStore()
const toast = useToast()

const dateFrom = ref('')
const dateTo = ref('')
const runOpen = ref(false)

const columns: Column<Settlement>[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'date', label: 'Settled on' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

/** Merchants holding a positive balance are exactly what a run will sweep. */
const pending = computed(() => merchants.options.filter((m) => m.wallet_balance > 0))
const pendingTotal = computed(() => pending.value.reduce((sum, m) => sum + m.wallet_balance, 0))
const isFiltered = computed(() => Boolean(dateFrom.value || dateTo.value))

watch([dateFrom, dateTo], () => {
  settlements.filters.date_from = dateFrom.value
  settlements.filters.date_to = dateTo.value
  settlements.filters.page = 1
  settlements.fetchList()
})

function goToPage(page: number) {
  settlements.filters.page = page
  settlements.fetchList()
}

async function confirmRun() {
  try {
    const { message, count } = await settlements.runSettlement()

    // Refetch everything the sweep touched so wallets and history agree.
    await Promise.all([
      settlements.fetchList(),
      merchants.fetchOptions(),
      merchants.fetchList(),
      dashboard.fetchSummary(),
    ])

    runOpen.value = false
    count > 0 ? toast.success(message) : toast.info(message)
  } catch {
    toast.error('The settlement run did not complete. No balances were moved.')
  }
}

onMounted(() => {
  settlements.filters.page = 1
  settlements.fetchList()
  merchants.fetchOptions()
  dashboard.fetchSummary()
})
</script>

<template>
  <div>
    <PageHeader
      title="Settlements"
      subtitle="Wallet balances swept to merchant bank accounts."
    >
      <template #actions>
        <BaseButton :disabled="settlements.running" @click="runOpen = true">
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M12 19l-4-4M12 19l4-4" />
          </svg>
          Run settlement
        </BaseButton>
      </template>
    </PageHeader>

    <!-- What a run would do right now, stated before the operator commits -->
    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="rounded-card bg-brand-950 p-5 shadow-card sm:col-span-2">
        <p class="text-2xs tracking-wider text-white/45 uppercase">Awaiting settlement</p>
        <p class="mt-2">
          <MoneyFigure :amount="pendingTotal" size="lg" tone="inverse" />
        </p>
        <p class="mt-1.5 text-sm text-white/55">
          <template v-if="pending.length">
            Held across {{ pending.length }}
            {{ pending.length === 1 ? 'merchant wallet' : 'merchant wallets' }}
          </template>
          <template v-else>Every wallet is settled — nothing to sweep</template>
        </p>
      </div>

      <div class="rounded-card bg-white p-5 shadow-card">
        <p class="text-2xs tracking-wider text-slate-500 uppercase">Settled to date</p>
        <p class="mt-2">
          <MoneyFigure :amount="dashboard.summary?.total_settled ?? 0" size="lg" />
        </p>
        <p class="mt-1.5 text-sm text-slate-500">
          Across {{ settlements.meta?.total ?? 0 }}
          {{ settlements.meta?.total === 1 ? 'settlement' : 'settlements' }}
        </p>
      </div>
    </div>

    <BaseCard title="Settlement history" flush>
      <template #actions>
        <div class="flex items-end gap-2">
          <BaseInput v-model="dateFrom" label="From" type="date" />
          <BaseInput v-model="dateTo" label="To" type="date" />
          <BaseButton
            v-if="isFiltered"
            variant="ghost"
            size="sm"
            @click="((dateFrom = ''), (dateTo = ''))"
          >
            Clear
          </BaseButton>
        </div>
      </template>

      <BaseTable
        :columns="columns"
        :rows="settlements.list"
        :loading="settlements.loading"
        caption="Settlements with merchant, date, reference and amount"
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
          <span v-else class="text-slate-400">—</span>
        </template>

        <template #cell:date="{ row }">
          <span class="text-slate-600">{{ formatDate(row.settled_on) }}</span>
        </template>

        <template #cell:amount="{ row }">
          <MoneyFigure :amount="row.amount" size="sm" />
        </template>

        <template #empty>
          <p class="font-display text-sm font-semibold text-slate-900">
            {{ isFiltered ? 'No settlements in that date range' : 'No settlements yet' }}
          </p>
          <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {{
              isFiltered
                ? 'Try a wider range, or clear the dates to see all settlements.'
                : 'Run a settlement to sweep positive wallet balances to merchant bank accounts.'
            }}
          </p>
        </template>
      </BaseTable>

      <BasePagination :meta="settlements.meta" label="settlements" @change="goToPage" />
    </BaseCard>

    <ConfirmDialog
      v-model="runOpen"
      title="Run settlement?"
      :confirm-label="pending.length ? 'Run settlement' : 'Run anyway'"
      :loading="settlements.running"
      @confirm="confirmRun"
    >
      <div class="space-y-3 text-sm text-slate-600">
        <template v-if="pending.length">
          <p>
            This sweeps
            <span class="font-medium text-slate-900">{{ formatMoney(pendingTotal) }}</span>
            from {{ pending.length }}
            {{ pending.length === 1 ? 'wallet' : 'wallets' }} into settlement records and resets those
            balances to zero. Merchants with no balance are skipped.
          </p>
          <ul class="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-3">
            <li
              v-for="merchant in pending"
              :key="merchant.id"
              class="flex items-baseline justify-between gap-4 text-xs"
            >
              <span class="truncate text-slate-600">{{ merchant.business_name }}</span>
              <span class="shrink-0 font-medium tabular-nums text-slate-900">
                {{ formatMoney(merchant.wallet_balance) }}
              </span>
            </li>
          </ul>
          <p class="text-xs text-slate-500">
            Running this twice in a row is safe — a second run finds nothing left to settle.
          </p>
        </template>
        <p v-else>
          Every wallet balance is already settled, so this run will not move any money.
        </p>
      </div>
    </ConfirmDialog>
  </div>
</template>
