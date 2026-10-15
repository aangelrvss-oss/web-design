/* Pro Reforma · comportamiento propio. El motor de Scroll-craft
   (assets/vendor/scrollcraft) se usa tal cual: aquí solo se monta. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* -------------------------------------------------------- medición --
     Sin herramientas de terceros: cada acción emite `pr:track` y, si algún
     día existe window.dataLayer con consentimiento, se le pasa el objeto. */
  function track(name, data) {
    var detail = Object.assign({ event: name, page: location.pathname }, data || {});
    try { document.dispatchEvent(new CustomEvent('pr:track', { detail: detail })); } catch (e) {}
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (!el || el.type === 'submit') return;
    track(el.getAttribute('data-track'), { location: el.getAttribute('data-track-loc') || '', href: el.getAttribute('href') || '' });
  });

  /* ---------------------------------------------------- motor de scroll --
     En móvil no hay tramos fijados: los actos con data-mobile-flow pasan a
     «flow» antes de montar el motor. El motor no se toca. */
  if (matchMedia('(max-width: 760px)').matches) $$('[data-mobile-flow]').forEach(function (act) {
    act.setAttribute('data-sc-act', 'flow');
    act.removeAttribute('data-sc-span');
    $$('[data-sc-stage]', act).forEach(function (st) { st.removeAttribute('data-sc-stage'); });
    $$('[data-sc-cue]', act).forEach(function (c) { c.setAttribute('data-sc-cue', '0'); });
    act.classList.add('is-mobile-flow');
  });
  var sc = null;
  if (window.ScrollCraft && document.querySelector('[data-sc-act]')) {
    try { sc = window.ScrollCraft.mount(document.body); } catch (err) { sc = null; doc.classList.remove('sc-ready'); }
  }
  var pinned = !reduce && doc.classList.contains('sc-ready');

  /* Nada recibe el foco estando invisible. */
  document.addEventListener('focusin', function (e) {
    var box = e.target.closest && e.target.closest('[data-sc-in]');
    if (box && !box.classList.contains('sc-in')) {
      box.classList.add('sc-in');
      Array.prototype.forEach.call(box.children, function (k) { k.style.transitionDelay = '0ms'; k.classList.add('sc-in'); });
    }
    var el = e.target;
    if (el.matches && el.matches(':focus-visible') && !el.closest('.bar, .sheet')) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });
  /* Acto fijado (fases de la obra): con teclado, llevar el scroll a la fase. */
  $$('[data-sc-act="pin"]').forEach(function (act) {
    if (!pinned) return;
    act.addEventListener('focusin', function () {
      var travel = act.offsetHeight - innerHeight;
      var top = act.getBoundingClientRect().top + scrollY;
      if (travel > 0 && (scrollY < top || scrollY > top + travel)) window.scrollTo({ top: Math.round(top), behavior: 'instant' });
    });
  });

  /* Las fases del acto fijado se dibujan solo con CSS (clip-path sobre
     --sc-p). Para que la verificación de scroll vea ese cambio real, el marco
     publica su estado visual tal como lo calcula el navegador. */
  $$('.phase__frame').forEach(function (frame) {
    if (frame.closest('.is-mobile-flow') || !doc.classList.contains('sc-ready')) return;
    var pics = $$('.phase__pic', frame);
    var queued = false;
    var publish = function () {
      queued = false;
      var rest = true;
      var state = pics.map(function (p) {
        var cs = getComputedStyle(p);
        var op = Math.round(parseFloat(cs.opacity) * 100);
        var img = p.querySelector('img');
        var m = img ? new DOMMatrixReadOnly(getComputedStyle(img).transform).a : 1;
        if (op > 0 && op < 100) rest = false;
        return cs.clipPath + '/' + op + '/' + m.toFixed(3);
      }).join(' ');
      frame.setAttribute('data-sc-verify-state', state);
      /* Con movimiento reducido, entre una fase y la siguiente la imagen se
         queda quieta a propósito: es una pausa declarada, no un tramo muerto. */
      if (reduce && rest) frame.setAttribute('data-sc-verify-hold', 'true'); else frame.removeAttribute('data-sc-verify-hold');
    };
    var ask = function () { if (!queued) { queued = true; requestAnimationFrame(publish); } };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    frame.addEventListener('transitionend', ask);
    publish();
  });

  /* --------------------------------------------------------------- menú -- */
  var drop = document.querySelector('[data-drop]');
  if (drop) {
    var menu = document.getElementById(drop.getAttribute('aria-controls'));
    var setDrop = function (open) { drop.setAttribute('aria-expanded', String(open)); menu.hidden = !open; };
    drop.addEventListener('click', function () { setDrop(drop.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('click', function (e) { if (!drop.parentNode.contains(e.target)) setDrop(false); });
    drop.parentNode.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setDrop(false); drop.focus(); } });
    drop.parentNode.addEventListener('focusout', function (e) { if (!drop.parentNode.contains(e.relatedTarget)) setDrop(false); });
  }
  var burger = document.querySelector('[data-burger]');
  var wa = document.querySelector('.wa-float');
  if (burger) {
    var sheet = document.getElementById(burger.getAttribute('aria-controls'));
    var setSheet = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      sheet.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      burger.querySelector('.vh').textContent = open ? 'Cerrar menú' : 'Menú';
      if (wa) wa.classList.toggle('is-hidden', open || waHidden);
    };
    burger.addEventListener('click', function () { setSheet(burger.getAttribute('aria-expanded') !== 'true'); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });
    matchMedia('(min-width: 1081px)').addEventListener('change', function (m) { if (m.matches) setSheet(false); });
  }

  /* WhatsApp flotante: se oculta mientras el formulario está en pantalla,
     para no tapar campos ni el botón de enviar. */
  var waHidden = false;
  var quote = document.getElementById('presupuesto');
  if (wa && quote && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      waHidden = en[0].isIntersecting;
      wa.classList.toggle('is-hidden', waHidden || document.body.classList.contains('menu-open'));
    }, { rootMargin: '0px 0px -10% 0px' }).observe(quote);
  }

  /* ------------------------------------------- reseñas de Google en vivo --
     Solo si el servidor tiene configurada la API de Places
     (site/api/resenas.php). Sin configuración responde {available:false} y
     se queda el bloque editorial con su fecha de consulta. */
  var reviews = document.querySelector('[data-reviews]');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var loadLive = function () {
    if (!window.fetch) return;
    fetch('/api/resenas.php', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.available) return;
        var rating = String(Number(d.rating).toFixed(1)).replace('.', ',');
        $$('[data-g-rating]').forEach(function (n) { n.textContent = rating; });
        $$('[data-g-count]').forEach(function (n) { n.textContent = d.count; });
        $$('[data-g-when]').forEach(function (n) { n.textContent = 'datos de Google en este momento'; });
        $$('[data-g-badge]').forEach(function (n) { if (d.mapsUri) n.href = d.mapsUri; });
        var mode = document.querySelector('[data-g-mode]');
        if (mode) mode.textContent = 'Reseñas y valoración servidas por Google en este momento. Google elige qué reseñas devuelve (como máximo cinco).';
        var list = document.querySelector('[data-g-list]');
        if (!list || !d.reviews || !d.reviews.length) return;
        list.innerHTML = d.reviews.map(function (rv, i) {
          var a = rv.author || {};
          var who = a.uri ? '<a href="' + esc(a.uri) + '" rel="noopener" target="_blank">' + esc(a.name) + '</a>' : esc(a.name);
          return '<figure class="quote-card' + (i === 0 ? ' quote-card--lead' : '') + '">' +
            '<blockquote><p>«' + esc(rv.text) + '»</p></blockquote>' +
            '<figcaption>' + (a.photo ? '<img class="reviews__live-photo" src="' + esc(a.photo) + '" alt="" width="32" height="32" loading="lazy" referrerpolicy="no-referrer">' : '') +
            '<span class="quote-card__who">' + who + '</span><span class="quote-card__src">' + esc(rv.when) + ' · ' + esc(rv.rating) + ' de 5' +
            (rv.uri ? ' · <a href="' + esc(rv.uri) + '" rel="noopener" target="_blank">Ver en Google Maps</a>' : '') + '</span></figcaption></figure>';
        }).join('') + '<p class="reviews__attr">Fuente: Google Maps</p>';
        track('reviews_live', { count: d.reviews.length });
      })
      .catch(function () {});
  };
  if (reviews && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); loadLive(); } }, { rootMargin: '400px 0px' });
    io.observe(reviews);
  }

  /* ---------------------------------------------- formulario: envío real -- */
  var form = document.querySelector('[data-quote]');
  if (form) {
    var t = form.querySelector('[data-t]');
    if (t) t.value = String(Date.now());
    var status = form.querySelector('[data-status]');
    var btn = form.querySelector('button[type="submit"]');
    var btnText = btn.textContent;
    var started = false;
    var origin = form.getAttribute('data-origin');
    form.addEventListener('input', function () { if (!started) { started = true; track('form_start', { origin: origin }); } });
    form.addEventListener('change', function (e) { if (e.target.name === 'tipo') track('select_service', { service: e.target.value, location: origin }); });
    var params = new URLSearchParams(location.search);
    var preset = params.get('tipo');
    if (preset) { var r0 = form.querySelector('input[name="tipo"][value="' + preset + '"]'); if (r0) r0.checked = true; }

    var field = function (n) { return form.elements[n]; };
    var errBox = function (id) { return document.getElementById(id); };
    var showErr = function (input, box, msg) {
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (box) { box.textContent = msg || ''; box.hidden = !msg; }
    };
    var idp = field('nombre').id.split('-')[0];
    var validate = function () {
      var ok = true, first = null;
      var nombre = field('nombre'), tel = field('telefono'), mail = field('email');
      var nErr = nombre.value.trim().length < 2 ? 'Escribe tu nombre.' : '';
      showErr(nombre, errBox(idp + '-nombre-err'), nErr);
      if (nErr) { ok = false; first = nombre; }
      var tv = tel.value.trim(), mv = mail.value.trim(), cErr = '', bad = null;
      if (!tv && !mv) { cErr = 'Indica un teléfono o un correo electrónico.'; bad = 'both'; }
      else if (tv && tv.replace(/\D/g, '').length < 9) { cErr = 'Revisa el teléfono: debe tener al menos 9 cifras.'; bad = 'tel'; }
      else if (mv && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mv)) { cErr = 'Revisa el correo electrónico.'; bad = 'mail'; }
      showErr(null, errBox(idp + '-contacto-err'), cErr);
      tel.setAttribute('aria-invalid', String(bad === 'both' || bad === 'tel'));
      mail.setAttribute('aria-invalid', String(bad === 'both' || bad === 'mail'));
      if (cErr) { ok = false; first = first || (bad === 'mail' ? mail : tel); }
      return { ok: ok, first: first };
    };
    var say = function (kind, html) {
      status.hidden = false;
      status.className = 'qf__status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
      status.innerHTML = html;
      status.focus({ preventScroll: false });
    };
    var TEL = '<a href="tel:+34691312106" data-track="click_phone" data-track-loc="form">691 312 106</a>';
    var WA = '<a href="https://wa.me/34691312106" rel="noopener" target="_blank" data-track="click_whatsapp" data-track-loc="form">WhatsApp</a>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = validate();
      if (!v.ok) { v.first.focus(); track('form_invalid', { origin: origin }); return; }
      var tipo = form.querySelector('input[name="tipo"]:checked');
      track('form_submit', { origin: origin, service: tipo ? tipo.value : '' });
      if (form.hasAttribute('data-demo')) {
        say('ok', '<strong>Versión de demostración</strong>El formulario comprueba los datos, pero esta copia no envía nada. En la web publicada la solicitud llegará a daniel@proreforma.es. Para contactar ahora: ' + TEL + ' o ' + WA + '.');
        return;
      }
      if (form.classList.contains('is-sending')) return;
      form.classList.add('is-sending');
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Enviando…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (r) { return r.json().catch(function () { return { ok: false, message: '' }; }).then(function (j) { j.status = r.status; return j; }); })
        .then(function (j) {
          if (j.ok) {
            track('form_success', { origin: origin, service: tipo ? tipo.value : '' });
            $$('.qf > fieldset, .qf__grid, .qf__foot', form).forEach(function (el) { el.hidden = true; });
            say('ok', '<strong>Solicitud enviada</strong>Gracias. La hemos recibido y te contactaremos para concertar la visita. Si es urgente: ' + TEL + ' o ' + WA + '.');
            return;
          }
          if (j.fields) {
            if (j.fields.nombre) showErr(field('nombre'), errBox(idp + '-nombre-err'), j.fields.nombre);
            if (j.fields.contacto) showErr(null, errBox(idp + '-contacto-err'), j.fields.contacto);
          }
          throw j;
        })
        .catch(function (j) {
          track('form_error', { origin: origin, status: (j && j.status) || 0 });
          var msg = (j && j.message) ? esc(j.message) : 'No hemos podido enviar tu solicitud.';
          var body = encodeURIComponent(['Nombre: ' + field('nombre').value, 'Teléfono: ' + field('telefono').value, 'Correo: ' + field('email').value, 'Localidad: ' + field('localidad').value, '', field('mensaje').value].join('\n'));
          say('err', '<strong>No se ha enviado</strong>' + msg + ' Tus datos siguen en el formulario. Puedes llamar al ' + TEL + ', escribir por ' + WA + ' o <a href="mailto:daniel@proreforma.es?subject=' + encodeURIComponent('Solicitud de presupuesto') + '&body=' + body + '" data-track="click_email" data-track-loc="form-error">enviarla por correo</a>.');
        })
        .then(function () { form.classList.remove('is-sending'); btn.removeAttribute('aria-disabled'); btn.textContent = btnText; });
    });
  }
  void sc;
})();
