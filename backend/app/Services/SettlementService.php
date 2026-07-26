<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\Settlement;
use App\Models\WalletLedgerEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SettlementService
{
    /**
     * Sweep every positive unsettled wallet balance into a settlement.
     *
     * Idempotent: entries are stamped settled_at inside the same DB
     * transaction, so an immediate second run finds nothing to settle.
     *
     * @return Collection<int, Settlement> settlements created by this run
     */
    public function run(): Collection
    {
        return DB::transaction(function () {
            return Merchant::query()
                ->whereHas('ledgerEntries', fn ($q) => $q->unsettled())
                ->get()
                ->map(fn (Merchant $merchant) => $this->settleMerchant($merchant))
                ->filter()
                ->values();
        });
    }

    private function settleMerchant(Merchant $merchant): ?Settlement
    {
        $entries = $merchant->ledgerEntries()->unsettled()->get();

        $total = $entries->sum('amount');

        if ($total <= 0) {
            return null;
        }

        $now = now();

        $settlement = Settlement::create([
            'merchant_id' => $merchant->id,
            'reference' => 'STL-'.strtoupper(Str::random(10)),
            'amount' => $total,
            'settled_on' => $now->toDateString(),
        ]);

        WalletLedgerEntry::whereIn('id', $entries->pluck('id'))
            ->update(['settled_at' => $now, 'settlement_id' => $settlement->id]);

        // Offsetting debit zeroes the wallet; born settled so it is never
        // swept by a later run.
        WalletLedgerEntry::create([
            'merchant_id' => $merchant->id,
            'type' => WalletLedgerEntry::TYPE_SETTLEMENT_DEBIT,
            'amount' => -$total,
            'settlement_id' => $settlement->id,
            'settled_at' => $now,
        ]);

        return $settlement;
    }
}
