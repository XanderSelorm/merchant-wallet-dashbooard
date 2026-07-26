/**
 * Processing fee — mirrors App\Support\Fees on the backend.
 *
 * 1.5% of gross in minor units, rounded half-up. The backend computes
 * intdiv(gross * 150 + 5000, 10000); the same integer arithmetic is used here
 * rather than gross * 0.015 so the preview can never disagree with the API
 * over a floating-point edge case.
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
