<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Merchant extends Model
{
    /** @use HasFactory<\Database\Factories\MerchantFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'name',
        'email',
        'business_name',
        'account_number',
        'bank_name',
        'status',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(WalletLedgerEntry::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(Settlement::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Wallet balance is derived from the ledger, never stored, so it cannot
     * drift from the entries that explain it.
     */
    public function walletBalance(): int
    {
        return (int) $this->ledgerEntries()->sum('amount');
    }

    /** Eager-load the wallet balance as a `wallet_balance` column. */
    public function scopeWithWalletBalance(Builder $query): Builder
    {
        return $query->withSum('ledgerEntries as wallet_balance', 'amount');
    }
}
