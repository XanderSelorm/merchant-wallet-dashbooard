<?php

namespace App\Http\Controllers;

use App\Http\Resources\SettlementResource;
use App\Models\Settlement;
use App\Services\SettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettlementController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $settlements = Settlement::query()
            ->with('merchant')
            ->when($request->filled('merchant_id'), fn ($q) => $q->where('merchant_id', $request->integer('merchant_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('settled_on', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('settled_on', '<=', $request->date('date_to')))
            ->latest('id')
            ->paginate($request->integer('per_page', 10));

        return SettlementResource::collection($settlements);
    }

    public function run(SettlementService $settlements): JsonResponse
    {
        $created = $settlements->run();

        return response()->json([
            'message' => $created->isEmpty()
                ? 'No positive wallet balances to settle.'
                : sprintf('Settled %d merchant wallet%s.', $created->count(), $created->count() === 1 ? '' : 's'),
            'settlements' => SettlementResource::collection($created->load('merchant')),
        ]);
    }
}
