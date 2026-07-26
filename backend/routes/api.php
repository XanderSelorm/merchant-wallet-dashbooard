<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MerchantController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SettlementController;
use App\Http\Controllers\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());

    Route::get('/merchants', [MerchantController::class, 'index']);
    Route::post('/merchants', [MerchantController::class, 'store']);
    Route::get('/merchants/{merchant}', [MerchantController::class, 'show']);
    Route::patch('/merchants/{merchant}/status', [MerchantController::class, 'updateStatus']);
    Route::get('/merchants/{merchant}/transactions', [MerchantController::class, 'transactions']);
    Route::get('/merchants/{merchant}/settlements', [MerchantController::class, 'settlements']);

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);

    Route::get('/settlements', [SettlementController::class, 'index']);
    Route::post('/settlements/run', [SettlementController::class, 'run']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
});
