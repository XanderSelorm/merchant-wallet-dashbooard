<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Models\Merchant;
use App\Models\Settlement;
use App\Models\Transaction;
use App\Models\WalletLedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $successful = Transaction::where('status', Transaction::STATUS_SUCCESSFUL);

        $statusCounts = Transaction::selectRaw('status, count(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        return response()->json([
            'total_wallet_balance' => (int) WalletLedgerEntry::sum('amount'),
            'total_payment_volume' => (int) (clone $successful)->sum('gross_amount'),
            'total_fees_earned' => (int) (clone $successful)->sum('fee_amount'),
            'total_settled' => (int) Settlement::sum('amount'),
            'merchant_count' => Merchant::count(),
            'active_merchant_count' => Merchant::where('status', Merchant::STATUS_ACTIVE)->count(),
            'transaction_counts' => collect(Transaction::STATUSES)
                ->mapWithKeys(fn ($s) => [$s => (int) ($statusCounts[$s] ?? 0)]),
            'recent_transactions' => TransactionResource::collection(
                Transaction::with('merchant')->latest()->limit(5)->get()
            ),
            'volume_by_day' => $this->volumeByDay(),
        ]);
    }

    /** Successful volume and fees per day over the last 14 days, gaps filled. */
    private function volumeByDay(): Collection
    {
        $start = now()->subDays(13)->startOfDay();

        $rows = Transaction::where('status', Transaction::STATUS_SUCCESSFUL)
            ->where('created_at', '>=', $start)
            ->selectRaw('date(created_at) as date, sum(gross_amount) as volume, sum(fee_amount) as fees')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        return collect(range(0, 13))->map(function (int $offset) use ($start, $rows) {
            $date = $start->copy()->addDays($offset)->toDateString();

            return [
                'date' => $date,
                'volume' => (int) ($rows[$date]->volume ?? 0),
                'fees' => (int) ($rows[$date]->fees ?? 0),
            ];
        });
    }
}
