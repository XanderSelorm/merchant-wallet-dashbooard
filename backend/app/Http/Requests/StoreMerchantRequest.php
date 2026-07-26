<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMerchantRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:merchants,email'],
            'business_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'regex:/^\d{8,16}$/'],
            'bank_name' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'account_number.regex' => 'The account number must be 8–16 digits.',
        ];
    }
}
