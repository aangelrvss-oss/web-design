<?php
/**
 * Reseñas de Google para proreforma.es mediante la API de Places (New).
 *
 * - Configuración SOLO por variables de entorno del servidor (nunca en Git):
 *     GOOGLE_PLACES_API_KEY   clave restringida a Places API (New)
 *     GOOGLE_PLACE_ID         place_id de la ficha (formato ChIJ…)
 * - Sin configuración responde {"available": false} y la web mantiene el bloque
 *   editorial con su fecha de consulta.
 * - Sin caché: las condiciones de Google no permiten guardar el contenido de
 *   Places (solo el place_id). Cada llamada consume una consulta del SKU
 *   «Place Details Enterprise + Atmosphere» (ver docs/RESENAS.md).
 * - Devuelve como máximo las 5 reseñas que elija Google, con la atribución de
 *   cada autor (nombre, foto, enlace) y el enlace a la ficha.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$key = getenv('GOOGLE_PLACES_API_KEY') ?: '';
$place = getenv('GOOGLE_PLACE_ID') ?: '';
if ($key === '' || $place === '' || !preg_match('/^[A-Za-z0-9_-]{10,200}$/', $place)) {
    echo json_encode(['available' => false, 'reason' => 'not-configured']);
    exit;
}

$url = 'https://places.googleapis.com/v1/places/' . rawurlencode($place) . '?languageCode=es&regionCode=ES';
$ctx = stream_context_create(['http' => [
    'method' => 'GET',
    'timeout' => 6,
    'ignore_errors' => true,
    'header' => implode("\r\n", [
        'X-Goog-Api-Key: ' . $key,
        'X-Goog-FieldMask: displayName,rating,userRatingCount,googleMapsUri,reviews',
    ]),
]]);
$raw = @file_get_contents($url, false, $ctx);
$code = 0;
foreach ($http_response_header ?? [] as $h) {
    if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) {
        $code = (int)$m[1];
    }
}
if ($raw === false || $code !== 200) {
    error_log('[pr-resenas] Places API respondió ' . $code);
    http_response_code(502);
    echo json_encode(['available' => false, 'reason' => 'upstream']);
    exit;
}

$d = json_decode($raw, true) ?: [];
$reviews = [];
foreach (($d['reviews'] ?? []) as $r) {
    $text = $r['text']['text'] ?? ($r['originalText']['text'] ?? '');
    if ($text === '') {
        continue;
    }
    $reviews[] = [
        'text' => $text,
        'rating' => (int)($r['rating'] ?? 0),
        'when' => $r['relativePublishTimeDescription'] ?? '',
        'uri' => $r['googleMapsUri'] ?? '',
        'author' => [
            'name' => $r['authorAttribution']['displayName'] ?? '',
            'uri' => $r['authorAttribution']['uri'] ?? '',
            'photo' => $r['authorAttribution']['photoUri'] ?? '',
        ],
    ];
}

echo json_encode([
    'available' => true,
    'name' => $d['displayName']['text'] ?? '',
    'rating' => $d['rating'] ?? null,
    'count' => $d['userRatingCount'] ?? null,
    'mapsUri' => $d['googleMapsUri'] ?? '',
    'reviews' => $reviews,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
