/**
 * Money display. All amounts travel as integer minor units (pesewas);
 * conversion to GHS happens only at the presentation edge.
 */

const formatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
})

const numberFormatter = new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(minorUnits: number): string {
  return formatter.format(minorUnits / 100)
}

/** Split for the signature stat treatment: big units, small decimals. */
export function splitMoney(minorUnits: number): { units: string; decimals: string } {
  const [units, decimals] = numberFormatter.format(minorUnits / 100).split('.')
  return { units, decimals: decimals ?? '00' }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
