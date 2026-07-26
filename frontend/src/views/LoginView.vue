<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useAuthStore } from '@/stores/auth'
import { validationErrors } from '@/lib/http'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('admin@kudi.test')
const password = ref('password')
const errors = ref<Record<string, string>>({})
const formError = ref('')
const submitting = ref(false)

async function submit() {
  submitting.value = true
  errors.value = {}
  formError.value = ''

  try {
    await auth.login(email.value, password.value)
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : { name: 'dashboard' })
  } catch (error) {
    const fieldErrors = validationErrors(error)
    if (fieldErrors) {
      errors.value = fieldErrors
    } else if (axios.isAxiosError(error) && !error.response) {
      formError.value = 'Cannot reach the API. Check that the backend is running on port 8000.'
    } else {
      formError.value = 'Something went wrong signing in. Try again.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
    <!-- Brand panel: states the product's job in the operator's own language -->
    <div class="on-dark relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 lg:flex xl:p-14">
      <div class="flex items-center gap-3">
        <span class="flex size-9 items-center justify-center rounded-lg bg-white">
          <span class="font-display text-base font-bold text-brand-950">K</span>
        </span>
        <span class="font-display text-sm font-bold tracking-tight text-white">KUDI SYSTEMS</span>
      </div>

      <div class="max-w-md">
        <p class="text-2xs tracking-[0.2em] text-white/45 uppercase">Wallet operations</p>
        <h1 class="mt-4 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-white xl:text-5xl">
          Every pesewa, from payment to payout.
        </h1>
        <p class="mt-5 text-sm leading-relaxed text-white/60">
          Track merchant wallet balances, simulate customer payments, and run daily settlements — with
          a ledger behind every figure.
        </p>
      </div>

      <dl class="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
        <div>
          <dt class="text-2xs tracking-wider text-white/40 uppercase">Fee</dt>
          <dd class="mt-1 font-display text-lg font-semibold text-white">1.5%</dd>
        </div>
        <div>
          <dt class="text-2xs tracking-wider text-white/40 uppercase">Settlement</dt>
          <dd class="mt-1 font-display text-lg font-semibold text-white">Daily</dd>
        </div>
        <div>
          <dt class="text-2xs tracking-wider text-white/40 uppercase">Currency</dt>
          <dd class="mt-1 font-display text-lg font-semibold text-white">GH₵</dd>
        </div>
      </dl>
    </div>

    <div class="flex items-center justify-center px-4 py-12 sm:px-8">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <span class="flex size-8 items-center justify-center rounded-lg bg-brand-950">
            <span class="font-display text-sm font-bold text-white">K</span>
          </span>
          <span class="font-display text-sm font-bold tracking-tight text-brand-950">KUDI SYSTEMS</span>
        </div>

        <h2 class="font-display text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
        <p class="mt-1.5 text-sm text-slate-500">Use your operations account to continue.</p>

        <form class="mt-8 space-y-4" novalidate @submit.prevent="submit">
          <div
            v-if="formError"
            class="rounded-lg bg-danger-50 px-3.5 py-3 text-sm text-danger-700 ring-1 ring-danger-600/20 ring-inset"
            role="alert"
          >
            {{ formError }}
          </div>

          <BaseInput
            v-model="email"
            label="Email address"
            type="email"
            autocomplete="username"
            required
            :error="errors.email"
          />
          <BaseInput
            v-model="password"
            label="Password"
            type="password"
            autocomplete="current-password"
            required
            :error="errors.password"
          />

          <BaseButton type="submit" :loading="submitting" class="w-full">
            {{ submitting ? 'Signing in…' : 'Sign in' }}
          </BaseButton>
        </form>

        <p class="mt-6 rounded-lg bg-slate-100 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
          <span class="font-medium text-slate-700">Demo account</span> — the seeded credentials are
          pre-filled: <span class="font-mono">admin@kudi.test</span> /
          <span class="font-mono">password</span>
        </p>
      </div>
    </div>
  </div>
</template>
