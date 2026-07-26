/** Bank options for merchant registration — mirrors the backend seeder list. */
export const BANKS = [
  'GCB Bank',
  'Ecobank Ghana',
  'Stanbic Bank',
  'Absa Bank Ghana',
  'Fidelity Bank',
  'Zenith Bank',
  'CalBank',
  'Access Bank',
] as const

export const bankOptions = BANKS.map((bank) => ({ value: bank, label: bank }))
