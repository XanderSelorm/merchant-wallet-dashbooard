# Architecture notes

Supplementary detail to the [README](../README.md). The README covers setup, assumptions, and
decisions; this file covers how the pieces fit together.

## Data model

```
users                    operator accounts (one seeded)

merchants                name, email, business_name, account_number,
                         bank_name, status
   │
   ├── transactions      reference, gross_amount, fee_amount,
   │                     net_amount, status
   │
   ├── wallet_ledger_entries
   │                     signed amount, type, transaction_id,
   │                     settlement_id, settled_at
   │
   └── settlements       reference, amount, settled_on
```

The ledger is the single source of truth for balances. `transactions` records what a customer paid;
`wallet_ledger_entries` records what actually moved. The two are deliberately separate, because a
pending or failed payment is a real transaction that moved nothing.

### Why `settled_at` lives on the ledger entry

It is what makes settlement idempotent without a lock or a date window. The settleable balance is
`sum(amount) where settled_at is null`. Once swept, an entry can never be swept again. The offsetting
debit is written with `settled_at` already set, so it does not appear as new outstanding balance.

## Money flow

A successful GH₵1,000.00 payment:

| Step | Effect |
| --- | --- |
| `PaymentService::process` | `transactions` row: gross 100000, fee 1500, net 98500, status successful |
| | `wallet_ledger_entries` row: `+98500`, type `payment_credit`, `settled_at` null |
| Balance | `sum(amount)` = 98500 → GH₵985.00 |
| `SettlementService::run` | `settlements` row: amount 98500 |
| | credit entry stamped `settled_at`, linked to the settlement |
| | new entry: `-98500`, type `settlement_debit`, `settled_at` set |
| Balance | `sum(amount)` = 0 |

The platform's fee revenue is `sum(fee_amount)` over successful transactions — it never enters a
merchant wallet, so it needs no ledger entry.

## Frontend structure

```
src/
  assets/main.css        design tokens (@theme) + base layer
  components/base/       Button, Input, Select, Card, Badge, Table, Modal
  components/            app-level shared: StatusBadge, MoneyFigure,
                         pagination, search, confirm dialog, toasts
  components/{domain}/   feature components (merchants/, payments/, dashboard/)
  composables/           useToast, useCsvExport, useDebouncedRef
  layouts/AppLayout.vue  shell: sidebar rail, mobile drawer, skip link
  lib/                   http (axios + Sanctum), money, fees, banks
  stores/                Pinia: auth, merchants, transactions,
                         settlements, dashboard
  types/api.ts           resource types mirroring the API
  views/                 one per route
```

### State boundaries

Each store owns one resource and holds its own `filters` object, so a view can bind filter controls
directly and call `fetchList()`. Two deliberate details:

- **`merchants.options` is separate from `merchants.list`.** The list is paginated and filtered by the
  table's controls; the options are the unpaginated set backing merchant pickers. Sharing one array
  would mean a table filter silently changing what a dropdown offers.
- **Mutations patch in place.** `setStatus` updates the row in `list`, in `options`, and in `current`
  from the API response, so a status toggle needs no refetch.

After a settlement run the view refetches everything the sweep touched — settlement history, merchant
balances, and dashboard totals — because one action changes numbers on several screens.

### API client

`lib/http.ts` is a single axios instance with `withCredentials` and `withXSRFToken`. Sanctum SPA mode
means session cookies, not bearer tokens: `ensureCsrf()` primes the XSRF cookie once before the first
mutating request. `validationErrors()` maps a Laravel 422 into a `field → message` record that form
components bind directly to their `error` props.

CSV downloads go through this same client rather than a plain link, so the session cookie and the
active filters both travel with the request.

## Request flow, end to end

Simulating a payment:

1. `SimulatePaymentModal` computes fee and net locally with the same integer arithmetic as the backend
   and shows the projected wallet balance.
2. Submit → `transactions.simulatePayment()` → `POST /api/payments`.
3. `StorePaymentRequest` validates; `PaymentService` re-derives the fee server-side (the client
   preview is never trusted), writes the transaction and the ledger credit in one DB transaction.
4. The view refetches the transaction list and merchant options; the toast announces the net credit.

The client-side fee is a preview for the operator, never an input to the recorded amount.
