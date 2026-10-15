// Reseñas de Google para Netlify (alternativa a site/api/resenas.php cuando la
// web se aloja en Netlify, que no ejecuta PHP). Misma respuesta que el PHP.
// Ruta pública: /api/resenas (redirección en netlify.toml).
//
// Variables de entorno del sitio en Netlify (nunca en Git):
//   GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID
// Sin ellas responde {available:false} y la web mantiene el bloque fechado.
// Sin caché del contenido (condiciones de Google). No lleva tope diario
// propio: limitar la cuota en Google Cloud (Places API → Cuotas).
// Las funciones no se despliegan arrastrando un zip: hace falta Git o la CLI.

const FIELDS = 'displayName,rating,userRatingCount,googleMapsUri,reviews';
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
});

export async function handler(env = process.env, fetchImpl = fetch) {
  const key = env.GOOGLE_PLACES_API_KEY || '';
  const place = env.GOOGLE_PLACE_ID || '';
  if (!key || !/^[A-Za-z0-9_-]{10,200}$/.test(place)) return json({ available: false, reason: 'not-configured' });
  const base = (env.PR_PLACES_ENDPOINT || 'https://places.googleapis.com/v1').replace(/\/$/, '');
  let r;
  try {
    r = await fetchImpl(`${base}/places/${encodeURIComponent(place)}?languageCode=es&regionCode=ES`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS },
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    return json({ available: false, reason: 'upstream' }, 502);
  }
  if (!r.ok) return json({ available: false, reason: 'upstream' }, 502);
  const d = await r.json().catch(() => ({}));
  if (d.rating == null || d.userRatingCount == null) return json({ available: false, reason: 'incomplete' }, 502);
  const reviews = (d.reviews || []).map((x) => ({
    text: x.text?.text || x.originalText?.text || '',
    rating: Number(x.rating) || 0,
    when: x.relativePublishTimeDescription || '',
    published: x.publishTime || '',
    uri: x.googleMapsUri || '',
    author: { name: x.authorAttribution?.displayName || '', uri: x.authorAttribution?.uri || '', photo: x.authorAttribution?.photoUri || '' },
  })).filter((x) => x.text);
  return json({ available: true, name: d.displayName?.text || '', rating: Number(d.rating), count: Number(d.userRatingCount), mapsUri: d.googleMapsUri || '', reviews });
}

export default async () => handler();
