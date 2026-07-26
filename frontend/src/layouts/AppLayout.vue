<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ToastHost from '@/components/ToastHost.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const navOpen = ref(false)
const loggingOut = ref(false)

// Close the mobile drawer whenever navigation happens.
watch(() => route.fullPath, () => (navOpen.value = false))

const nav = [
  { to: { name: 'dashboard' }, label: 'Overview', icon: 'grid' },
  { to: { name: 'merchants' }, label: 'Merchants', icon: 'store' },
  { to: { name: 'transactions' }, label: 'Payments', icon: 'arrows' },
  { to: { name: 'settlements' }, label: 'Settlements', icon: 'bank' },
  { to: { name: 'reports' }, label: 'Reports', icon: 'chart' },
] as const

const icons: Record<string, string> = {
  grid: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
  store: 'M3 9l1.5-5h15L21 9M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M9 20v-6h6v6',
  arrows: 'M7 4v13m0 0l-3-3m3 3l3-3m7-11v13m0-13l3 3m-3-3l-3 3',
  bank: 'M3 10l9-6 9 6M5 10v9h14v-9M9 19v-5h6v5',
  chart: 'M4 20h16M7 16V9m5 7V5m5 11v-4',
}

async function logout() {
  loggingOut.value = true
  try {
    await auth.logout()
    router.push({ name: 'login' })
  } catch {
    toast.error('Could not sign out. Try again.')
  } finally {
    loggingOut.value = false
  }
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
</script>

<template>
  <div class="min-h-screen lg:flex">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-70 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-800 focus:shadow-lg"
    >
      Skip to main content
    </a>

    <!-- Mobile top bar -->
    <div
      class="on-dark sticky top-0 z-30 flex items-center justify-between border-b border-brand-900/40 bg-brand-950 px-4 py-3 lg:hidden"
    >
      <RouterLink :to="{ name: 'dashboard' }" class="flex items-center gap-2">
        <span class="font-display text-sm font-bold tracking-tight text-white">KUDI</span>
        <span class="text-2xs tracking-[0.2em] text-white/50 uppercase">Wallet Ops</span>
      </RouterLink>
      <button
        type="button"
        class="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        :aria-expanded="navOpen"
        aria-controls="app-nav"
        @click="navOpen = !navOpen"
      >
        <span class="sr-only">{{ navOpen ? 'Close menu' : 'Open menu' }}</span>
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path v-if="!navOpen" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
          <path v-else stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <!-- Sidebar: static rail on desktop, disclosure panel on mobile -->
    <aside
      id="app-nav"
      class="on-dark z-20 w-full shrink-0 flex-col justify-between bg-brand-950 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64"
      :class="navOpen ? 'flex' : 'hidden'"
    >
      <div class="flex flex-col gap-8 p-4 lg:p-5">
        <RouterLink :to="{ name: 'dashboard' }" class="hidden items-center gap-2.5 px-2 lg:flex">
          <span class="flex size-8 items-center justify-center rounded-lg bg-white">
            <span class="font-display text-sm font-bold text-brand-950">K</span>
          </span>
          <span>
            <span class="block font-display text-sm font-bold tracking-tight text-white">KUDI SYSTEMS</span>
            <span class="block text-2xs tracking-[0.18em] text-white/45 uppercase">Wallet Ops</span>
          </span>
        </RouterLink>

        <nav aria-label="Main">
          <ul class="space-y-0.5">
            <li v-for="item in nav" :key="item.label">
              <RouterLink
                :to="item.to"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/8 hover:text-white"
                active-class="bg-white/12 text-white"
              >
                <svg
                  class="size-4.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="icons[item.icon]" />
                </svg>
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>

      <div class="border-t border-white/10 p-4 lg:p-5">
        <RouterLink
          :to="{ name: 'components' }"
          class="mb-3 block px-3 text-2xs tracking-wider text-white/40 uppercase transition-colors hover:text-white/70"
        >
          Design system
        </RouterLink>
        <div v-if="auth.user" class="flex items-center gap-3 px-1">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-xs font-semibold text-white"
            aria-hidden="true"
          >
            {{ initials(auth.user.name) }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-white">{{ auth.user.name }}</p>
            <p class="truncate text-xs text-white/45">{{ auth.user.email }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            :disabled="loggingOut"
            @click="logout"
          >
            <span class="sr-only">Sign out</span>
            <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
              <path d="M15 4h3a1 1 0 011 1v14a1 1 0 01-1 1h-3M10 8l-4 4 4 4M6 12h11" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <main id="main" class="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <RouterView />
    </main>

    <ToastHost />
  </div>
</template>
