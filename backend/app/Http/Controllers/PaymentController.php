<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Merchant;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class PaymentController extends Controller
{
    public function store(StorePaymentRequest $request, PaymentService $payments): JsonResponse
    {
        $merchant = Merchant::findOrFail($request->integer('merchant_id'));

        try {
            $transaction = $payments->process(
                merchant: $merchant,
                grossAmount: $request->integer('amount'),
                reference: $request->string('reference')->trim()->toString(),
                status: $request->input('status', Transaction::STATUS_SUCCESSFUL),
            );
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['merchant_id' => [$e->getMessage()]]);
        }

        return (new TransactionResource($transaction->load('merchant')))
            ->response()
            ->setStatusCode(201);
    }
}
