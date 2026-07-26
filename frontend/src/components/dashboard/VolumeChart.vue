<script setup lang="ts">
import { computed, ref } from 'vue'

import { formatMoney } from '@/lib/money'
import type { DashboardSummary } from '@/types/api'

const props = defineProps<{ series: DashboardSummary['volume_by_day'] }>()

/**
 * Single-series daily volume. Fees are ~1.5% of volume, so plotting them as a
 * second series would either be invisible or need a second y-axis; they ride
 * along in the tooltip instead.
 */
const PLOT = { width: 720, height: 200, top: 16, right: 8, bottom: 28, left: 8 }
const BAR_GAP = 2
const RADIUS = 4

const hovered = ref<number | null>(null)

const maxVolume = computed(() => Math.max(...props.series.map((d) => d.volume), 1))

const innerWidth = computed(() => PLOT.width - PLOT.left - PLOT.right)
const innerHeight = computed(() => PLOT.height - PLOT.top - PLOT.bottom)
const slotWidth = computed(() => innerWidth.value / Math.max(props.series.length, 1))
const barWidth = computed(() => Math.max(slotWidth.value - BAR_GAP, 1))

const bars = computed(() =>
  props.series.map((point, index) => {
    const height = (point.volume / maxVolume.value) * innerHeight.value
    return {
      ...point,
      index,
      x: PLOT.left + index * slotWidth.value + BAR_GAP / 2,
      // Zero-volume days keep a 2px stub so the day is visibly present, not missing.
      y: PLOT.top + innerHeight.value - Math.max(height, point.volume > 0 ? 2 : 2),
      height: Math.max(height, 2),
      isEmpty: point.volume === 0,
    }
  }),
)

/** Gridlines at quarters — recessive, for reading magnitude only. */
const gridlines = computed(() =>
  [0.25, 0.5, 0.75, 1].map((fraction) => ({
    fraction,
    y: PLOT.top + innerHeight.value - fraction * innerHeight.value,
    label: formatCompact(maxVolume.value * fraction),
  })),
)

/** Label only the peak day — never a number on every bar. */
const peak = computed(() => bars.value.reduce((a, b) => (b.volume > a.volume ? b : a), bars.value[0]))

const tooltip = computed(() => (hovered.value === null ? null : bars.value[hovered.value]))

function formatCompact(minorUnits: number): string {
  const major = minorUnits / 100
  if (major >= 1000) return `${Math.round(major / 1000)}k`
  return String(Math.round(major))
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric' })
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Show every other day label so ticks never collide on narrow screens. */
const showLabel = (index: number) => index % 2 === props.series.length % 2
</script>

<template>
  <figure class="relative">
    <svg
      :viewBox="`0 0 ${PLOT.width} ${PLOT.height}`"
      class="w-full"
      role="img"
      aria-labelledby="volume-chart-caption"
      @mouseleave="hovered = null"
    >
      <g aria-hidden="true">
        <line
          v-for="line in gridlines"
          :key="line.fraction"
          :x1="PLOT.left"
          :x2="PLOT.width - PLOT.right"
          :y1="line.y"
          :y2="line.y"
          class="stroke-slate-100"
          stroke-width="1"
        />
        <text
          v-for="line in gridlines"
          :key="`label-${line.fraction}`"
          :x="PLOT.left + 2"
          :y="line.y - 4"
          class="fill-slate-400 text-[10px]"
        >
          {{ line.label }}
        </text>
      </g>

      <g>
        <g v-for="bar in bars" :key="bar.date">
          <!-- Hit target spans the full column so hovering is forgiving -->
          <rect
            :x="PLOT.left + bar.index * slotWidth"
            :y="PLOT.top"
            :width="slotWidth"
            :height="innerHeight"
            fill="transparent"
            @mouseenter="hovered = bar.index"
          />
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="barWidth"
            :height="bar.height"
            :rx="RADIUS"
            class="transition-colors"
            :class="[
              bar.isEmpty ? 'fill-slate-200' : 'fill-brand-600',
              hovered === bar.index && !bar.isEmpty && 'fill-brand-800',
            ]"
          />
        </g>
      </g>

      <g aria-hidden="true">
        <text
          v-for="bar in bars"
          v-show="showLabel(bar.index)"
          :key="`tick-${bar.date}`"
          :x="bar.x + barWidth / 2"
          :y="PLOT.height - 10"
          text-anchor="middle"
          class="fill-slate-400 text-[10px]"
        >
          {{ dayLabel(bar.date) }}
        </text>
      </g>

      <!-- Selective direct label: the peak day only -->
      <text
        v-if="peak && peak.volume > 0"
        :x="Math.min(Math.max(peak.x + barWidth / 2, 28), PLOT.width - 28)"
        :y="Math.max(peak.y - 6, 12)"
        text-anchor="middle"
        class="fill-slate-500 text-[10px] font-medium"
      >
        {{ formatCompact(peak.volume) }}
      </text>
    </svg>

    <!-- Tooltip carries the second measure without a second axis -->
    <div
      v-if="tooltip"
      class="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-brand-950 px-2.5 py-2 text-xs whitespace-nowrap text-white shadow-lg"
      :style="{ left: `${((tooltip.x + barWidth / 2) / PLOT.width) * 100}%`, bottom: '2.75rem' }"
    >
      <p class="font-medium">{{ fullDate(tooltip.date) }}</p>
      <p class="mt-0.5 text-white/70">Volume {{ formatMoney(tooltip.volume) }}</p>
      <p class="text-white/70">Fees {{ formatMoney(tooltip.fees) }}</p>
    </div>

    <figcaption id="volume-chart-caption" class="sr-only">
      Successful payment volume per day over the last 14 days, with fees earned.
    </figcaption>

    <!-- Table view: the same data, available to screen readers and as fallback -->
    <table class="sr-only">
      <caption>
        Daily payment volume and fees
      </caption>
      <thead>
        <tr><th scope="col">Date</th><th scope="col">Volume</th><th scope="col">Fees</th></tr>
      </thead>
      <tbody>
        <tr v-for="point in series" :key="point.date">
          <td>{{ fullDate(point.date) }}</td>
          <td>{{ formatMoney(point.volume) }}</td>
          <td>{{ formatMoney(point.fees) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
