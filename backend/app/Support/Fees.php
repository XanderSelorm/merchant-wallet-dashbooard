<?php

namespace App\Support;

class Fees
{
    /** Processing fee: 1.5% expressed in basis points over 10_000. */
    public const RATE_BASIS_POINTS = 150;

    /**
     * Fee on a gross amount in minor units, rounded half-up.
     * Mirrored on the frontend as Math.round(gross * 0.015).
     */
    public static function processingFee(int $grossAmount): int
    {
        return intdiv($grossAmount * self::RATE_BASIS_POINTS + 5_000, 10_000);
    }
}
