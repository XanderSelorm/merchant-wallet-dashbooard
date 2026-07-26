<?php

use App\Models\Merchant;
use App\Models\Transaction;
use App\Models\WalletLedgerEntry;
use App\Services\PaymentService;
use App\Support\Fees;

beforeEach(function () {
    $this->service = app(PaymentService::class);
    $this->merchant = Merchant::factory()->create();
});

it('computes a 1.5% fee and credits the net amount', function () {
    $transaction = $this->service->process($this->merchant, 10_000, 'PAY-TEST-1');

    expect($transaction->gross_amount)->toBe(10_000)
        ->and($transaction->fee_amount)->toBe(150)
        ->and($transaction->net_amount)->toBe(9_850)
        ->and($transaction->status)->toBe(Transaction::STATUS_SUCCESSFUL)
        ->and($this->merchant->walletBalance())->toBe(9_850);
});

it('rounds fees half-up on minor units', function (int $gross, int $expectedFee) {
    expect(Fees::processingFee($gross))->toBe($expectedFee);
})->with([
    'exact'          => [10_000, 150],
    'rounds up'      => [101, 2],      // 1.515 → 2
    'rounds down'    => [33, 0],       // 0.495 → 0
    'half rounds up' => [100, 2],      // 1.50 → 2
    'one pesewa'     => [1, 0],
]);

it('writes exactly one ledger credit per successful payment', function () {
    $transaction = $this->service->process($this->merchant, 5_000, 'PAY-TEST-2');

    $entries = WalletLedgerEntry::where('merchant_id', $this->merchant->id)->get();

    expect($entries)->toHaveCount(1)
        ->and($entries->first()->type)->toBe(WalletLedgerEntry::TYPE_PAYMENT_CREDIT)
        ->and($entries->first()->amount)->toBe($transaction->net_amount)
        ->and($entries->first()->transaction_id)->toBe($transaction->id)
        ->and($entries->first()->settled_at)->toBeNull();
});

it('does not touch the wallet for pending or failed payments', function (string $status) {
    $this->service->process($this->merchant, 5_000, "PAY-TEST-$status", $status);

    expect(WalletLedgerEntry::count())->toBe(0)
        ->and($this->merchant->walletBalance())->toBe(0);
})->with([Transaction::STATUS_PENDING, Transaction::STATUS_FAILED]);

it('rejects payments for inactive merchants', function () {
    $inactive = Merchant::factory()->inactive()->create();

    $this->service->process($inactive, 5_000, 'PAY-TEST-3');
})->throws(InvalidArgumentException::class, 'inactive merchant');

it('rejects non-positive amounts', function () {
    $this->service->process($this->merchant, 0, 'PAY-TEST-4');
})->throws(InvalidArgumentException::class);
