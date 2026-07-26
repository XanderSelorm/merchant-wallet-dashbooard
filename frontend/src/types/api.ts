/**
 * API resource types — mirrors the Laravel API resources.
 * All monetary values are integer minor units (pesewas/cents) to avoid
 * floating-point drift; the same convention is used in the backend.
 */

export type MerchantStatus = 'active' | 'inactive'
export type TransactionStatus = 'pending' | 'successful' | 'failed'
export type LedgerEntryType = 'payment_credit' | 'settlement_debit'

export interface Merchant {
  id: number
  name: string
  email: string
  business_name: string
  account_number: string
  bank_name: string
  status: MerchantStatus
  wallet_balance: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  merchant_id: number
  merchant?: Merchant
  reference: string
  gross_amount: number
  fee_amount: number
  net_amount: number
  status: TransactionStatus
  created_at: string
}

export interface WalletLedgerEntry {
  id: number
  merchant_id: number
  type: LedgerEntryType
  amount: number
  transaction_id: number | null
  settlement_id: number | null
  settled_at: string | null
  created_at: string
}

export interface Settlement {
  id: number
  merchant_id: number
  merchant?: Merchant
  reference: string
  amount: number
  settled_on: string
  created_at: string
}

export interface DashboardSummary {
  total_wallet_balance: number
  total_payment_volume: number
  total_fees_earned: number
  total_settled: number
  merchant_count: number
  active_merchant_count: number
  transaction_counts: Record<TransactionStatus, number>
  recent_transactions: Transaction[]
  volume_by_day: { date: string; volume: number; fees: number }[]
}

export interface User {
  id: number
  name: string
  email: string
}

/** Laravel paginator envelope */
export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export interface ValidationErrorResponse {
  message: string
  errors: Record<string, string[]>
}
