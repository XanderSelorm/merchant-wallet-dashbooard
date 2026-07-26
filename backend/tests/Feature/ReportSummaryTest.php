<?php

use App\Models\Merchant;
use App\Models\User;
use App\Services\PaymentService;
use App\Services\SettlementService;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
    $this->payments = app(PaymentService::class);
    $this->settlements = app(SettlementService::class);

    $this->alpha = Merchant::factory()->create(['business_name' => 'Alpha Traders']);
    $this->beta = Merchant::factory()->create(['business_name' => 'Beta Supplies']);
});

it('totals successful volume and fees across everything by default', function () {
    $this->payments->process($this->alpha, 100_000, 'PAY-A');
    $this->payments->process($this->beta, 50_000, 'PAY-B');
    $this->payments->process($this->alpha, 20_000, 'PAY-C', 'failed');

    $this->getJson('/api/reports/summary')
        ->assertOk()
        ->assertJson([
            'total_payment_volume' => 150_000,
            'total_fees_earned' => 2_250,
            'successful_count' => 2,
            'filtered' => false,
        ]);
});

it('scopes totals to a single merchant', function () {
    $this->payments->process($this->alpha, 100_000, 'PAY-A');
    $this->payments->process($this->beta, 50_000, 'PAY-B');

    $this->getJson("/api/reports/summary?merchant_id={$this->alpha->id}")
        ->assertOk()
        ->assertJson([
            'total_payment_volume' => 100_000,
            'total_fees_earned' => 1_500,
            'successful_count' => 1,
            'filtered' => true,
        ]);
});

it('scopes totals to a date range', function () {
    // forceFill because created_at is guarded against mass assignment
    $old = $this->payments->process($this->alpha, 100_000, 'PAY-OLD');
    $old->forceFill(['created_at' => now()->subDays(10)])->save();

    $this->payments->process($this->alpha, 40_000, 'PAY-NEW');

    $this->getJson('/api/reports/summary?date_from='.now()->subDay()->toDateString())
        ->assertOk()
        ->assertJson([
            'total_payment_volume' => 40_000,
            'successful_count' => 1,
        ]);
});

it('reports settled totals for the selection', function () {
    $this->payments->process($this->alpha, 100_000, 'PAY-A');
    $this->payments->process($this->beta, 50_000, 'PAY-B');
    $this->settlements->run();

    $this->getJson("/api/reports/summary?merchant_id={$this->alpha->id}")
        ->assertOk()
        ->assertJson([
            'total_settled' => 98_500,
            'settlement_count' => 1,
        ]);
});

it('requires authentication', function () {
    auth()->logout();

    $this->getJson('/api/reports/summary')->assertUnauthorized();
});
