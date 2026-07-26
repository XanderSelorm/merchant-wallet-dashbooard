<script setup lang="ts">
import { ref } from 'vue'

import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MoneyFigure from '@/components/MoneyFigure.vue'
import PageHeader from '@/components/PageHeader.vue'
import SearchInput from '@/components/SearchInput.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Column } from '@/components/base/table'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const sampleText = ref('Adom Provisions Ltd')
const sampleError = ref('')
const sampleSelect = ref('')
const sampleSearch = ref('')
const modalOpen = ref(false)
const confirmOpen = ref(false)

interface DemoRow {
  id: number
  merchant: string
  amount: number
  status: 'successful' | 'pending' | 'failed'
}

const demoColumns: Column<DemoRow>[] = [
  { key: 'merchant', label: 'Merchant', cell: (row) => row.merchant },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

const demoRows: DemoRow[] = [
  { id: 1, merchant: 'Adom Provisions Ltd', amount: 121605, status: 'successful' },
  { id: 2, merchant: 'Fresh Ventures Ltd', amount: 45000, status: 'pending' },
  { id: 3, merchant: 'Okada Logistics', amount: 8250, status: 'failed' },
]

const tokens = {
  brand: [
    ['brand-50', '#eef4fb'],
    ['brand-500', '#2f65b0'],
    ['brand-600', '#234e92'],
    ['brand-700', '#1d3f76'],
    ['brand-800', '#1a3560'],
    ['brand-950', '#101d34'],
  ],
  status: [
    ['success-600', '#079455'],
    ['warning-600', '#dc6803'],
    ['danger-600', '#d92d20'],
    ['accent-500', '#e11d2e'],
  ],
}

const typeScale = [
  { name: 'Display / 2xl', class: 'font-display text-2xl font-semibold tracking-tight' },
  { name: 'Display / lg', class: 'font-display text-lg font-semibold' },
  { name: 'Body / sm', class: 'text-sm' },
  { name: 'Caption / xs', class: 'text-xs text-slate-500' },
  { name: 'Eyebrow / 2xs', class: 'text-2xs uppercase tracking-wider text-slate-500' },
]
</script>

<template>
  <div>
    <PageHeader
      title="Design system"
      subtitle="The tokens and components every screen in this app is built from."
    />

    <div class="space-y-6">
      <BaseCard title="Colour tokens">
        <div class="space-y-5">
          <div v-for="(swatches, group) in tokens" :key="group">
            <p class="mb-2 text-2xs font-semibold tracking-wider text-slate-500 uppercase">
              {{ group }}
            </p>
            <div class="flex flex-wrap gap-3">
              <div v-for="[name, hex] in swatches" :key="name" class="w-28">
                <div
                  class="h-14 rounded-lg ring-1 ring-slate-900/10 ring-inset"
                  :style="{ backgroundColor: hex }"
                />
                <p class="mt-1.5 font-mono text-2xs text-slate-700">{{ name }}</p>
                <p class="font-mono text-2xs text-slate-500">{{ hex }}</p>
              </div>
            </div>
          </div>
          <p class="border-t border-slate-100 pt-4 text-xs text-slate-500">
            Body text runs at slate-900 on slate-50 and white surfaces; secondary text at slate-500.
            Both clear WCAG AA at their sizes.
          </p>
        </div>
      </BaseCard>

      <BaseCard title="Typography">
        <dl class="space-y-4">
          <div v-for="entry in typeScale" :key="entry.name" class="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <dt class="w-32 shrink-0 font-mono text-2xs text-slate-500">{{ entry.name }}</dt>
            <dd :class="entry.class">Merchant wallet &amp; settlement</dd>
          </div>
        </dl>
        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Space Grotesk carries headings and money figures; Inter carries body copy and tables.
        </p>
      </BaseCard>

      <BaseCard title="Money figures">
        <div class="flex flex-wrap items-end gap-8">
          <div v-for="size in (['sm', 'md', 'lg', 'xl'] as const)" :key="size">
            <p class="mb-1.5 font-mono text-2xs text-slate-500">{{ size }}</p>
            <MoneyFigure :amount="1204730" :size="size" />
          </div>
          <div class="rounded-lg bg-brand-950 px-4 py-3">
            <p class="mb-1.5 font-mono text-2xs text-white/40">inverse</p>
            <MoneyFigure :amount="1204730" size="lg" tone="inverse" />
          </div>
        </div>
        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Currency and decimals recede so magnitude reads first. Assistive tech is given the single
          full amount, not the split parts.
        </p>
      </BaseCard>

      <BaseCard title="Buttons">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <BaseButton>Primary</BaseButton>
            <BaseButton variant="secondary">Secondary</BaseButton>
            <BaseButton variant="danger">Danger</BaseButton>
            <BaseButton variant="ghost">Ghost</BaseButton>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <BaseButton size="sm">Small</BaseButton>
            <BaseButton loading>Loading</BaseButton>
            <BaseButton disabled>Disabled</BaseButton>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Status badges">
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge status="successful" />
          <StatusBadge status="pending" />
          <StatusBadge status="failed" />
          <StatusBadge status="active" />
          <StatusBadge status="inactive" />
          <BaseBadge variant="brand">Brand</BaseBadge>
        </div>
        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Each badge pairs colour with a dot and a text label, so status never depends on colour
          alone. Pending pulses to mark it as in-flight.
        </p>
      </BaseCard>

      <BaseCard title="Form controls">
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput v-model="sampleText" label="Business name" required />
          <BaseInput
            v-model="sampleError"
            label="Account number"
            hint="8–16 digits"
            error="The account number must be 8–16 digits."
          />
          <BaseSelect
            v-model="sampleSelect"
            label="Bank"
            placeholder="Select a bank"
            :options="[
              { value: 'gcb', label: 'GCB Bank' },
              { value: 'eco', label: 'Ecobank Ghana' },
            ]"
          />
          <div class="flex items-end">
            <div class="w-full">
              <p class="mb-1.5 text-sm font-medium text-slate-700">Search</p>
              <SearchInput v-model="sampleSearch" label="Search demo" placeholder="Search merchants" />
            </div>
          </div>
        </div>
        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Every control has a real label tied to its input. Errors set aria-invalid and are announced
          through aria-describedby.
        </p>
      </BaseCard>

      <BaseCard title="Table" flush>
        <BaseTable :columns="demoColumns" :rows="demoRows" caption="Component gallery table example">
          <template #cell:status="{ row }">
            <StatusBadge :status="row.status" />
          </template>
          <template #cell:amount="{ row }">
            <MoneyFigure :amount="row.amount" size="sm" />
          </template>
        </BaseTable>
      </BaseCard>

      <BaseCard title="Empty and loading states" flush>
        <div class="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div>
            <p class="px-5 pt-4 text-2xs font-semibold tracking-wider text-slate-500 uppercase">
              Loading
            </p>
            <BaseTable :columns="demoColumns" :rows="[]" loading caption="Loading state example" />
          </div>
          <div>
            <p class="px-5 pt-4 text-2xs font-semibold tracking-wider text-slate-500 uppercase">
              Empty
            </p>
            <BaseTable
              :columns="demoColumns"
              :rows="[]"
              caption="Empty state example"
              empty-title="No payments yet"
              empty-body="Simulate a customer payment to see it appear here."
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Overlays and feedback">
        <div class="flex flex-wrap gap-3">
          <BaseButton variant="secondary" @click="modalOpen = true">Open modal</BaseButton>
          <BaseButton variant="secondary" @click="confirmOpen = true">Open confirmation</BaseButton>
          <BaseButton variant="secondary" @click="toast.success('Settlement complete.')">
            Success toast
          </BaseButton>
          <BaseButton variant="secondary" @click="toast.error('Could not reach the API.')">
            Error toast
          </BaseButton>
        </div>
        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Modals trap Tab, close on Escape, and return focus to whatever opened them. Toasts announce
          through a polite live region.
        </p>
      </BaseCard>
    </div>

    <BaseModal v-model="modalOpen" title="Modal" description="Focus is trapped until this closes.">
      <p class="text-sm text-slate-600">
        Press Tab to cycle through the controls below, or Escape to close.
      </p>
      <div class="mt-4">
        <BaseInput label="Sample field" model-value="" />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton @click="modalOpen = false">Save changes</BaseButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Run settlement?"
      confirm-label="Run settlement"
      @confirm="((confirmOpen = false), toast.success('Settled 6 merchant wallets.'))"
    >
      <p class="text-sm text-slate-600">
        Confirmations state the consequence before the action, and name the action on the button that
        performs it.
      </p>
    </ConfirmDialog>
  </div>
</template>
