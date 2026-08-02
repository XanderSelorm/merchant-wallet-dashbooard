import { describe, expect, it } from 'vitest'

import { formatDate, formatDateTime, formatMoney, splitMoney } from '@/lib/money'

describe('formatMoney', () => {
  it.each([
    [0, 'GH₵0.00'],
    [1, 'GH₵0.01'],
    [99, 'GH₵0.99'],
    [100, 'GH₵1.00'],
    [123_457, 'GH₵1,234.57'],
    [1_204_730, 'GH₵12,047.30'],
    [100_000_000, 'GH₵1,000,000.00'],
  ])('renders %i pesewas as %s', (minorUnits, expected) => {
    expect(formatMoney(minorUnits)).toBe(expected)
  })

  it('always shows two decimal places', () => {
    expect(formatMoney(500)).toBe('GH₵5.00')
    expect(formatMoney(510)).toBe('GH₵5.10')
  })

  it('renders negatives, which the ledger uses for settlement debits', () => {
    expect(formatMoney(-98_500)).toBe('-GH₵985.00')
  })
})

describe('splitMoney', () => {
  it('separates units from decimals so the magnitude can lead visually', () => {
    expect(splitMoney(1_204_730)).toEqual({ units: '12,047', decimals: '30' })
  })

  it.each([
    [0, '0', '00'],
    [5, '0', '05'],
    [100, '1', '00'],
    [123_457, '1,234', '57'],
  ])('splits %i into %s and %s', (minorUnits, units, decimals) => {
    expect(splitMoney(minorUnits)).toEqual({ units, decimals })
  })

  it('recombines into the same string formatMoney produces', () => {
    for (const amount of [0, 1, 99, 100, 123_457, 1_204_730]) {
      const { units, decimals } = splitMoney(amount)

      expect(`GH₵${units}.${decimals}`).toBe(formatMoney(amount))
    }
  })
})

describe('formatDate', () => {
  it('renders an ISO timestamp as a short date', () => {
    expect(formatDate('2026-07-26T10:55:45.000Z')).toBe('26 Jul 2026')
  })

  it('accepts a plain date string, as settled_on sends', () => {
    expect(formatDate('2026-07-26')).toBe('26 Jul 2026')
  })

  it('does not roll over the day at either edge of a UTC date', () => {
    expect(formatDate('2026-07-26T00:00:00.000Z')).toBe('26 Jul 2026')
    expect(formatDate('2026-07-26T23:59:59.000Z')).toBe('26 Jul 2026')
  })
})

describe('formatDateTime', () => {
  it('renders day, month and 24-hour time', () => {
    expect(formatDateTime('2026-07-26T10:55:45.000Z')).toBe('26 Jul, 10:55')
  })

  it('zero-pads the hour', () => {
    expect(formatDateTime('2026-07-26T04:07:00.000Z')).toBe('26 Jul, 04:07')
  })

  it('uses 24-hour time rather than am/pm', () => {
    expect(formatDateTime('2026-07-26T20:43:00.000Z')).toBe('26 Jul, 20:43')
  })
})
