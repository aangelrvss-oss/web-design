/* Living Clean · comportamiento propio de la página.
   El motor (assets/vendor/scrollcraft) se usa tal cual: aquí solo se monta y se
   añade lo específico de esta web. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------ medición --
     Sin herramientas de terceros. Cada interacción relevante emite un evento
     `lc:track` y, si el sitio incorpora en el futuro una capa de analítica
     con consentimiento (window.dataLayer), se le pasa el mismo objeto. */
  function track(name, data) {
    var detail = Object.assign({ event: name, page: location.pathname }, data || {});
    try { document.dispatchEvent(new CustomEvent('lc:track', { detail: detail })); } catch (e) {}
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (!el || el.type === 'submit') return;
    track(el.getAttribute('data-track'), { location: el.getAttribute('data-track-loc') || '', href: el.getAttribute('href') || '' });
  });

  /* ------------------------------------------------------- motor de scroll */
  var sc = null;
  /* En móvil no hay tramos fijados ni carriles horizontales: los actos marcados
     con data-mobile-flow pasan a «flow» ANTES de montar el motor, y el CSS los
     maqueta en vertical. El motor no se toca. Cambiar de orientación o de
     tamaño de ventana después de cargar mantiene la elección inicial. */
  var mobile = matchMedia('(max-width: 760px)').matches;
  if (mobile) $$('[data-mobile-flow]').forEach(function (act) {
    act.setAttribute('data-sc-act', 'flow');
    act.removeAttribute('data-sc-span');
    $$('[data-sc-pan]', act).forEach(function (r) { r.removeAttribute('data-sc-pan'); });
    $$('[data-sc-stage]', act).forEach(function (st) { st.removeAttribute('data-sc-stage'); });
    // Sus apariciones estaban pensadas para el tramo fijado: en flujo, cada
    // bloque aparece al entrar en pantalla.
    $$('[data-sc-cue]', act).forEach(function (c) { c.setAttribute('data-sc-cue', '0'); });
    act.classList.add('is-mobile-flow');
  });
  if (window.ScrollCraft && document.querySelector('[data-sc-act]')) {
    try { sc = window.ScrollCraft.mount(document.body); } catch (err) { sc = null; doc.classList.remove('sc-ready'); }
  }

  /* Un elemento que recibe el foco antes de su entrada animada se muestra al
     instante: nunca hay foco sobre algo invisible. */
  document.addEventListener('focusin', function (e) {
    var box = e.target.closest && e.target.closest('[data-sc-in]');
    if (!box || box.classList.contains('sc-in')) return;
    box.classList.add('sc-in');
    Array.prototype.forEach.call(box.children, function (k) { k.style.transitionDelay = '0ms'; k.classList.add('sc-in'); });
  });

  /* Posición de scroll en la que un elemento del raíl horizontal queda centrado. */
  var panTarget = function (act, item) {
    var rail = act.querySelector('[data-sc-pan]');
    var over = rail.scrollWidth - innerWidth;
    var travel = act.offsetHeight - innerHeight;
    if (over <= 0 || travel <= 0) return null;
    var extra = parseFloat(rail.getAttribute('data-sc-pan')) || 0;
    var want = item.offsetLeft + item.offsetWidth / 2 - innerWidth / 2;
    var p = Math.min(Math.max(want / (over * (1 + extra)), 0), 1);
    return Math.round(act.getBoundingClientRect().top + scrollY + travel * p);
  };
  var pinned = !reduce && doc.classList.contains('sc-ready');

  /* Teclado dentro del carril: llevar el scroll a donde el elemento enfocado se ve. */
  $$('[data-sc-act="pan"]').forEach(function (act) {
    if (!pinned) return;
    act.addEventListener('focusin', function (e) {
      var item = e.target.closest('[data-sc-pan] > *');
      if (!item) return;
      var y = panTarget(act, item);
      if (y !== null) window.scrollTo({ top: y, behavior: 'instant' });
    });
  });

  /* Teclado en un acto fijado (conserje): ir a la posición en la que el bloque
     del enlace enfocado ya es visible. */
  $$('[data-sc-act="pin"]').forEach(function (act) {
    if (!pinned) return;
    act.addEventListener('focusin', function (e) {
      var cue = e.target.closest('[data-sc-cue]');
      if (!cue) return;
      var n = cue.getAttribute('data-sc-cue').split(/\s+/).map(parseFloat);
      var target = isNaN(n[1]) ? Math.min(n[0] + 0.22, 0.98) : (n[0] + Math.min(n[1], 1)) / 2;
      var travel = act.offsetHeight - innerHeight;
      if (travel > 0) window.scrollTo({ top: Math.round(act.getBoundingClientRect().top + scrollY + travel * target), behavior: 'instant' });
    });
  });

  /* Foco con teclado fuera de la pantalla (tras un tramo largo sin enlaces):
     llevarlo a la vista al instante en lugar de con el desplazamiento suave.
     Los actos fijados y el carril ya lo han colocado antes de llegar aquí. */
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el.matches || !el.matches(':focus-visible') || el.closest('.bar, .sheet')) return;
    var r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  });

  /* ---------------------------------------- Acto 1: vuelo del logotipo --
     El logotipo de la cabecera empieza en el hueco grande de la portada y,
     durante el tramo fijado del hero, vuela a su sitio. Aquí solo se mide el
     desplazamiento y se publica el avance (--lf) en <html>; el resto es CSS. */
  var hero = document.querySelector('[data-hero]');
  var logoBox = document.querySelector('[data-logo-box]');
  var logoEl = document.querySelector('[data-logo] .logo');
  if (hero && logoBox && logoEl && pinned && hero.getAttribute('data-sc-act') === 'pin') {
    var measure = function () {
      doc.classList.remove('lc-fly');
      var stage = hero.querySelector('[data-sc-stage]');
      var t = logoBox.getBoundingClientRect();
      var l = logoEl.getBoundingClientRect();
      var top = t.top - stage.getBoundingClientRect().top; // posición dentro del escenario fijado
      doc.style.setProperty('--lx', (t.left - l.left).toFixed(1));
      doc.style.setProperty('--ly', (top - l.top).toFixed(1));
      doc.style.setProperty('--ls', (t.width / l.width).toFixed(4));
      doc.classList.add('lc-fly');
    };
    var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    var fly = 0;
    var flyFrame = function () {
      fly = 0;
      var travel = hero.offsetHeight - innerHeight;
      var p = travel > 0 ? Math.min(Math.max((scrollY - hero.offsetTop) / travel, 0), 1) : 1;
      var f = Math.min(Math.max((p - 0.04) / 0.56, 0), 1);
      doc.style.setProperty('--lf', ease(f).toFixed(4));
    };
    var queueFly = function () { if (!fly) fly = requestAnimationFrame(flyFrame); };
    measure();
    flyFrame();
    addEventListener('scroll', queueFly, { passive: true });
    var rt = 0;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); flyFrame(); }, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); flyFrame(); });
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
    matchMedia('(min-width: 1061px)').addEventListener('change', function (m) { if (m.matches) setSheet(false); });
  }

  /* ---------------------------------------------- formulario: estado ---- */
  var form = document.querySelector('[data-visit]');
  var setService = function (value, on) {
    if (!form) return;
    var box = form.querySelector('input[name="servicio[]"][value="' + value + '"]');
    if (box) box.checked = on;
  };
  /* Campos según el tipo de cliente: solo se enseñan los del tipo elegido.
     Sin JavaScript se ven todos (cada uno dice para quién es). */
  var syncType = function () {
    if (!form) return;
    var r = form.querySelector('input[name="tipo"]:checked');
    var k = r ? r.value : '';
    $$('[data-for]', form).forEach(function (el) {
      if (el.hasAttribute('data-plan-box')) return; // la caja de zonas tiene su propia lógica
      var show = !!k && el.getAttribute('data-for').split(' ').indexOf(k) > -1;
      el.hidden = !show;
      $$('input, select, textarea', el).forEach(function (i) { i.disabled = !show; });
    });
  };
  var setType = function (value, source) {
    if (!form) return;
    var r = form.querySelector('input[name="tipo"][value="' + value + '"]');
    if (r && !r.checked) { r.checked = true; track('select_service', { type: value, location: source || '' }); }
    syncType();
  };
  if (form) {
    syncType();
    form.addEventListener('change', function (e) {
      if (e.target.name === 'tipo') { syncType(); track('select_service', { type: e.target.value, location: 'form' }); }
      if (e.target.name === 'servicio[]' && e.target.checked) track('select_service', { service: e.target.value, location: 'form' });
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-set-type], [data-set-service]');
    if (!t) return;
    var loc = t.getAttribute('data-track-loc') || '';
    if (t.hasAttribute('data-set-type')) {
      var k = t.getAttribute('data-set-type');
      setType(k, loc);
      if (k === 'comunidad' && !t.hasAttribute('data-set-service')) setService('comunidades', true);
    }
    if (t.hasAttribute('data-set-service')) { setService(t.getAttribute('data-set-service'), true); track('select_service', { service: t.getAttribute('data-set-service'), location: loc }); }
  });
  var params = new URLSearchParams(location.search);
  if (form && params.get('servicio')) params.get('servicio').split(',').forEach(function (v) { setService(v, true); });

  /* ------------------------- Comunidades: zonas del edificio y el plan -- */
  var ronda = document.getElementById('comunidades');
  if (ronda) {
    var railPinned = pinned && ronda.getAttribute('data-sc-act') === 'pan';
    var stops = $$('[data-stop]', ronda);
    var links = $$('[data-goto]', ronda);
    var planItems = $$('[data-plan-item]', ronda);
    var planBox = form && form.querySelector('[data-plan-box]');
    var planText = form && form.querySelector('[data-plan-text]');
    var planInput = form && form.querySelector('[data-plan-input]');
    var touched = false;
    var nameOf = function (el) { return el.querySelector('.stop__h').textContent; };
    var included = function () { return stops.filter(function (s) { return !s.classList.contains('is-off'); }); };

    var renderPlan = function () {
      var on = included();
      var keys = on.map(function (s) { return s.getAttribute('data-stop'); });
      planItems.forEach(function (li) { li.hidden = keys.indexOf(li.getAttribute('data-plan-item')) < 0; });
      links.forEach(function (a) { a.classList.toggle('is-off', keys.indexOf(a.getAttribute('data-goto')) < 0); });
      if (!planBox || !touched) return;
      planBox.hidden = false;
      planInput.disabled = false;
      planInput.value = keys.join(',');
      planText.textContent = on.length ? on.map(nameOf).join(', ') + '.' : 'Ninguna zona marcada.';
    };
    var commit = function () {
      touched = true;
      var cur = form && form.querySelector('input[name="tipo"]:checked');
      if (!cur || (cur.value !== 'comunidad' && cur.value !== 'administrador')) setType('comunidad', 'comunidades');
      setService('comunidades', true);
      renderPlan();
    };
    $$('[data-stop-toggle]', ronda).forEach(function (b) {
      b.addEventListener('click', function () {
        var now = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(now));
        b.closest('[data-stop]').classList.toggle('is-off', !now);
        commit();
        track('zone_toggle', { zone: b.getAttribute('data-stop-toggle'), included: now });
      });
    });
    var go = ronda.querySelector('[data-plan-go]');
    if (go) go.addEventListener('click', function () { commit(); track('zones_to_form', { zones: included().length }); });

    /* Raíl: ir a una parada. Con el carril fijado, a la posición de scroll
       que la centra; sin él (movimiento reducido), desplazando el carril. */
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var item = document.getElementById('zona-' + a.getAttribute('data-goto'));
        if (!item) return;
        e.preventDefault();
        if (railPinned) {
          var y = panTarget(ronda, item);
          if (y !== null) window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          item.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: mobile ? 'center' : 'nearest' });
        }
        track('zone_track_click', { zone: a.getAttribute('data-goto') });
      });
    });

    /* Parada actual: la tarjeta más cercana al centro de la pantalla. */
    var current = '';
    var trackEl = ronda.querySelector('.track');
    var raf = 0;
    var mark = function () {
      raf = 0;
      var r = ronda.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var mid = innerWidth / 2, best = null, dist = Infinity;
      stops.forEach(function (s) {
        var b = s.getBoundingClientRect();
        var d = Math.abs(b.left + b.width / 2 - mid);
        if (d < dist && b.right > 0 && b.left < innerWidth) { dist = d; best = s; }
      });
      var key = best && dist < innerWidth * 0.45 ? best.getAttribute('data-stop') : '';
      if (key === current) return;
      current = key;
      var idx = -1;
      links.forEach(function (a, i) { if (a.getAttribute('data-goto') === key) idx = i; });
      links.forEach(function (a, i) {
        if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
        a.classList.toggle('is-past', idx > -1 && i < idx);
      });
      if (trackEl) trackEl.style.setProperty('--k', idx > 0 ? (idx / (links.length - 1)).toFixed(3) : '0');
    };
    var queue = function () { if (!raf) raf = requestAnimationFrame(mark); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    var stage = ronda.querySelector('[data-sc-stage]');
    if (stage) stage.addEventListener('scroll', queue, { passive: true });
    mark();
  }

  /* --------------------------------------------- formulario: envío real -- */
  if (form) {
    var t = form.querySelector('[data-t]');
    if (t) t.value = String(Date.now());
    var status = form.querySelector('[data-status]');
    var btn = form.querySelector('button[type="submit"]');
    var btnText = btn.textContent;
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
      status.className = 'hv__status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
      status.innerHTML = html;
      status.focus({ preventScroll: false });
    };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var TEL = '<a href="tel:+34608825864" data-track="click_phone" data-track-loc="form">608 82 58 64</a>';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = validate();
      if (!v.ok) { v.first.focus(); track('form_invalid', { origin: origin }); return; }
      var tipo = form.querySelector('input[name="tipo"]:checked');
      track('form_submit', { origin: origin, type: tipo ? tipo.value : '' });
      /* Copias de demostración (data-demo): se valida, pero no se envía ningún dato. */
      if (form.hasAttribute('data-demo')) {
        track('form_demo_submit', { origin: origin });
        say('ok', '<strong>Versión de demostración</strong>El formulario funciona, pero esta copia no envía datos. En la web publicada, la solicitud llegará a info@livingclean.es. Para contactar ahora con Living Clean: ' + TEL + '.');
        return;
      }
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
            var services = $$('input[name="servicio[]"]:checked', form).map(function (c) { return c.value; });
            track('form_success', { origin: origin, type: tipo ? tipo.value : '', services: services.join(','), zones: !!(field('plan') && !field('plan').disabled) });
            $$('.hv > fieldset, .hv__plan, .hv__grid, .hv__foot', form).forEach(function (el) { el.hidden = true; });
            say('ok', '<strong>Solicitud enviada</strong>Gracias. La hemos recibido y te llamaremos para concertar la visita. Si lo prefieres, llámanos al ' + TEL + '.');
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
          say('err', '<strong>No se ha enviado</strong>' + msg + ' Puedes llamarnos al ' + TEL + ' o <a href="mailto:info@livingclean.es?subject=' + encodeURIComponent('Solicitud de visita y presupuesto') + '&body=' + body + '" data-track="click_email" data-track-loc="form-error">enviarla por correo con tus datos</a>.');
        })
        .then(function () {
          form.classList.remove('is-sending');
          btn.removeAttribute('aria-disabled');
          btn.textContent = btnText;
        });
    });
  }

  void sc;
})();
