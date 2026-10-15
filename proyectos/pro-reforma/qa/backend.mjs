// Pruebas de los dos backends de reseñas (PHP y función de Netlify) contra un
// servidor que imita la API de Places, y del tope diario del PHP.
// Uso: node qa/backend.mjs   (necesita php en el PATH)
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handler } from '../netlify/functions/resenas.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const res = [];
const ok = (n, p, i = '') => { res.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${i ? '  · ' + i : ''}`); };
const PLACE = { displayName: { text: 'Pro Reforma' }, rating: 5, userRatingCount: 41, googleMapsUri: 'https://maps.google.com/?cid=1539571755307103610', reviews: [{ rating: 5, text: { text: 'Muy buen trabajo.' }, relativePublishTimeDescription: 'hace 2 semanas', publishTime: '2026-10-01T10:00:00Z', googleMapsUri: 'https://maps.google.com/r/1', authorAttribution: { displayName: 'Autor', uri: 'https://www.google.com/maps/contrib/1', photoUri: 'https://lh3.googleusercontent.com/a/x' } }] };
let hits = 0, lastHeaders = null, mode = 'ok';
const mock = createServer((req, rs) => { hits++; lastHeaders = req.headers; if (mode === 'fail') { rs.writeHead(500); return rs.end('{}'); } rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify(PLACE)); });
await new Promise((r) => mock.listen(4790, '127.0.0.1', r));
const MOCK = 'http://127.0.0.1:4790/v1';

// Netlify
let r = await (await handler({})).json();
ok('Netlify: sin configuración, available:false', r.available === false && r.reason === 'not-configured');
r = await (await handler({ GOOGLE_PLACES_API_KEY: 'k-test', GOOGLE_PLACE_ID: 'ChIJtest12345', PR_PLACES_ENDPOINT: MOCK })).json();
ok('Netlify: datos normalizados con atribución', r.available && r.rating === 5 && r.count === 41 && r.reviews[0].author.uri.includes('contrib') && r.reviews[0].uri === 'https://maps.google.com/r/1');
ok('Netlify: clave en cabecera, nunca en la URL ni en la respuesta', lastHeaders['x-goog-api-key'] === 'k-test' && !JSON.stringify(r).includes('k-test') && /reviews/.test(lastHeaders['x-goog-fieldmask']));
mode = 'fail';
const rf = await handler({ GOOGLE_PLACES_API_KEY: 'k-test', GOOGLE_PLACE_ID: 'ChIJtest12345', PR_PLACES_ENDPOINT: MOCK });
ok('Netlify: si Google falla, 502 y available:false', rf.status === 502 && (await rf.json()).available === false);
mode = 'ok';

// PHP
const counterDir = mkdtempSync(join(tmpdir(), 'pr-cap-'));
const php = spawn('php', ['-S', '127.0.0.1:4791', '-t', join(here, '../site')], { env: { ...process.env, GOOGLE_PLACES_API_KEY: 'k-test', GOOGLE_PLACE_ID: 'ChIJtest12345', PR_PLACES_ENDPOINT: MOCK, GOOGLE_PLACES_DAILY_CAP: '2', PR_PLACES_COUNTER_DIR: counterDir }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const get = async () => (await fetch('http://127.0.0.1:4791/api/resenas.php')).json();
hits = 0;
const a = await get(), b = await get(), c = await get();
ok('PHP: datos normalizados con atribución', a.available && a.count === 41 && a.reviews[0].author.name === 'Autor');
ok('PHP: tope diario respetado (2 consultas y luego available:false)', b.available && c.available === false && c.reason === 'cap' && hits === 2, `consultas a Google: ${hits}`);
php.kill();
const php2 = spawn('php', ['-S', '127.0.0.1:4792', '-t', join(here, '../site')], { env: { ...process.env, GOOGLE_PLACES_API_KEY: '', GOOGLE_PLACE_ID: '' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const d = await (await fetch('http://127.0.0.1:4792/api/resenas.php')).json();
ok('PHP: sin configuración, available:false', d.available === false && d.reason === 'not-configured');
php2.kill(); mock.close();
console.log(`\n${res.filter(Boolean).length}/${res.length}`);
