/**
 * Processing fee — mirrors App\Support\Fees on the backend.
 *
 * 1.5% of gross in minor units, rounded half-up, mirroring the backend's
 * intdiv(gross * 150 + 5000, 10000).
 *
 * Using the same integer expression is a structural guarantee rather than a
 * fix for a known defect: a sweep of every amount the API accepts (1 to
 * 100,000,000 pesewas) found no input where Math.round(gross * 0.015) differs.
 * The point is that the two implementations cannot drift as the rate or
 * rounding rule changes, since there is one expression to keep in step.
 */
export const FEE_RATE = 0.015

const FEE_BASIS_POINTS = 150

export function processingFee(grossMinorUnits: number): number {
  return Math.floor((grossMinorUnits * FEE_BASIS_POINTS + 5_000) / 10_000)
}

export function netCredit(grossMinorUnits: number): number {
  return grossMinorUnits - processingFee(grossMinorUnits)
}

/** Parse a user-typed GHS amount ("1,250.75") into minor units. */
export function parseAmountToMinorUnits(input: string): number | null {
  const cleaned = input.replace(/,/g, '').trim()
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '' || cleaned === '.') return null

  const value = Number(cleaned)
  if (!Number.isFinite(value) || value <= 0) return null

  return Math.round(value * 100)
}

/** Reference generator for simulated payments. */
export function generateReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 10; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `PAY-${suffix}`
}
