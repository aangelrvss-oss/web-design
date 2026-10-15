<?php
/**
 * Reseñas de Google para proreforma.es mediante la API de Places (New).
 * Ruta pública: /api/resenas (reescrita a este archivo en .htaccess).
 *
 * - Configuración SOLO por variables de entorno del servidor (nunca en Git):
 *     GOOGLE_PLACES_API_KEY     clave restringida a Places API (New)
 *     GOOGLE_PLACE_ID           place_id de la ficha (formato ChIJ…)
 *     GOOGLE_PLACES_DAILY_CAP   consultas máximas al día (por defecto 30)
 * - Sin configuración responde {"available": false} y la web mantiene el bloque
 *   editorial con su fecha de consulta.
 * - Sin caché del contenido: las condiciones de Google solo permiten guardar el
 *   place_id. Lo único que se guarda es un contador de consultas del día, para
 *   que el gasto no se dispare: al llegar al tope se responde {"available":
 *   false, "reason": "cap"} y la web muestra el bloque fechado.
 * - Cada consulta usa el SKU «Place Details Enterprise + Atmosphere»
 *   (1.000 gratis al mes; ver docs/RESENAS.md). 30 al día ≈ 900 al mes.
 * - Devuelve como máximo las 5 reseñas que elija Google, con la atribución de
 *   cada autor (nombre, foto, enlace), el enlace de cada reseña y el de la ficha.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function out(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$key = getenv('GOOGLE_PLACES_API_KEY') ?: '';
$place = getenv('GOOGLE_PLACE_ID') ?: '';
if ($key === '' || $place === '' || !preg_match('/^[A-Za-z0-9_-]{10,200}$/', $place)) {
    out(['available' => false, 'reason' => 'not-configured']);
}

// Tope diario de consultas (contador en el directorio temporal del servidor).
$cap = max(0, (int)(getenv('GOOGLE_PLACES_DAILY_CAP') ?: 30));
$counter = rtrim(getenv('PR_PLACES_COUNTER_DIR') ?: sys_get_temp_dir(), '/') . '/pr-places-' . date('Ymd') . '.count';
$fh = @fopen($counter, 'c+');
if ($fh && flock($fh, LOCK_EX)) {
    $used = (int)stream_get_contents($fh);
    if ($used >= $cap) {
        flock($fh, LOCK_UN);
        fclose($fh);
        out(['available' => false, 'reason' => 'cap']);
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, (string)($used + 1));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

// PR_PLACES_ENDPOINT solo existe para probar con un servidor simulado.
$base = rtrim(getenv('PR_PLACES_ENDPOINT') ?: 'https://places.googleapis.com/v1', '/');
$url = $base . '/places/' . rawurlencode($place) . '?languageCode=es&regionCode=ES';
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
    out(['available' => false, 'reason' => 'upstream'], 502);
}

$d = json_decode($raw, true) ?: [];
if (!isset($d['rating'], $d['userRatingCount'])) {
    out(['available' => false, 'reason' => 'incomplete'], 502);
}
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
        'published' => $r['publishTime'] ?? '',
        'uri' => $r['googleMapsUri'] ?? '',
        'author' => [
            'name' => $r['authorAttribution']['displayName'] ?? '',
            'uri' => $r['authorAttribution']['uri'] ?? '',
            'photo' => $r['authorAttribution']['photoUri'] ?? '',
        ],
    ];
}

out([
    'available' => true,
    'name' => $d['displayName']['text'] ?? '',
    'rating' => (float)$d['rating'],
    'count' => (int)$d['userRatingCount'],
    'mapsUri' => $d['googleMapsUri'] ?? '',
    'reviews' => $reviews,
]);
