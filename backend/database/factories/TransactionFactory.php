<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Support\Fees;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        // 5.00 – 2,500.00 GHS in pesewas
        $gross = fake()->numberBetween(500, 250_000);
        $fee = Fees::processingFee($gross);

        return [
            'reference' => 'PAY-'.strtoupper(Str::random(10)),
            'gross_amount' => $gross,
            'fee_amount' => $fee,
            'net_amount' => $gross - $fee,
            'status' => Transaction::STATUS_SUCCESSFUL,
            'created_at' => fake()->dateTimeBetween('-30 days'),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => Transaction::STATUS_PENDING]);
    }

    public function failed(): static
    {
        return $this->state(['status' => Transaction::STATUS_FAILED]);
    }
}
