<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\Transaction;
use App\Models\WalletLedgerEntry;
use App\Support\Fees;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentService
{
    /**
     * Record a simulated customer payment.
     *
     * Fee is 1.5% of gross; the merchant wallet is credited with the net
     * amount — but only when the payment is successful. Pending and failed
     * payments produce a transaction record and no ledger movement.
     */
    public function process(
        Merchant $merchant,
        int $grossAmount,
        string $reference,
        string $status = Transaction::STATUS_SUCCESSFUL,
    ): Transaction {
        if ($grossAmount <= 0) {
            throw new InvalidArgumentException('Payment amount must be positive.');
        }

        if (! in_array($status, Transaction::STATUSES, true)) {
            throw new InvalidArgumentException("Unknown transaction status [$status].");
        }

        if (! $merchant->isActive()) {
            throw new InvalidArgumentException('Payments cannot be processed for an inactive merchant.');
        }

        $fee = Fees::processingFee($grossAmount);

        return DB::transaction(function () use ($merchant, $grossAmount, $fee, $reference, $status) {
            $transaction = Transaction::create([
                'merchant_id' => $merchant->id,
                'reference' => $reference,
                'gross_amount' => $grossAmount,
                'fee_amount' => $fee,
                'net_amount' => $grossAmount - $fee,
                'status' => $status,
            ]);

            if ($status === Transaction::STATUS_SUCCESSFUL) {
                WalletLedgerEntry::create([
                    'merchant_id' => $merchant->id,
                    'type' => WalletLedgerEntry::TYPE_PAYMENT_CREDIT,
                    'amount' => $transaction->net_amount,
                    'transaction_id' => $transaction->id,
                ]);
            }

            return $transaction;
        });
    }
}
