<?php

namespace App\Http\Requests;

use App\Models\Transaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'merchant_id' => ['required', 'integer', 'exists:merchants,id'],
            // Amount arrives in minor units (pesewas); cap at 1,000,000 GHS.
            'amount' => ['required', 'integer', 'min:1', 'max:100000000'],
            'reference' => ['required', 'string', 'max:64', 'unique:transactions,reference'],
            'status' => ['sometimes', Rule::in(Transaction::STATUSES)],
        ];
    }
}
