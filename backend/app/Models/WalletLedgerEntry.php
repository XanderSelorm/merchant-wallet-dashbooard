<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletLedgerEntry extends Model
{
    public const TYPE_PAYMENT_CREDIT = 'payment_credit';

    public const TYPE_SETTLEMENT_DEBIT = 'settlement_debit';

    protected $fillable = [
        'merchant_id',
        'type',
        'amount',
        'transaction_id',
        'settlement_id',
        'settled_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'settled_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function settlement(): BelongsTo
    {
        return $this->belongsTo(Settlement::class);
    }

    public function scopeUnsettled(Builder $query): Builder
    {
        return $query->whereNull('settled_at');
    }
}
