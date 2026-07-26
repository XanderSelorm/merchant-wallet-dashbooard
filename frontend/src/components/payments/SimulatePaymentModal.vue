<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { formatMoney } from '@/lib/money'
import { generateReference, parseAmountToMinorUnits, processingFee } from '@/lib/fees'
import { validationErrors } from '@/lib/http'
import { useMerchantsStore } from '@/stores/merchants'
import { useTransactionsStore } from '@/stores/transactions'
import { useToast } from '@/composables/useToast'
import type { Merchant, Transaction } from '@/types/api'

const props = defineProps<{ merchants: Merchant[]; presetMerchantId?: number }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ paid: [transaction: Transaction] }>()

const transactions = useTransactionsStore()
const merchantsStore = useMerchantsStore()
const toast = useToast()

const merchantId = ref<number | ''>('')
const amount = ref('')
const reference = ref(generateReference())
const errors = ref<Record<string, string>>({})
const formError = ref('')
const submitting = ref(false)

/** Only active merchants can take payments — the backend rejects the rest. */
const merchantOptions = computed(() =>
  props.merchants
    .filter((merchant) => merchant.status === 'active')
    .map((merchant) => ({ value: merchant.id, label: merchant.business_name })),
)

const grossMinorUnits = computed(() => parseAmountToMinorUnits(amount.value))
const feeMinorUnits = computed(() =>
  grossMinorUnits.value === null ? null : processingFee(grossMinorUnits.value),
)
const netMinorUnits = computed(() =>
  grossMinorUnits.value === null || feeMinorUnits.value === null
    ? null
    : grossMinorUnits.value - feeMinorUnits.value,
)

const selectedMerchant = computed(() =>
  props.merchants.find((merchant) => merchant.id === merchantId.value),
)

watch(open, (isOpen) => {
  if (isOpen) {
    merchantId.value = props.presetMerchantId ?? ''
    amount.value = ''
    reference.value = generateReference()
    errors.value = {}
    formError.value = ''
  }
})

function validate(): boolean {
  const found: Record<string, string> = {}

  if (!merchantId.value) found.merchant_id = 'Choose the merchant receiving this payment.'
  if (!amount.value.trim()) found.amount = 'Enter the amount the customer paid.'
  else if (grossMinorUnits.value === null)
    found.amount = 'Enter a positive amount, using up to two decimal places.'
  if (!reference.value.trim()) found.reference = 'Enter a payment reference.'

  errors.value = found
  return Object.keys(found).length === 0
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    const transaction = await transactions.simulatePayment({
      merchant_id: Number(merchantId.value),
      amount: grossMinorUnits.value!,
      reference: reference.value.trim(),
    })

    toast.success(
      `${formatMoney(transaction.net_amount)} credited to ${transaction.merchant?.business_name ?? 'the merchant'}.`,
    )
    emit('paid', transaction)
    open.value = false
  } catch (error) {
    const fieldErrors = validationErrors(error)
    if (fieldErrors) {
      errors.value = fieldErrors
    } else if (axios.isAxiosError(error) && !error.response) {
      formError.value = 'Cannot reach the API. Check that the backend is running.'
    } else {
      formError.value = 'Could not record the payment. Try again.'
    }
  } finally {
    submitting.value = false
  }
}

// Ensure the picker has options even when opened before the list has loaded.
watch(open, (isOpen) => {
  if (isOpen && !props.merchants.length) merchantsStore.fetchOptions()
})
</script>

<template>
  <BaseModal
    v-model="open"
    title="Simulate a customer payment"
    description="Records a transaction and credits the merchant wallet, less the processing fee."
  >
    <form id="simulate-payment" class="space-y-4" novalidate @submit.prevent="submit">
      <div
        v-if="formError"
        class="rounded-lg bg-danger-50 px-3.5 py-3 text-sm text-danger-700 ring-1 ring-danger-600/20 ring-inset"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseSelect
        v-model="merchantId"
        label="Merchant"
        placeholder="Select a merchant"
        :options="merchantOptions"
        required
        :error="errors.merchant_id"
      />

      <BaseInput
        v-model="amount"
        label="Amount paid by customer"
        inputmode="decimal"
        placeholder="250.00"
        hint="In Ghana cedis, e.g. 250.00"
        required
        :error="errors.amount"
      />

      <BaseInput
        v-model="reference"
        label="Payment reference"
        placeholder="PAY-XXXXXXXXXX"
        hint="Pre-filled with a unique reference; edit if you need a specific one."
        required
        :error="errors.reference"
      />

      <!--
        Live breakdown: the operator sees exactly what the wallet will receive
        before committing. Computed with the same integer maths as the backend.
      -->
      <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 ring-inset">
        <p class="text-2xs font-semibold tracking-wider text-slate-500 uppercase">
          Wallet credit preview
        </p>

        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-slate-600">Gross amount</dt>
            <dd class="font-medium tabular-nums text-slate-900">
              {{ grossMinorUnits === null ? '—' : formatMoney(grossMinorUnits) }}
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-slate-600">Processing fee <span class="text-slate-400">(1.5%)</span></dt>
            <dd class="font-medium tabular-nums text-danger-700">
              {{ feeMinorUnits === null ? '—' : `−${formatMoney(feeMinorUnits)}` }}
            </dd>
          </div>
          <div
            class="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2.5"
          >
            <dt class="font-medium text-slate-900">Net wallet credit</dt>
            <dd class="font-display text-base font-semibold tabular-nums text-success-700">
              {{ netMinorUnits === null ? '—' : formatMoney(netMinorUnits) }}
            </dd>
          </div>
        </dl>

        <p v-if="selectedMerchant" class="mt-3 border-t border-slate-200 pt-2.5 text-xs text-slate-500">
          {{ selectedMerchant.business_name }} balance after this payment:
          <span class="font-medium tabular-nums text-slate-700">
            {{ formatMoney(selectedMerchant.wallet_balance + (netMinorUnits ?? 0)) }}
          </span>
        </p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="submitting" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="simulate-payment" :loading="submitting">
        {{ submitting ? 'Recording…' : 'Record payment' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
