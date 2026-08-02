<?php

return [
    'paths' => ['api/*', 'login', 'logout', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173')),
    ))),
    // Match this project's Vercel production and preview deployments, so CORS
    // works even if FRONTEND_URL is unset or points at the wrong URL.
    'allowed_origins_patterns' => [
        '#^https://merchant-wallet-dashbooard[\w-]*\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
