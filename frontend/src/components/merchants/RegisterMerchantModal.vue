<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import axios from 'axios'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { bankOptions } from '@/lib/banks'
import { validationErrors } from '@/lib/http'
import { useMerchantsStore, type MerchantPayload } from '@/stores/merchants'
import { useToast } from '@/composables/useToast'
import type { Merchant } from '@/types/api'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ registered: [merchant: Merchant] }>()

const merchants = useMerchantsStore()
const toast = useToast()

const blank = (): MerchantPayload => ({
  name: '',
  email: '',
  business_name: '',
  account_number: '',
  bank_name: '',
})

const form = reactive<MerchantPayload>(blank())
const errors = ref<Record<string, string>>({})
const formError = ref('')
const submitting = ref(false)

// Start each visit from a clean slate.
watch(open, (isOpen) => {
  if (isOpen) {
    Object.assign(form, blank())
    errors.value = {}
    formError.value = ''
  }
})

/** Client-side checks mirror the backend rules so feedback is immediate. */
function validate(): boolean {
  const found: Record<string, string> = {}

  if (!form.name.trim()) found.name = 'Enter the contact name.'
  if (!form.email.trim()) found.email = 'Enter an email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) found.email = 'Enter a valid email address.'
  if (!form.business_name.trim()) found.business_name = 'Enter the business name.'
  if (!/^\d{8,16}$/.test(form.account_number)) found.account_number = 'The account number must be 8–16 digits.'
  if (!form.bank_name) found.bank_name = 'Select a bank.'

  errors.value = found
  return Object.keys(found).length === 0
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    const merchant = await merchants.register({ ...form })
    toast.success(`${merchant.business_name} registered.`)
    emit('registered', merchant)
    open.value = false
  } catch (error) {
    const fieldErrors = validationErrors(error)
    if (fieldErrors) {
      errors.value = fieldErrors
    } else if (axios.isAxiosError(error) && !error.response) {
      formError.value = 'Cannot reach the API. Check that the backend is running.'
    } else {
      formError.value = 'Could not register the merchant. Try again.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal
    v-model="open"
    title="Register merchant"
    description="Onboard a business so it can start accepting payments."
  >
    <form id="register-merchant" class="space-y-4" novalidate @submit.prevent="submit">
      <div
        v-if="formError"
        class="rounded-lg bg-danger-50 px-3.5 py-3 text-sm text-danger-700 ring-1 ring-danger-600/20 ring-inset"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseInput
        v-model="form.business_name"
        label="Business name"
        placeholder="Adom Provisions Ltd"
        required
        :error="errors.business_name"
      />

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.name"
          label="Contact name"
          placeholder="Ama Mensah"
          autocomplete="name"
          required
          :error="errors.name"
        />
        <BaseInput
          v-model="form.email"
          label="Email address"
          type="email"
          placeholder="ama@adom.com"
          autocomplete="email"
          required
          :error="errors.email"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseSelect
          v-model="form.bank_name"
          label="Bank"
          placeholder="Select a bank"
          :options="bankOptions"
          required
          :error="errors.bank_name"
        />
        <BaseInput
          v-model="form.account_number"
          label="Account number"
          inputmode="numeric"
          placeholder="1234567890"
          hint="8–16 digits"
          required
          :error="errors.account_number"
        />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="submitting" @click="open = false">Cancel</BaseButton>
      <!-- Footer sits outside <form>, so the submit button is wired by form id -->
      <BaseButton type="submit" form="register-merchant" :loading="submitting">
        {{ submitting ? 'Registering…' : 'Register merchant' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
