<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/BasePagination.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MoneyFigure from '@/components/MoneyFigure.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Column } from '@/components/base/table'
import { formatDate, formatDateTime, formatMoney } from '@/lib/money'
import { useMerchantsStore } from '@/stores/merchants'
import { useToast } from '@/composables/useToast'
import type { Settlement, Transaction } from '@/types/api'

const props = defineProps<{ id: number }>()

const merchants = useMerchantsStore()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const loadError = ref(false)
const toggleOpen = ref(false)
const toggling = ref(false)

const transactionColumns: Column<Transaction>[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'date', label: 'Date', hideBelow: 'sm' },
  { key: 'status', label: 'Status' },
  { key: 'gross', label: 'Gross', align: 'right', hideBelow: 'md' },
  { key: 'fee', label: 'Fee', align: 'right', hideBelow: 'md' },
  { key: 'net', label: 'Net credit', align: 'right' },
]

const settlementColumns: Column<Settlement>[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'date', label: 'Settled on' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

async function load() {
  loading.value = true
  loadError.value = false
  try {
    await Promise.all([
      merchants.fetchOne(props.id),
      merchants.fetchTransactions(props.id),
      merchants.fetchSettlements(props.id),
    ])
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function confirmToggle() {
  const merchant = merchants.current
  if (!merchant) return

  toggling.value = true
  const next = merchant.status === 'active' ? 'inactive' : 'active'

  try {
    await merchants.setStatus(merchant.id, next)
    toast.success(next === 'inactive' ? 'Merchant deactivated.' : 'Merchant reactivated.')
    toggleOpen.value = false
  } catch {
    toast.error('Could not update the merchant status. Try again.')
  } finally {
    toggling.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <nav class="mb-4">
      <RouterLink
        :to="{ name: 'merchants' }"
        class="inline-flex items-center gap-1.5 rounded text-sm font-medium text-slate-500 transition-colors hover:text-brand-700"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L9.06 10l3.71 3.71a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.08.02z"
            clip-rule="evenodd"
          />
        </svg>
        All merchants
      </RouterLink>
    </nav>

    <div v-if="loadError" class="rounded-card bg-white p-8 text-center shadow-card">
      <p class="font-display text-base font-semibold text-slate-900">Could not load this merchant</p>
      <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        The merchant may have been removed, or the API is unreachable.
      </p>
      <div class="mt-4 flex justify-center gap-2">
        <BaseButton variant="secondary" @click="router.push({ name: 'merchants' })">
          Back to merchants
        </BaseButton>
        <BaseButton @click="load">Try again</BaseButton>
      </div>
    </div>

    <div v-else-if="loading" class="space-y-6">
      <div class="h-44 animate-pulse rounded-card bg-white shadow-card" />
      <div class="h-64 animate-pulse rounded-card bg-white shadow-card" />
    </div>

    <template v-else-if="merchants.current">
      <!-- Wallet position leads: the figure an operator opens this page for -->
      <div class="mb-6 overflow-hidden rounded-card bg-brand-950 shadow-card">
        <div class="flex flex-wrap items-start justify-between gap-6 p-6 sm:p-7">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {{ merchants.current.business_name }}
              </h1>
              <StatusBadge :status="merchants.current.status" />
            </div>
            <p class="mt-1.5 text-sm text-white/55">
              {{ merchants.current.name }} · {{ merchants.current.email }}
            </p>
            <dl class="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt class="text-2xs tracking-wider text-white/40 uppercase">Bank</dt>
                <dd class="mt-0.5 text-sm text-white">{{ merchants.current.bank_name }}</dd>
              </div>
              <div>
                <dt class="text-2xs tracking-wider text-white/40 uppercase">Account</dt>
                <dd class="mt-0.5 font-mono text-sm text-white">
                  {{ merchants.current.account_number }}
                </dd>
              </div>
              <div>
                <dt class="text-2xs tracking-wider text-white/40 uppercase">Onboarded</dt>
                <dd class="mt-0.5 text-sm text-white">
                  {{ formatDate(merchants.current.created_at) }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="shrink-0 sm:text-right">
            <p class="text-2xs tracking-wider text-white/40 uppercase">Wallet balance</p>
            <p class="mt-1.5">
              <MoneyFigure :amount="merchants.current.wallet_balance" size="xl" tone="inverse" />
            </p>
            <p class="mt-1 text-xs text-white/45">Awaiting settlement</p>
          </div>
        </div>

        <div class="on-dark flex flex-wrap gap-2 border-t border-white/10 px-6 py-4">
          <BaseButton variant="secondary" size="sm" @click="toggleOpen = true">
            {{ merchants.current.status === 'active' ? 'Deactivate merchant' : 'Activate merchant' }}
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="router.push({ name: 'transactions', query: { merchant: props.id } })"
          >
            Simulate a payment
          </BaseButton>
        </div>
      </div>

      <!-- Stacked rather than side by side: the transaction table needs the
           full width for its six columns to stay readable. -->
      <div class="space-y-6">
        <BaseCard title="Transactions" flush>
          <BaseTable
            :columns="transactionColumns"
            :rows="merchants.currentTransactions?.data ?? []"
            caption="Transactions for this merchant"
            empty-title="No transactions yet"
            empty-body="Payments simulated for this merchant will appear here."
          >
            <template #cell:reference="{ row }">
              <span class="font-mono text-xs text-slate-700">{{ row.reference }}</span>
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
          <BasePagination
            :meta="merchants.currentTransactions?.meta ?? null"
            label="transactions"
            @change="(page) => merchants.fetchTransactions(props.id, page)"
          />
        </BaseCard>

        <BaseCard title="Settlements" flush>
          <BaseTable
            :columns="settlementColumns"
            :rows="merchants.currentSettlements?.data ?? []"
            caption="Settlements paid out to this merchant"
            empty-title="No settlements yet"
            empty-body="Run a settlement to sweep this wallet balance to the merchant's bank account."
          >
            <template #cell:reference="{ row }">
              <span class="font-mono text-xs text-slate-700">{{ row.reference }}</span>
            </template>
            <template #cell:date="{ row }">
              <span class="text-slate-600">{{ formatDate(row.settled_on) }}</span>
            </template>
            <template #cell:amount="{ row }">
              <MoneyFigure :amount="row.amount" size="sm" />
            </template>
          </BaseTable>
          <BasePagination
            :meta="merchants.currentSettlements?.meta ?? null"
            label="settlements"
            @change="(page) => merchants.fetchSettlements(props.id, page)"
          />
        </BaseCard>
      </div>

      <ConfirmDialog
        v-model="toggleOpen"
        :title="merchants.current.status === 'active' ? 'Deactivate merchant?' : 'Activate merchant?'"
        :confirm-label="merchants.current.status === 'active' ? 'Deactivate' : 'Activate'"
        :variant="merchants.current.status === 'active' ? 'danger' : 'primary'"
        :loading="toggling"
        @confirm="confirmToggle"
      >
        <p class="text-sm text-slate-600">
          <template v-if="merchants.current.status === 'active'">
            <span class="font-medium text-slate-900">{{ merchants.current.business_name }}</span> will
            stop accepting new payments. Its wallet balance of
            {{ formatMoney(merchants.current.wallet_balance) }} and full history are kept.
          </template>
          <template v-else>
            <span class="font-medium text-slate-900">{{ merchants.current.business_name }}</span> will
            be able to accept payments again.
          </template>
        </p>
      </ConfirmDialog>
    </template>
  </div>
</template>
