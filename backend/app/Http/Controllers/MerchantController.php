<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMerchantRequest;
use App\Http\Resources\MerchantResource;
use App\Http\Resources\SettlementResource;
use App\Http\Resources\TransactionResource;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class MerchantController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $merchants = Merchant::query()
            ->withWalletBalance()
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->string('search')->trim().'%';
                $query->where(fn ($q) => $q
                    ->where('name', 'like', $term)
                    ->orWhere('business_name', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return MerchantResource::collection($merchants);
    }

    public function store(StoreMerchantRequest $request): MerchantResource
    {
        $merchant = Merchant::create($request->validated());

        return new MerchantResource($merchant);
    }

    public function show(Merchant $merchant): MerchantResource
    {
        $merchant->wallet_balance = $merchant->walletBalance();

        return new MerchantResource($merchant);
    }

    public function updateStatus(Request $request, Merchant $merchant): MerchantResource
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in([Merchant::STATUS_ACTIVE, Merchant::STATUS_INACTIVE])],
        ]);

        $merchant->update($validated);
        $merchant->wallet_balance = $merchant->walletBalance();

        return new MerchantResource($merchant);
    }

    public function transactions(Request $request, Merchant $merchant): AnonymousResourceCollection
    {
        $transactions = $merchant->transactions()
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return TransactionResource::collection($transactions);
    }

    public function settlements(Request $request, Merchant $merchant): AnonymousResourceCollection
    {
        $settlements = $merchant->settlements()
            ->latest('settled_on')
            ->paginate($request->integer('per_page', 10));

        return SettlementResource::collection($settlements);
    }
}
