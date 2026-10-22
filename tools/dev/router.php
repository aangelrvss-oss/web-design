<?php
// Router para `php -S`: sirve el site/ de un proyecto (variable SITE_ROOT) con CSP y 404.
// Ej.: SITE_ROOT=proyectos/living-clean/site php -S 127.0.0.1:4600 tools/dev/router.php
$root = realpath(getenv('SITE_ROOT') ?: __DIR__ . '/../../proyectos/mr-instalaciones/site');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!getenv('MRI_NO_CSP')) header("Content-Security-Policy: default-src 'self'; img-src 'self' data: https://lh3.googleusercontent.com; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; media-src 'self' blob:; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'");
header('X-Content-Type-Options: nosniff');
if (preg_match('#^/[\w/-]+\.php$#', $path) && is_file($root . $path) && strpos(realpath($root . $path), $root) === 0) { require $root . $path; return true; }
// Rutas sin extensión servidas por un .php (p. ej. /api/resenas -> api/resenas.php, como el .htaccess).
if (preg_match('#^/[\w/-]+$#', $path) && is_file($root . $path . '.php') && strpos(realpath($root . $path . '.php'), $root) === 0) { require $root . $path . '.php'; return true; }
$file = $root . $path;
if (is_dir($file)) { $file = rtrim($file, '/') . '/index.html'; if (substr($path, -1) !== '/') { header('Location: ' . $path . '/', true, 301); return true; } }
if (is_file($file)) {
  $types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'application/javascript', 'woff2' => 'font/woff2', 'webp' => 'image/webp', 'png' => 'image/png', 'svg' => 'image/svg+xml', 'xml' => 'application/xml', 'txt' => 'text/plain', 'ico' => 'image/x-icon', 'mp4' => 'video/mp4', 'webm' => 'video/webm', 'json' => 'application/json'];
  $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
  header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
  readfile($file); return true;
}
http_response_code(404); header('Content-Type: text/html; charset=utf-8'); readfile($root . '/404.html'); return true;
