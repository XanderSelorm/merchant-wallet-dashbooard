<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\Settlement;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WalletLedgerEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Seeds a dataset that exercises every UI state:
 * - merchants with unsettled balances, fully settled merchants, an inactive
 *   merchant, and a brand-new merchant with no history (empty states);
 * - transactions in all three statuses spread over the last 30 days;
 * - settlement history with the matching ledger entries.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Allow backdated created_at values in seed data.
        Model::unguard();

        User::factory()->create([
            'name' => 'Demo Admin',
            'email' => 'admin@kudi.test',
        ]);

        // Active merchants accumulating unsettled balances.
        Merchant::factory(4)
            ->create()
            ->each(function (Merchant $merchant) {
                $this->seedTransactions($merchant, successful: rand(8, 15), pending: rand(1, 3), failed: rand(1, 3));
            });

        // Merchants with settlement history (older credits settled, newer ones not).
        Merchant::factory(2)
            ->create()
            ->each(function (Merchant $merchant) {
                $this->seedTransactions($merchant, successful: rand(12, 20), pending: rand(0, 2), failed: rand(0, 2));
                $this->settleEntriesOlderThan($merchant, now()->subDays(7));
            });

        // Inactive merchant with history, fully settled.
        $inactive = Merchant::factory()->inactive()->create();
        $this->seedTransactions($inactive, successful: 6, pending: 0, failed: 2);
        $this->settleEntriesOlderThan($inactive, now());

        // Brand-new merchant with no activity at all (empty states).
        Merchant::factory()->create([
            'business_name' => 'Fresh Ventures Ltd',
        ]);
    }

    private function seedTransactions(Merchant $merchant, int $successful, int $pending, int $failed): void
    {
        Transaction::factory($successful)
            ->for($merchant)
            ->create()
            ->each(function (Transaction $transaction) use ($merchant) {
                // Only successful payments credit the wallet.
                WalletLedgerEntry::create([
                    'merchant_id' => $merchant->id,
                    'type' => WalletLedgerEntry::TYPE_PAYMENT_CREDIT,
                    'amount' => $transaction->net_amount,
                    'transaction_id' => $transaction->id,
                    'created_at' => $transaction->created_at,
                    'updated_at' => $transaction->created_at,
                ]);
            });

        Transaction::factory($pending)->pending()->for($merchant)->create();
        Transaction::factory($failed)->failed()->for($merchant)->create();
    }

    /**
     * Mirrors SettlementService's ledger writes so seeded history matches
     * what the runtime process produces.
     */
    private function settleEntriesOlderThan(Merchant $merchant, Carbon $cutoff): void
    {
        $entries = $merchant->ledgerEntries()
            ->unsettled()
            ->where('created_at', '<', $cutoff)
            ->get();

        if ($entries->isEmpty() || ($total = $entries->sum('amount')) <= 0) {
            return;
        }

        $settledOn = $cutoff->copy()->subDay();

        $settlement = Settlement::create([
            'merchant_id' => $merchant->id,
            'reference' => 'STL-'.strtoupper(Str::random(10)),
            'amount' => $total,
            'settled_on' => $settledOn->toDateString(),
            'created_at' => $settledOn,
            'updated_at' => $settledOn,
        ]);

        WalletLedgerEntry::whereIn('id', $entries->pluck('id'))
            ->update(['settled_at' => $settledOn, 'settlement_id' => $settlement->id]);

        WalletLedgerEntry::create([
            'merchant_id' => $merchant->id,
            'type' => WalletLedgerEntry::TYPE_SETTLEMENT_DEBIT,
            'amount' => -$total,
            'settlement_id' => $settlement->id,
            'settled_at' => $settledOn,
            'created_at' => $settledOn,
            'updated_at' => $settledOn,
        ]);
    }
}
