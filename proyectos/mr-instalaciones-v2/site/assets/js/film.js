/* MRI V2 · la secuencia de la portada.
   El motor (Scroll-craft, sin modificar) ya fija el escenario, mueve el clip
   con el scroll y enciende los textos de escena (data-sc-cue). site.js (de la
   V1) lo monta y gestiona menú y formulario. Aquí solo va lo propio de la V2:

   - formato y versión del clip (completa o vertical para móvil) y momento de
     pedirlo, antes de que el motor se monte;
   - el hero: se retira con el scroll (el CSS lo calcula; aquí solo se le
     quita el foco y los clics cuando ya no se ve);
   - el carril de escenas: escena activa, progreso de cada tramo y saltos;
   - el encuadre del móvil por escena (--fx);
   - la cabecera: flota sobre la imagen y pasa a franja de papel al salir;
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
  var hero = film.querySelector('[data-film-hero]');
  var bar = document.querySelector('[data-bar]');
  var scenes = cfg.scenes;
  var rail = scenes.map(function (s) { return film.querySelector('[data-goto="' + s.key + '"]').parentNode; });
  var caps = scenes.map(function (s) { return document.getElementById('escena-' + s.key); });
  var stills = scenes.map(function (s) { return film.querySelector('[data-still="' + s.key + '"]'); });

  /* ---- Fase 1: antes de que el motor se monte (este script va primero). --
     H.264 lo reproducen Chrome, Edge, Safari y casi todos los Firefox; donde
     no hay H.264 se da la versión VP9 (mismo encuadre, mismo GOP). */
  var video = film.querySelector('video[data-sc-scrub]');
  /* En vertical estrecho (la misma consulta que el <picture> del póster), la
     versión vertical: un recorte del original ya encuadrado. Se elige una
     sola vez, antes de pedir nada: el motor descarga un único archivo. */
  var portraitMQ = cfg.portrait ? matchMedia(cfg.portrait) : null;
  var portrait = !!(portraitMQ && portraitMQ.matches && video && video.getAttribute('data-portrait'));
  if (video) {
    var vp9 = !video.canPlayType('video/mp4; codecs="avc1.640028"') && video.canPlayType('video/webm; codecs="vp9"');
    var pickSrc = portrait ? (vp9 ? 'data-portrait-webm' : 'data-portrait') : (vp9 ? 'data-webm' : null);
    if (pickSrc) video.setAttribute('data-sc-src', video.getAttribute(pickSrc));
    film.classList.toggle('film--portrait', portrait);
  }
  /* El clip se pide en cuanto la página ha cargado: hasta entonces el póster
     (su primer fotograma, precargado) ya compone la portada, y el clip no
     compite por la red con él ni con las fuentes. Sin data-sc-src el motor no
     descarga nada; al restaurarlo se fuerza su siguiente lectura. */
  if (video && document.readyState !== 'complete') {
    var held = video.getAttribute('data-sc-src');
    video.removeAttribute('data-sc-src');
    addEventListener('load', function () {
      video.setAttribute('data-sc-src', held);
      var sc = window.ScrollCraft && window.ScrollCraft.instances[0];
      if (sc) sc.read();
    }, { once: true });
  }
  film.style.setProperty('--hero-out', String(cfg.heroOut));
  film.style.setProperty('--hero-fade', String(cfg.heroFade));

  /* Ventana de cada velo de escena, derivada de la de su texto (rampa del cue
     = 16 % de la ventana): entra antes y sale después que las letras. */
  scenes.forEach(function (s, i) {
    var v = film.querySelector('[data-veil="' + s.key + '"]');
    if (!v) return;
    var ramp = 0.16 * (s.to - s.from);
    v.style.setProperty('--vf', (s.from - 0.3 * ramp).toFixed(4));
    v.style.setProperty('--vt', i === scenes.length - 1 ? '9' : (s.to + 0.3 * ramp).toFixed(4));
    v.style.setProperty('--vr', (0.8 * ramp).toFixed(4));
  });

  /* ---- Fase 2: con el motor ya montado por site.js. Los scripts diferidos
     se ejecutan con el documento en «interactive» y DOMContentLoaded llega
     cuando han terminado todos, así que se espera a ese evento. */
  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);

  function start() {
    var engine = doc.classList.contains('sc-ready') && window.ScrollCraft && window.ScrollCraft.instances[0];
    var barH = function () { return bar ? bar.offsetHeight : 0; };

    /* Sin motor o con movimiento reducido: página estática (ver site.css). La
       barra flota sobre la imagen del hero y se vuelve franja después. */
    if (!engine || reduce) {
      film.classList.add('film--static');
      if (bar) {
        var onScrollStatic = function () { bar.classList.toggle('is-solid', scrollY > hero.offsetHeight - barH()); };
        addEventListener('scroll', onScrollStatic, { passive: true });
        onScrollStatic();
      }
      return;
    }

    var top = 0, height = 1, maxY = 1, vh = innerHeight;
    function measure() {
      vh = innerHeight;
      top = film.getBoundingClientRect().top + scrollY;
      height = film.offsetHeight;
      maxY = Math.max(doc.scrollHeight - vh, 1);
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
    function yForP(p) { return top + p * Math.max(height - vh, 1); }
    function sceneY(s) { return yForP(s.from + 0.3 * (s.to - s.from)); } // pasada la rampa de entrada

    var last = { scene: -1, gone: null, rolling: null, solid: null, fx: '' };
    var raf = 0;

    function update() {
      raf = 0;
      var y = scrollY;
      var c = clipAt(y);
      var p = Math.min(Math.max((y - top) / Math.max(height - vh, 1), 0), 1);

      /* Hero: el CSS lo funde con --sc-p; aquí, sin foco ni clics cuando ya
         no se ve, y el carril solo responde cuando el hero se ha ido. */
      var hp = Math.min(Math.max((cfg.heroOut - p) / cfg.heroFade, 0), 1);
      var gone = hp <= 0.001, rolling = hp < 0.999;
      if (gone !== last.gone) { hero.classList.toggle('is-gone', gone); last.gone = gone; }
      if (rolling !== last.rolling) { film.classList.toggle('is-rolling', rolling); last.rolling = rolling; }

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

      /* Un texto de escena oculto no recibe clics: solo el de su ventana. */
      caps.forEach(function (el, i) {
        var s = scenes[i];
        el.classList.toggle('is-on', p >= s.from && p <= s.to + 0.001);
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

      /* Cabecera: flota mientras la imagen está debajo; después, franja. */
      if (bar) {
        var solid = y >= top + height - barH();
        if (solid !== last.solid) { bar.classList.toggle('is-solid', solid); last.solid = solid; }
      }
    }
    function queue() { if (!raf) raf = requestAnimationFrame(update); }

    measure();
    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', function () { measure(); queue(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); queue(); });
    narrow.addEventListener('change', function () { film.style.removeProperty('--fx'); last.fx = ''; queue(); });

    /* Carril y «Descubrir nuestros sistemas»: llevan a su escena. */
    function goTo(i) { window.scrollTo({ top: Math.round(sceneY(scenes[i])), behavior: 'smooth' }); }
    rail.forEach(function (li, i) {
      li.querySelector('a').addEventListener('click', function (ev) { ev.preventDefault(); goTo(i); });
    });
    var startLink = film.querySelector('[data-film-start]');
    /* El foco acompaña a la vista: al terminar el desplazamiento pasa al
       primer texto de escena (el hero, ya oculto, no puede conservarlo). */
    if (startLink) startLink.addEventListener('click', function (ev) {
      ev.preventDefault();
      goTo(0);
      var done = false;
      var land = function () {
        if (done) return; done = true;
        caps[0].setAttribute('tabindex', '-1');
        caps[0].focus({ preventScroll: true });
      };
      addEventListener('scrollend', land, { once: true });
      setTimeout(land, 1200);
    });

    /* Teclado: un elemento enfocado dentro del acto se muestra entero. El
       navegador desplaza por su cuenta para mostrar lo enfocado después de
       este evento, así que la corrección va en el fotograma siguiente. */
    film.addEventListener('focusin', function (ev) {
      var cap = ev.target.closest('.cap');
      var target = cap ? sceneY(scenes[caps.indexOf(cap)]) : hero.contains(ev.target) ? top : null;
      if (target === null) return;
      requestAnimationFrame(function () {
        if (Math.abs(scrollY - target) > 4) window.scrollTo({ top: Math.round(target), behavior: 'instant' });
      });
    });

    /* Si el clip no consigue pintar (red, decodificador, ahorro de datos), la
       secuencia no se queda en el póster: se encadenan los fotogramas fijos de
       cada escena con el mismo scroll. */
    var giveUp = setTimeout(function () {
      if (!film.classList.contains('sc-has-clip')) film.classList.add('film--stills');
    }, 9000);
    var watch = new MutationObserver(function () {
      if (film.classList.contains('sc-has-clip')) { clearTimeout(giveUp); film.classList.remove('film--stills'); watch.disconnect(); }
    });
    watch.observe(film, { attributes: true, attributeFilter: ['class'] });

    /* Si el teléfono gira después de cargar, el clip elegido ya no encaja
       (un recorte vertical en horizontal se ampliaría de más, o al revés). No
       se descarga otro: mientras dure el giro, la secuencia usa los
       fotogramas fijos a resolución completa, con el mismo scroll. */
    if (portraitMQ) portraitMQ.addEventListener('change', function () {
      if (portraitMQ.matches !== portrait) film.classList.add('film--stills');
      else if (film.classList.contains('sc-has-clip')) film.classList.remove('film--stills');
      queue();
    });
  }
})();
