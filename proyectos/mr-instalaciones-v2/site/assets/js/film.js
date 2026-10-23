/* MRI V2 · la secuencia de la portada.
   El motor (Scroll-craft, sin modificar) ya fija el escenario, mueve el clip
   con el scroll y enciende los textos (data-sc-cue). site.js (de la V1) lo
   monta y gestiona menú y formulario. Aquí solo va lo propio de la V2:

   - el carril de escenas: escena activa, progreso de cada tramo y saltos;
   - el encuadre del móvil por escena (--fx);
   - la cabecera clara sobre la imagen y de tinta sobre el papel;
   - el teclado: lo enfocado dentro del acto se lleva a su momento;
   - la degradación: con movimiento reducido o sin motor la secuencia es una
     página estática, y si el clip no llega se encadenan fotogramas fijos. */
(function () {
  'use strict';

  var film = document.querySelector('[data-film]');
  if (!film) return;
  var cfg;
  try { cfg = JSON.parse(film.getAttribute('data-film')); } catch (e) { return; }

  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)'); // = site.css
  var intro = film.querySelector('[data-film-intro]');
  var bar = document.querySelector('[data-bar]');
  var scenes = cfg.scenes;
  var rail = scenes.map(function (s) { return film.querySelector('[data-goto="' + s.key + '"]').parentNode; });
  var caps = scenes.map(function (s) { return document.getElementById('escena-' + s.key); });
  var stills = scenes.map(function (s) { return film.querySelector('[data-still="' + s.key + '"]'); });

  /* ---- Fase 1: antes de que el motor se monte (este script va primero). --
     El motor descarga el clip de data-sc-src en cuanto se monta. H.264 lo
     reproducen Chrome, Edge, Safari y casi todos los Firefox; donde no hay
     H.264 se le da la versión VP9 con el mismo GOP denso. */
  var video = film.querySelector('video[data-sc-scrub]');
  if (video && !video.canPlayType('video/mp4; codecs="avc1.640028"') && video.canPlayType('video/webm; codecs="vp9"')) {
    video.setAttribute('data-sc-src', video.getAttribute('data-webm'));
    video.setAttribute('data-sc-src-mobile', video.getAttribute('data-webm-mobile'));
  }
  /* El clip se pide cuando la página ha cargado: hasta entonces el póster
     (que es su primer fotograma) cubre el escenario y no compite por la red
     con él ni con las fuentes. Sin data-sc-src el motor no descarga nada y
     vuelve a intentarlo en su siguiente lectura, que se fuerza aquí. */
  if (video && document.readyState !== 'complete') {
    var held = [video.getAttribute('data-sc-src'), video.getAttribute('data-sc-src-mobile')];
    video.removeAttribute('data-sc-src');
    video.removeAttribute('data-sc-src-mobile');
    addEventListener('load', function () {
      video.setAttribute('data-sc-src', held[0]);
      video.setAttribute('data-sc-src-mobile', held[1]);
      var sc = window.ScrollCraft && window.ScrollCraft.instances[0];
      if (sc) sc.read();
    }, { once: true });
  }
  film.style.setProperty('--open', String(cfg.open));

  /* Ventana de cada velo, derivada de la de su texto (rampa del cue = 16 %
     de la ventana): entra antes y sale después que las letras. */
  cfg.scenes.forEach(function (s, i) {
    var v = film.querySelector('[data-veil="' + s.key + '"]');
    if (!v) return;
    var ramp = 0.16 * (s.to - s.from);
    var last = i === cfg.scenes.length - 1;
    v.style.setProperty('--vf', (s.from - 0.3 * ramp).toFixed(4));
    v.style.setProperty('--vt', last ? '9' : (s.to + 0.3 * ramp).toFixed(4));
    v.style.setProperty('--vr', (0.8 * ramp).toFixed(4));
  });

  /* Logotipo claro para la cabecera sobre la imagen. */
  var logo = bar && bar.querySelector('.bar__logo img');
  if (logo) {
    var alt = logo.cloneNode();
    alt.src = '/assets/brand/logo-mri-claro.webp';
    alt.alt = '';
    alt.className = 'bar__logo-alt';
    alt.setAttribute('aria-hidden', 'true');
    logo.parentNode.appendChild(alt);
  }

  /* ---- Fase 2: con el motor ya montado por site.js. Los scripts diferidos
     se ejecutan con el documento en «interactive» y DOMContentLoaded llega
     cuando han terminado todos, así que se espera a ese evento. */
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);

  function start() {
    var engine = doc.classList.contains('sc-ready') && window.ScrollCraft && window.ScrollCraft.instances[0];

    /* Sin motor o con movimiento reducido: página estática (ver site.css). */
    if (!engine || reduce) {
      film.classList.add('film--static');
      if (bar) {
        var onScrollStatic = function () { bar.classList.toggle('is-top', scrollY < 8); };
        addEventListener('scroll', onScrollStatic, { passive: true });
        onScrollStatic();
      }
      return;
    }

    /* Geometría. La altura del bloque del titular decide dónde empieza la
       ventana, así que se mide en vez de suponerse. */
    var top = 0, height = 1, maxY = 1, vh = innerHeight, wtPx = 0;
    function measure() {
      vh = innerHeight;
      var r = film.getBoundingClientRect();
      top = r.top + scrollY;
      height = film.offsetHeight;
      maxY = Math.max(doc.scrollHeight - vh, 1);
      // Altura natural del bloque (sin el hueco flexible de la rejilla). En
      // escritorio la ventana arranca al menos en el 52 % para que el titular
      // respire; nunca por debajo del 74 %, para que la imagen asome siempre.
      intro.style.height = 'auto';
      var h = intro.offsetHeight;
      intro.style.height = '';
      var wt = narrow.matches ? h + 4 : Math.max(h, vh * 0.52);
      wtPx = Math.round(Math.min(wt, vh * 0.74));
      film.style.setProperty('--wt', wtPx + 'px');
    }

    /* Misma correspondencia que usa el motor para el clip: el tramo fijado
       (data-sc-clip-map="travel") o toda la vida visible del escenario,
       recortada al scroll que existe. */
    function clipRange() {
      if (cfg.travel) return [top, top + Math.max(height - vh, 1)];
      return [top - Math.min(vh, top), Math.min(top + height, maxY)];
    }
    function clipAt(y) {
      var r = clipRange();
      return Math.min(Math.max((y - r[0]) / Math.max(r[1] - r[0], 1), 0), 1);
    }
    function yForClip(c) {
      var r = clipRange();
      return r[0] + c * (r[1] - r[0]);
    }
    function yForP(p) { return top + p * Math.max(height - vh, 1); }

    var last = { scene: -1, dark: null, fx: '' };
    var raf = 0;

    function update() {
      raf = 0;
      var y = scrollY;
      var c = clipAt(y);
      var p = Math.min(Math.max((y - top) / Math.max(height - vh, 1), 0), 1);

      var k = 0;
      for (var i = 0; i < scenes.length; i++) if (c >= scenes[i].c0) k = i;

      rail.forEach(function (li, i) {
        var s = scenes[i];
        var f = Math.min(Math.max((c - s.c0) / Math.max(s.c1 - s.c0, 0.001), 0), 1);
        li.querySelector('.rail__bar i').style.setProperty('--f', f.toFixed(3));
      });
      if (k !== last.scene) {
        rail.forEach(function (li, i) {
          li.classList.toggle('is-on', i === k);
          var a = li.querySelector('a');
          if (i === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
        });
        stills.forEach(function (im, i) { im.classList.toggle('is-on', i === k); });
        last.scene = k;
      }

      /* Un texto oculto no recibe clics: solo el de su ventana. */
      caps.forEach(function (el, i) {
        var s = scenes[i];
        var on = p >= s.from && p <= s.to + 0.001 && p > cfg.open;
        el.classList.toggle('is-on', on);
      });

      /* Encuadre del móvil: el punto focal se interpola en un margen corto
         alrededor de cada cambio de escena, nunca salta. */
      if (narrow.matches) {
        var fx = scenes[k].focal;
        var next = scenes[k + 1];
        if (next) {
          var span = 0.06;
          var t = Math.min(Math.max((c - (next.c0 - span)) / span, 0), 1);
          t = t * t * (3 - 2 * t);
          fx = fx + (next.focal - fx) * t;
        }
        var fxs = fx.toFixed(1) + '%';
        if (fxs !== last.fx) { film.style.setProperty('--fx', fxs); last.fx = fxs; }
      }

      /* Cabecera: clara en cuanto el borde superior de la ventana llega a la
         barra (mismo cálculo que el CSS: --wt · (1 - smoothstep(e))) y
         mientras la imagen siga debajo de ella. */
      if (bar) {
        var e = Math.min(Math.max(p / cfg.open, 0), 1);
        var es = e * e * (3 - 2 * e);
        var barH = bar.offsetHeight;
        var overFilm = y < top + height - barH;
        var dark = overFilm && wtPx * (1 - es) < barH + 8;
        if (dark !== last.dark) { bar.classList.toggle('is-dark', dark); last.dark = dark; }
        bar.classList.toggle('is-top', overFilm && !dark);
      }
    }
    function queue() { if (!raf) raf = requestAnimationFrame(update); }

    measure();
    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', function () { measure(); queue(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); queue(); });
    narrow.addEventListener('change', function () { film.style.removeProperty('--fx'); last.fx = ''; measure(); queue(); });

    /* Carril: cada tramo lleva al momento central de su escena. */
    rail.forEach(function (li, i) {
      li.querySelector('a').addEventListener('click', function (ev) {
        ev.preventDefault();
        var s = scenes[i];
        var mid = Math.max(yForP(s.from) + 2, yForClip((s.c0 + Math.min(s.c1, 1)) / 2));
        window.scrollTo({ top: Math.round(Math.min(mid, yForP(s.to))), behavior: 'smooth' });
      });
    });

    /* Teclado: un elemento enfocado dentro del acto se muestra entero. */
    film.addEventListener('focusin', function (ev) {
      var cap = ev.target.closest('.cap');
      var target = null;
      if (cap) {
        var s = scenes[caps.indexOf(cap)];
        target = yForP(s.from + 0.3 * (s.to - s.from)); // pasada la rampa de entrada
      } else if (intro.contains(ev.target)) {
        target = top;
      }
      if (target === null) return;
      /* El navegador desplaza por su cuenta para mostrar lo enfocado, después
         de este evento: la corrección va en el fotograma siguiente. */
      requestAnimationFrame(function () {
        if (Math.abs(scrollY - target) > 4) window.scrollTo({ top: Math.round(target), behavior: 'instant' });
      });
    });

    /* Si el clip no consigue pintar (red, decodificador, ahorro de datos), la
       secuencia no se queda en el póster: se encadenan los fotogramas fijos de
       cada escena con el mismo scroll. */
    var giveUp = setTimeout(function () {
      if (!film.classList.contains('sc-has-clip')) {
        film.classList.add('film--stills');
        stills.forEach(function (im) { im.loading = 'eager'; });
      }
    }, 9000);
    var watch = new MutationObserver(function () {
      if (film.classList.contains('sc-has-clip')) { clearTimeout(giveUp); film.classList.remove('film--stills'); watch.disconnect(); }
    });
    watch.observe(film, { attributes: true, attributeFilter: ['class'] });
  }
})();
