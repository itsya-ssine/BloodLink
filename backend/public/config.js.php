<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$apiBaseUrl = getenv('PUBLIC_API_BASE_URL') ?: 'http://localhost:8000/api';

echo 'window.BLOODLINK_ENV = Object.assign({}, window.BLOODLINK_ENV || {}, ' . json_encode([
    'API_BASE_URL' => $apiBaseUrl,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . ');';
