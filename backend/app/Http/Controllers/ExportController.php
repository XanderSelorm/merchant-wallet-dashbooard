<?php

namespace App\Http\Controllers;

use App\Models\Settlement;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Stream transactions as CSV, honouring the same filters as the list
     * endpoint so an export matches what the operator is looking at.
     */
    public function transactions(Request $request): StreamedResponse
    {
        $query = Transaction::query()
            ->with('merchant')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($inner) => $inner
                    ->where('reference', 'like', $term)
                    ->orWhereHas('merchant', fn ($m) => $m->where('business_name', 'like', $term)));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('merchant_id'), fn ($q) => $q->where('merchant_id', $request->integer('merchant_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')))
            ->latest();

        return $this->stream('transactions', [
            'Reference',
            'Merchant',
            'Status',
            'Gross (GHS)',
            'Fee (GHS)',
            'Net credit (GHS)',
            'Created at',
        ], $query, fn (Transaction $transaction) => [
            $transaction->reference,
            $transaction->merchant?->business_name,
            $transaction->status,
            $this->major($transaction->gross_amount),
            $this->major($transaction->fee_amount),
            $this->major($transaction->net_amount),
            $transaction->created_at?->toDateTimeString(),
        ]);
    }

    public function settlements(Request $request): StreamedResponse
    {
        $query = Settlement::query()
            ->with('merchant')
            ->when($request->filled('merchant_id'), fn ($q) => $q->where('merchant_id', $request->integer('merchant_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('settled_on', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('settled_on', '<=', $request->date('date_to')))
            ->latest('id');

        return $this->stream('settlements', [
            'Reference',
            'Merchant',
            'Bank',
            'Account number',
            'Amount (GHS)',
            'Settled on',
        ], $query, fn (Settlement $settlement) => [
            $settlement->reference,
            $settlement->merchant?->business_name,
            $settlement->merchant?->bank_name,
            $settlement->merchant?->account_number,
            $this->major($settlement->amount),
            $settlement->settled_on?->toDateString(),
        ]);
    }

    /** Chunked so a large export never loads the whole table into memory. */
    private function stream(string $name, array $headers, $query, callable $row): StreamedResponse
    {
        $filename = sprintf('kudi-%s-%s.csv', $name, now()->format('Y-m-d'));

        return response()->streamDownload(function () use ($headers, $query, $row) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            $query->chunk(500, function ($records) use ($handle, $row) {
                foreach ($records as $record) {
                    fputcsv($handle, $row($record));
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /** Minor units to a plain decimal string, for spreadsheet-friendly output. */
    private function major(int $minorUnits): string
    {
        return number_format($minorUnits / 100, 2, '.', '');
    }
}
