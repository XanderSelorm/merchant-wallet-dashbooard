<?php

namespace App\Http\Controllers;

use App\Models\Settlement;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportSummaryController extends Controller
{
    /**
     * Totals for the reports view, scoped to the same filters as the tables
     * beneath them. Kept separate from the dashboard summary, which is
     * deliberately unfiltered and carries a much larger payload.
     *
     * Transactions are filtered on created_at; settlements on settled_on.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $successful = Transaction::where('status', Transaction::STATUS_SUCCESSFUL)
            ->when($request->filled('merchant_id'), fn ($q) => $q->where('merchant_id', $request->integer('merchant_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')));

        $settlements = Settlement::query()
            ->when($request->filled('merchant_id'), fn ($q) => $q->where('merchant_id', $request->integer('merchant_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('settled_on', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('settled_on', '<=', $request->date('date_to')));

        return response()->json([
            'total_payment_volume' => (int) (clone $successful)->sum('gross_amount'),
            'total_fees_earned' => (int) (clone $successful)->sum('fee_amount'),
            'successful_count' => (clone $successful)->count(),
            'total_settled' => (int) (clone $settlements)->sum('amount'),
            'settlement_count' => (clone $settlements)->count(),
            'filtered' => $request->hasAny(['merchant_id', 'date_from', 'date_to']),
        ]);
    }
}
