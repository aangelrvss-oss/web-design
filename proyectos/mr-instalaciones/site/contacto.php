<?php
/**
 * Recepción del formulario de presupuesto de mrinstalaciones.com.
 *
 * - Acepta solo POST. Valida en servidor (nunca se confía en la validación del navegador).
 * - Con `Accept: application/json` responde JSON (envío por fetch).
 *   Sin JavaScript redirige a /gracias/ o /envio-no-completado/.
 * - Envía un correo con PHP mail(). El alojamiento debe tener el envío de correo
 *   configurado; si mail() falla, se informa del error real al usuario y no se
 *   muestra un falso éxito.
 * - No guarda los datos en disco ni los envía a terceros.
 *
 * Configuración: variables de entorno o las constantes de abajo.
 */

declare(strict_types=1);

const MRI_TO = 'info@mrinstalaciones.com';
const MRI_FROM = 'web@mrinstalaciones.com';      // remitente del dominio (SPF/DKIM del dominio)
const MRI_MIN_SECONDS = 3;                       // envíos más rápidos se tratan como automáticos

$to = getenv('MRI_FORM_TO') ?: MRI_TO;
$from = getenv('MRI_FORM_FROM') ?: MRI_FROM;

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, int $status, string $message, array $fields = []): void
{
    global $wantsJson;
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message, 'fields' => $fields], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? '/gracias/' : '/envio-no-completado/'), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 405, 'Método no permitido.');
}

// Mismo origen: rechaza envíos desde otros dominios cuando el navegador informa del origen.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . $host, PHP_URL_HOST)) {
    respond(false, 403, 'Origen no permitido.');
}

$clean = static function ($v, int $max): string {
    $v = is_string($v) ? $v : '';
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace('/[^\P{C}\n\t]/u', '', $v) ?? '';
    return trim(mb_substr($v, 0, $max));
};
$line = static fn($v, int $max): string => str_replace("\n", ' ', $clean($v, $max));

// Señuelos antispam: campo oculto relleno o envío instantáneo. Se responde como
// si todo fuera bien para no dar pistas, pero no se envía nada.
$honeypot = $line($_POST['web'] ?? '', 200);
$t = (int)($_POST['t'] ?? 0);
$elapsed = $t > 0 ? (int)floor(microtime(true)) - (int)floor($t / 1000) : null;
if ($honeypot !== '' || ($elapsed !== null && $elapsed < MRI_MIN_SECONDS)) {
    respond(true, 200, 'Solicitud recibida.');
}

$allowedServices = [
    'fontaneria-saneamiento' => 'Fontanería y saneamiento',
    'calefaccion-climatizacion' => 'Calefacción y climatización',
    'aerotermia' => 'Aerotermia',
    'instalaciones-de-gas' => 'Gas',
    'ventilacion' => 'Ventilación',
    'domotica' => 'Domótica',
    'otro' => 'Otro o aún no lo sé',
];
$allowedTypes = ['' => 'Sin indicar', 'vivienda' => 'Vivienda', 'comercio' => 'Local o comercio', 'industria' => 'Nave o industria', 'obra-nueva' => 'Obra nueva o promoción'];

$nombre = $line($_POST['nombre'] ?? '', 120);
$telefono = $line($_POST['telefono'] ?? '', 40);
$email = $line($_POST['email'] ?? '', 160);
$localidad = $line($_POST['localidad'] ?? '', 120);
$tipo = $line($_POST['tipo'] ?? '', 20);
$mensaje = $clean($_POST['mensaje'] ?? '', 3000);
$origen = $line($_POST['origen'] ?? '', 60);
$servicios = array_values(array_intersect(array_keys($allowedServices), (array)($_POST['servicio'] ?? [])));

$errors = [];
if (mb_strlen($nombre) < 2) {
    $errors['nombre'] = 'Escribe tu nombre.';
}
$telDigits = preg_replace('/\D/', '', $telefono) ?? '';
$telOk = $telefono !== '' && strlen($telDigits) >= 9 && strlen($telDigits) <= 15;
$emailOk = $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
if ($telefono === '' && $email === '') {
    $errors['contacto'] = 'Indica un teléfono o un correo electrónico.';
} elseif ($telefono !== '' && !$telOk) {
    $errors['contacto'] = 'Revisa el teléfono: debe tener al menos 9 cifras.';
} elseif ($email !== '' && !$emailOk) {
    $errors['contacto'] = 'Revisa el correo electrónico.';
}
if (!array_key_exists($tipo, $allowedTypes)) {
    $tipo = '';
}
if ($errors) {
    respond(false, 422, 'Revisa los campos marcados.', $errors);
}

$labels = array_map(static fn($k) => $allowedServices[$k], $servicios);
$subject = 'Solicitud de presupuesto web: ' . ($labels ? implode(', ', $labels) : 'sin servicio indicado');
$body = implode("\n", [
    'Nueva solicitud de presupuesto desde mrinstalaciones.com',
    '',
    'Nombre:      ' . $nombre,
    'Teléfono:    ' . ($telefono ?: '-'),
    'Correo:      ' . ($email ?: '-'),
    'Localidad:   ' . ($localidad ?: '-'),
    'Inmueble:    ' . $allowedTypes[$tipo],
    'Servicios:   ' . ($labels ? implode(', ', $labels) : '-'),
    'Página:      ' . ($origen ?: '-'),
    '',
    'Mensaje:',
    $mensaje ?: '-',
    '',
    '--',
    'Enviado el ' . date('d/m/Y H:i') . '. Base jurídica: medidas precontractuales (art. 6.1.b RGPD).',
]);

$headers = [
    'From: MRI web <' . $from . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
    'X-Mailer: mri-web',
];
if ($emailOk) {
    $headers[] = 'Reply-To: ' . mb_encode_mimeheader($nombre, 'UTF-8') . ' <' . $email . '>';
}

$sent = @mail($to, mb_encode_mimeheader($subject, 'UTF-8'), $body, implode("\r\n", $headers), '-f' . $from);
if (!$sent) {
    error_log('[mri-form] mail() devolvió false');
    respond(false, 502, 'No hemos podido enviar tu solicitud. Llámanos al 911 66 24 76 o escribe a info@mrinstalaciones.com.');
}

respond(true, 200, 'Solicitud recibida.');
