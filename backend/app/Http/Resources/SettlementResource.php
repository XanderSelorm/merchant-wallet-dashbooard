<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Settlement */
class SettlementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'merchant' => new MerchantResource($this->whenLoaded('merchant')),
            'reference' => $this->reference,
            'amount' => $this->amount,
            'settled_on' => $this->settled_on?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
