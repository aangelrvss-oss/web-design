/* MRI · comportamiento propio de la página.
   El motor (assets/vendor/scrollcraft) se usa tal cual: aquí solo se monta y se
   añade lo específico de esta web. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------ medición --
     Sin herramientas de terceros. Cada interacción relevante emite un evento
     `mri:track` y, si el sitio incorpora en el futuro una capa de analítica
     con consentimiento (window.dataLayer), se le pasa el mismo objeto. */
  function track(name, data) {
    var detail = Object.assign({ event: name, page: location.pathname }, data || {});
    try { document.dispatchEvent(new CustomEvent('mri:track', { detail: detail })); } catch (e) {}
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (!el || el.type === 'submit') return;
    track(el.getAttribute('data-track'), { location: el.getAttribute('data-track-loc') || '', href: el.getAttribute('href') || '' });
  });

  /* ------------------------------------------------------- motor de scroll */
  var sc = null;
  if (window.ScrollCraft && document.querySelector('[data-sc-act]')) {
    try { sc = window.ScrollCraft.mount(document.body); } catch (err) { sc = null; doc.classList.remove('sc-ready'); }
  }

  /* Un elemento que recibe el foco con el teclado antes de su entrada animada
     se muestra al instante: nunca hay foco sobre algo invisible. */
  document.addEventListener('focusin', function (e) {
    var box = e.target.closest && e.target.closest('[data-sc-in]');
    if (!box || box.classList.contains('sc-in')) return;
    box.classList.add('sc-in');
    Array.prototype.forEach.call(box.children, function (k) { k.style.transitionDelay = '0ms'; k.classList.add('sc-in'); });
  });

  /* Teclado dentro del carril horizontal: llevar el scroll a la posición en la
     que el elemento enfocado queda dentro de la pantalla. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-sc-act="pan"]'), function (act) {
    var rail = act.querySelector('[data-sc-pan]');
    if (!rail || reduce) return;
    act.addEventListener('focusin', function (e) {
      var item = e.target.closest('[data-sc-pan] > *');
      if (!item) return;
      var over = rail.scrollWidth - innerWidth;
      var travel = act.offsetHeight - innerHeight;
      if (over <= 0 || travel <= 0) return;
      var extra = parseFloat(rail.getAttribute('data-sc-pan')) || 0;
      var want = item.offsetLeft + item.offsetWidth / 2 - innerWidth / 2;
      var p = Math.min(Math.max(want / (over * (1 + extra)), 0), 1);
      var top = act.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: Math.round(top + travel * p), behavior: 'instant' });
    });
  });

  /* -------------------------------------------- anclas de la web antigua -- */
  var legacy = { '#trabajaconnosotros': '/trabaja-con-nosotros/', '#domestico': '#sectores', '#comercial': '#sectores', '#industrial': '#sectores', '#nuevaconstruccion': '#sectores' };
  if (legacy[location.hash]) {
    var dest = legacy[location.hash];
    if (dest.charAt(0) === '/') location.replace(dest);
    else if (document.querySelector(dest)) location.hash = dest;
  }

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
  if (burger) {
    var sheet = document.getElementById(burger.getAttribute('aria-controls'));
    var setSheet = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      sheet.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      burger.querySelector('.vh').textContent = open ? 'Cerrar menú' : 'Menú';
    };
    burger.addEventListener('click', function () { setSheet(burger.getAttribute('aria-expanded') !== 'true'); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });
    matchMedia('(min-width: 1021px)').addEventListener('change', function (m) { if (m.matches) setSheet(false); });
  }

  /* ------------------------------------- hero: profundidad con el puntero --
     Solo con ratón y sin movimiento reducido. Cada plano lee --px/--py y su
     propia profundidad en CSS; aquí solo se interpola la posición. */
  var hero = document.querySelector('[data-hero]');
  if (hero && fine && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, visible = true;
    var loop = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty('--px', cx.toFixed(3));
      hero.style.setProperty('--py', cy.toFixed(3));
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) && visible ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', function (e) {
      if (!visible) return;
      tx = (e.clientX / innerWidth - 0.5) * -1;
      ty = (e.clientY / innerHeight - 0.5) * -1;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
  }

  /* -------------------------------- formulario: estado compartido ------- */
  var form = document.querySelector('[data-quote]');
  var setService = function (value, on) {
    if (!form) return;
    var box = form.querySelector('input[name="servicio[]"][value="' + value + '"]');
    if (box) box.checked = on;
  };
  var params = new URLSearchParams(location.search);
  if (form && params.get('servicio')) params.get('servicio').split(',').forEach(function (v) { setService(v, true); });

  /* ------------------------------------------- pico: leyenda que aísla -- */
  var peak = document.querySelector('[data-peak]');
  if (peak) {
    var svg = peak.querySelector('.house--peak');
    var pick = peak.querySelector('[data-pick]');
    var btns = Array.prototype.slice.call(peak.querySelectorAll('[data-sys-btn]'));
    var serviceOf = { agua: 'fontaneria-saneamiento', saneamiento: 'fontaneria-saneamiento', calefaccion: 'calefaccion-climatizacion', aerotermia: 'aerotermia', ventilacion: 'ventilacion', gas: 'instalaciones-de-gas', domotica: 'domotica' };
    var labelOf = { 'fontaneria-saneamiento': 'Fontanería y saneamiento', 'calefaccion-climatizacion': 'Calefacción y climatización', aerotermia: 'Aerotermia', 'instalaciones-de-gas': 'Gas', ventilacion: 'Ventilación', domotica: 'Domótica' };
    var setByLegend = {};
    var render = function () {
      var on = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.getAttribute('data-sys-btn'); });
      svg.classList.toggle('is-iso', on.length > 0);
      Array.prototype.forEach.call(svg.querySelectorAll('.sys'), function (g) { g.classList.toggle('is-pick', on.indexOf(g.getAttribute('data-sys')) > -1); });
      var services = [];
      on.forEach(function (k) { if (services.indexOf(serviceOf[k]) < 0) services.push(serviceOf[k]); });
      Object.keys(setByLegend).forEach(function (s) { if (services.indexOf(s) < 0) { setService(s, false); delete setByLegend[s]; } });
      services.forEach(function (s) { setService(s, true); setByLegend[s] = true; });
      pick.innerHTML = services.length
        ? 'Marcado en tu solicitud: ' + services.map(function (s) { return labelOf[s]; }).join(', ') + '. <a href="#presupuesto">Ir al formulario</a>'
        : '';
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var now = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(now));
        render();
        if (now) track('peak_system_select', { system: b.getAttribute('data-sys-btn') });
      });
    });

    /* Teclado en un acto fijado: llevar el scroll a la posición en la que el
       bloque del enlace enfocado está visible (verify.md, "Keyboard"). */
    var act = peak.closest('[data-sc-act]');
    peak.addEventListener('focusin', function (e) {
      var cue = e.target.closest('[data-sc-cue]');
      if (!cue || !act) return;
      var n = cue.getAttribute('data-sc-cue').split(/\s+/).map(parseFloat);
      var target = isNaN(n[1]) ? n[0] + 0.05 : (n[0] + Math.min(n[1], 1)) / 2;
      var top = act.getBoundingClientRect().top + scrollY;
      var travel = act.offsetHeight - innerHeight;
      if (travel > 0) window.scrollTo({ top: Math.round(top + travel * target), behavior: 'instant' });
    });
  }

  /* --------------------------------------------- formulario: envío real -- */
  if (form) {
    var t = form.querySelector('[data-t]');
    if (t) t.value = String(Date.now());
    var status = form.querySelector('[data-status]');
    var btn = form.querySelector('button[type="submit"]');
    var started = false;
    var origin = form.getAttribute('data-origin');
    form.addEventListener('input', function () { if (!started) { started = true; track('form_start', { origin: origin }); } });

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
      if (nErr) { ok = false; first = first || nombre; }
      var tv = tel.value.trim(), mv = mail.value.trim(), cErr = '';
      if (!tv && !mv) cErr = 'Indica un teléfono o un correo electrónico.';
      else if (tv && tv.replace(/\D/g, '').length < 9) cErr = 'Revisa el teléfono: debe tener al menos 9 cifras.';
      else if (mv && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mv)) cErr = 'Revisa el correo electrónico.';
      showErr(null, errBox(idp + '-contacto-err'), cErr);
      var both = !tv && !mv;
      tel.setAttribute('aria-invalid', String(both || cErr.indexOf('teléfono') > -1));
      mail.setAttribute('aria-invalid', String(both || cErr.indexOf('correo electrónico.') > -1 && !!mv));
      if (cErr) { ok = false; first = first || (tv ? tel : mail); }
      return { ok: ok, first: first };
    };
    var say = function (kind, html) {
      status.hidden = false;
      status.className = 'tb__status tb__cell--wide ' + (kind === 'ok' ? 'is-ok' : 'is-err');
      status.innerHTML = html;
      status.focus({ preventScroll: false });
    };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = validate();
      if (!v.ok) { v.first.focus(); track('form_invalid', { origin: origin }); return; }
      if (form.classList.contains('is-sending')) return;
      form.classList.add('is-sending');
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Enviando…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (r) {
          return r.json().catch(function () { return { ok: false, message: '' }; }).then(function (j) { j.status = r.status; return j; });
        })
        .then(function (j) {
          if (j.ok) {
            var services = Array.prototype.map.call(form.querySelectorAll('input[name="servicio[]"]:checked'), function (c) { return c.value; });
            track('form_submit_success', { origin: origin, services: services.join(',') });
            form.querySelectorAll('.tb__cell, .tb__help, .tb__foot').forEach(function (el) { el.hidden = true; });
            say('ok', '<strong>Solicitud enviada</strong>Gracias. La hemos recibido y te contactaremos en horario laboral. Si es urgente, llama al <a href="tel:+34911662476" data-track="click_phone" data-track-loc="form-ok">911 66 24 76</a>.');
            return;
          }
          if (j.fields) {
            if (j.fields.nombre) showErr(field('nombre'), errBox(idp + '-nombre-err'), j.fields.nombre);
            if (j.fields.contacto) showErr(null, errBox(idp + '-contacto-err'), j.fields.contacto);
          }
          throw j;
        })
        .catch(function (j) {
          track('form_submit_error', { origin: origin, status: (j && j.status) || 0 });
          var msg = (j && j.message) ? esc(j.message) : 'No hemos podido enviar tu solicitud.';
          var body = encodeURIComponent(['Nombre: ' + field('nombre').value, 'Teléfono: ' + field('telefono').value, 'Correo: ' + field('email').value, 'Localidad: ' + field('localidad').value, '', field('mensaje').value].join('\n'));
          say('err', '<strong>No se ha enviado</strong>' + msg + ' Puedes llamarnos al <a href="tel:+34911662476" data-track="click_phone" data-track-loc="form-error">911 66 24 76</a> o <a href="mailto:info@mrinstalaciones.com?subject=' + encodeURIComponent('Solicitud de presupuesto') + '&body=' + body + '" data-track="click_email" data-track-loc="form-error">enviarla por correo con tus datos</a>.');
        })
        .then(function () {
          form.classList.remove('is-sending');
          btn.removeAttribute('aria-disabled');
          btn.textContent = 'Enviar solicitud';
        });
    });
  }

  /* El motor publica sc-ready al montarse. Si existe contenido animado pero el
     motor no está, el CSS ya lo muestra en estático (no se marca sc-ready). */
  void sc;
})();
