<?php
// Router para `php -S`: sirve site/ con las mismas cabeceras y 404 que .htaccess.
$root = realpath(__DIR__ . '/../../site');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!getenv('MRI_NO_CSP')) header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'");
header('X-Content-Type-Options: nosniff');
if ($path === '/contacto.php') { require $root . '/contacto.php'; return true; }
$file = $root . $path;
if (is_dir($file)) { $file = rtrim($file, '/') . '/index.html'; if (substr($path, -1) !== '/') { header('Location: ' . $path . '/', true, 301); return true; } }
if (is_file($file)) {
  $types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'application/javascript', 'woff2' => 'font/woff2', 'webp' => 'image/webp', 'png' => 'image/png', 'svg' => 'image/svg+xml', 'xml' => 'application/xml', 'txt' => 'text/plain', 'ico' => 'image/x-icon'];
  $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
  header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
  readfile($file); return true;
}
http_response_code(404); header('Content-Type: text/html; charset=utf-8'); readfile($root . '/404.html'); return true;
