<?php

namespace Database\Factories;

use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Merchant>
 */
class MerchantFactory extends Factory
{
    private const BANKS = [
        'GCB Bank',
        'Ecobank Ghana',
        'Stanbic Bank',
        'Absa Bank Ghana',
        'Fidelity Bank',
        'Zenith Bank',
        'CalBank',
        'Access Bank',
    ];

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'business_name' => fake()->company(),
            'account_number' => fake()->numerify('##########'),
            'bank_name' => fake()->randomElement(self::BANKS),
            'status' => Merchant::STATUS_ACTIVE,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => Merchant::STATUS_INACTIVE]);
    }
}
