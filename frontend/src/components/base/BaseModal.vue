<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{ title: string; description?: string; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md' },
)

const open = defineModel<boolean>({ required: true })
const id = useId()
const panel = ref<HTMLElement | null>(null)

/**
 * Focus management: move focus into the dialog on open, restore it on close,
 * and keep Tab cycling inside the panel while it is open.
 */
let previouslyFocused: HTMLElement | null = null

watch(open, async (isOpen) => {
  if (isOpen) {
    previouslyFocused = document.activeElement as HTMLElement | null
    await nextTick()

    // Prefer the first field over the close button, so a keyboard user lands
    // where they can start typing rather than on "dismiss".
    const target = firstField() ?? focusables()[0] ?? panel.value
    target?.focus()
  } else {
    previouslyFocused?.focus()
  }
})

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

function firstField(): HTMLElement | null {
  return panel.value?.querySelector<HTMLElement>(
    'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
  ) ?? null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }

  if (event.key !== 'Tab') return

  const items = focusables()
  if (!items.length) return

  const first = items[0]
  const last = items[items.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto bg-brand-950/40 p-4 sm:p-6">
        <div class="flex min-h-full items-end justify-center sm:items-center">
          <!-- Backdrop click target sits behind the panel -->
          <div class="fixed inset-0" @click="open = false" />

          <div
            ref="panel"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="`${id}-title`"
            :aria-describedby="description ? `${id}-description` : undefined"
            tabindex="-1"
            class="relative w-full rounded-card bg-white shadow-xl"
            :class="widths[props.size]"
            @keydown="onKeydown"
          >
            <header class="flex items-start justify-between gap-4 px-5 pt-5">
              <div>
                <h2 :id="`${id}-title`" class="font-display text-lg font-semibold text-slate-900">
                  {{ title }}
                </h2>
                <p v-if="description" :id="`${id}-description`" class="mt-1 text-sm text-slate-500">
                  {{ description }}
                </p>
              </div>
              <button
                type="button"
                class="-mt-1 -mr-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="open = false"
              >
                <span class="sr-only">Close</span>
                <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                  />
                </svg>
              </button>
            </header>

            <div class="px-5 py-4">
              <slot />
            </div>

            <footer
              v-if="$slots.footer"
              class="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end"
            >
              <slot name="footer" />
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
