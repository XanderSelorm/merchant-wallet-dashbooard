<?php

use App\Models\Merchant;
use App\Models\Settlement;
use App\Models\WalletLedgerEntry;
use App\Services\PaymentService;
use App\Services\SettlementService;

beforeEach(function () {
    $this->payments = app(PaymentService::class);
    $this->service = app(SettlementService::class);
});

it('moves positive balances into settlements and zeroes the wallets', function () {
    $a = Merchant::factory()->create();
    $b = Merchant::factory()->create();

    $this->payments->process($a, 10_000, 'PAY-A1');
    $this->payments->process($a, 20_000, 'PAY-A2');
    $this->payments->process($b, 5_000, 'PAY-B1');

    $balanceA = $a->walletBalance();
    $balanceB = $b->walletBalance();

    $settlements = $this->service->run();

    expect($settlements)->toHaveCount(2)
        ->and(Settlement::where('merchant_id', $a->id)->sum('amount'))->toBe($balanceA)
        ->and(Settlement::where('merchant_id', $b->id)->sum('amount'))->toBe($balanceB)
        ->and($a->walletBalance())->toBe(0)
        ->and($b->walletBalance())->toBe(0);
});

it('links settled credits and the offsetting debit to the settlement', function () {
    $merchant = Merchant::factory()->create();
    $this->payments->process($merchant, 10_000, 'PAY-L1');

    $settlement = $this->service->run()->first();

    $credit = WalletLedgerEntry::where('type', WalletLedgerEntry::TYPE_PAYMENT_CREDIT)->first();
    $debit = WalletLedgerEntry::where('type', WalletLedgerEntry::TYPE_SETTLEMENT_DEBIT)->first();

    expect($credit->settlement_id)->toBe($settlement->id)
        ->and($credit->settled_at)->not->toBeNull()
        ->and($debit->settlement_id)->toBe($settlement->id)
        ->and($debit->amount)->toBe(-$settlement->amount)
        ->and($debit->settled_at)->not->toBeNull();
});

it('is idempotent — a second run settles nothing', function () {
    $merchant = Merchant::factory()->create();
    $this->payments->process($merchant, 10_000, 'PAY-I1');

    $first = $this->service->run();
    $second = $this->service->run();

    expect($first)->toHaveCount(1)
        ->and($second)->toBeEmpty()
        ->and(Settlement::count())->toBe(1)
        ->and($merchant->walletBalance())->toBe(0);
});

it('skips merchants with nothing to settle', function () {
    Merchant::factory()->create(); // no activity

    $merchant = Merchant::factory()->create();
    $this->payments->process($merchant, 5_000, 'PAY-S1', 'failed'); // no credit

    expect($this->service->run())->toBeEmpty()
        ->and(Settlement::count())->toBe(0);
});

it('only settles unsettled credits accrued since the last run', function () {
    $merchant = Merchant::factory()->create();

    $this->payments->process($merchant, 10_000, 'PAY-R1');
    $this->service->run();

    $this->payments->process($merchant, 4_000, 'PAY-R2');
    $second = $this->service->run();

    $expectedSecond = $merchant->transactions()->where('reference', 'PAY-R2')->first()->net_amount;

    expect($second)->toHaveCount(1)
        ->and($second->first()->amount)->toBe($expectedSecond)
        ->and($merchant->walletBalance())->toBe(0)
        ->and(Settlement::sum('amount'))->toBe(10_000 - 150 + $expectedSecond);
});
