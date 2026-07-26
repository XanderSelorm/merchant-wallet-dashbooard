<script setup lang="ts">
import { computed, onMounted } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import MoneyFigure from '@/components/MoneyFigure.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import VolumeChart from '@/components/dashboard/VolumeChart.vue'
import type { Column } from '@/components/base/table'
import { formatDateTime, formatMoney } from '@/lib/money'
import { useDashboardStore } from '@/stores/dashboard'
import type { Transaction } from '@/types/api'

const dashboard = useDashboardStore()

const summary = computed(() => dashboard.summary)

/**
 * Deliberately narrow: this card sits in a two-fifths column, so it carries
 * only what identifies a payment. The full reference and fee breakdown live
 * on the payments page.
 */
const columns: Column<Transaction>[] = [
  { key: 'merchant', label: 'Merchant' },
  { key: 'date', label: 'When', hideBelow: 'sm' },
  { key: 'status', label: 'Status' },
  { key: 'net', label: 'Net credit', align: 'right' },
]

/** Secondary figures — each states what it is, not just a number. */
const stats = computed(() => {
  const data = summary.value
  if (!data) return []

  return [
    {
      label: 'Payment volume',
      amount: data.total_payment_volume,
      note: `${data.transaction_counts.successful} successful payments`,
    },
    {
      label: 'Platform fees earned',
      amount: data.total_fees_earned,
      note: '1.5% of successful volume',
    },
    {
      label: 'Settled to date',
      amount: data.total_settled,
      note: 'Paid out to merchant banks',
    },
  ]
})

const totalTransactions = computed(() => {
  const counts = summary.value?.transaction_counts
  if (!counts) return 0
  return counts.successful + counts.pending + counts.failed
})

onMounted(() => dashboard.fetchSummary())
</script>

<template>
  <div>
    <PageHeader
      title="Overview"
      subtitle="Where the platform's money is sitting right now."
    />

    <div v-if="dashboard.loading && !summary" class="space-y-6">
      <div class="h-44 animate-pulse rounded-card bg-white shadow-card" />
      <div class="grid gap-4 sm:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-28 animate-pulse rounded-card bg-white shadow-card" />
      </div>
      <div class="h-72 animate-pulse rounded-card bg-white shadow-card" />
    </div>

    <template v-else-if="summary">
      <!-- Float leads: the balance the platform owes merchants right now -->
      <div class="mb-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-card bg-brand-950 p-6 shadow-card lg:col-span-2 sm:p-7">
          <p class="text-2xs tracking-[0.16em] text-white/45 uppercase">Merchant wallet float</p>
          <p class="mt-3">
            <MoneyFigure :amount="summary.total_wallet_balance" size="xl" tone="inverse" />
          </p>
          <p class="mt-2 text-sm text-white/55">
            Held across {{ summary.active_merchant_count }} active
            {{ summary.active_merchant_count === 1 ? 'merchant' : 'merchants' }} and awaiting
            settlement
          </p>

          <dl class="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            <div v-for="status in (['successful', 'pending', 'failed'] as const)" :key="status">
              <dt class="text-2xs tracking-wider text-white/40 uppercase">{{ status }}</dt>
              <dd class="mt-1 font-display text-lg font-semibold tabular-nums text-white">
                {{ summary.transaction_counts[status] }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="rounded-card bg-white p-6 shadow-card">
          <p class="text-2xs tracking-[0.16em] text-slate-500 uppercase">Merchants</p>
          <p class="mt-3 font-display text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
            {{ summary.merchant_count }}
          </p>
          <p class="mt-2 text-sm text-slate-500">
            {{ summary.active_merchant_count }} active ·
            {{ summary.merchant_count - summary.active_merchant_count }} inactive
          </p>
          <p class="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
            <span class="font-display text-lg font-semibold tabular-nums text-slate-900">
              {{ totalTransactions }}
            </span>
            payments recorded
          </p>
        </div>
      </div>

      <div class="mb-6 grid gap-4 sm:grid-cols-3">
        <div v-for="stat in stats" :key="stat.label" class="rounded-card bg-white p-5 shadow-card">
          <p class="text-2xs tracking-wider text-slate-500 uppercase">{{ stat.label }}</p>
          <p class="mt-2.5">
            <MoneyFigure :amount="stat.amount" size="lg" />
          </p>
          <p class="mt-1.5 text-xs text-slate-500">{{ stat.note }}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-5">
        <BaseCard title="Payment volume — last 14 days" class="xl:col-span-3">
          <VolumeChart :series="summary.volume_by_day" />
        </BaseCard>

        <BaseCard title="Recent activity" flush class="xl:col-span-2">
          <template #actions>
            <RouterLink
              :to="{ name: 'transactions' }"
              class="rounded text-sm font-medium text-brand-700 transition-colors hover:text-brand-900"
            >
              View all
            </RouterLink>
          </template>

          <BaseTable
            :columns="columns"
            :rows="summary.recent_transactions"
            caption="The five most recent payments"
            empty-title="No payments yet"
            empty-body="Simulated customer payments will show up here."
          >
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
              <span class="text-slate-500">{{ formatDateTime(row.created_at) }}</span>
            </template>
            <template #cell:status="{ row }">
              <StatusBadge :status="row.status" />
            </template>
            <template #cell:net="{ row }">
              <span
                class="font-medium tabular-nums"
                :class="row.status === 'successful' ? 'text-slate-900' : 'text-slate-400'"
              >
                {{ formatMoney(row.net_amount) }}
              </span>
            </template>
          </BaseTable>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
