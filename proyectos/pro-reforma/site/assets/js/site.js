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
    $$('.rail__track', act).forEach(function (r) { r.setAttribute('tabindex', '0'); });
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
  var bar = document.querySelector('[data-bar]');
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
      syncDock();
    };
    burger.addEventListener('click', function () { setSheet(burger.getAttribute('aria-expanded') !== 'true'); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });
    matchMedia('(min-width: 1081px)').addEventListener('change', function (m) { if (m.matches) setSheet(false); });
  }

  /* -------------------------------------- cabecera sobre el hero oscuro --
     Transparente mientras el hero está debajo; sólida en cuanto sale. */
  var hero = document.querySelector('[data-hero]');
  if (bar && bar.classList.contains('bar--over')) {
    var syncBar = function () {
      var solid = !hero || hero.getBoundingClientRect().bottom <= bar.offsetHeight + 1;
      bar.classList.toggle('is-solid', solid);
    };
    addEventListener('scroll', syncBar, { passive: true });
    addEventListener('resize', syncBar);
    syncBar();
  }

  /* --------------------------------------------- barra de contacto móvil --
     Aparece cuando los botones del hero ya no se ven, y se aparta sobre el
     formulario y el pie para no tapar campos ni enlaces. */
  var dock = document.querySelector('[data-dock]');
  var heroCta = document.querySelector('[data-hero-cta]') || document.querySelector('.page-hero .cta-pair');
  var quote = document.getElementById('presupuesto');
  var foot = document.querySelector('.foot');
  var seen = { cta: true, quote: false, foot: false };
  function syncDock() {
    if (!dock) return;
    var on = !seen.cta && !seen.quote && !seen.foot && !document.body.classList.contains('menu-open');
    dock.classList.toggle('is-on', on);
  }
  if (dock && 'IntersectionObserver' in window) {
    var watch = function (el, key) {
      if (!el) { seen[key] = false; return; }
      new IntersectionObserver(function (en) { seen[key] = en[0].isIntersecting; syncDock(); }).observe(el);
    };
    watch(heroCta, 'cta'); watch(quote, 'quote'); watch(foot, 'foot');
  }

  /* -------------------------- «Pedir presupuesto de …» marca el tipo de obra */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-set-type]');
    if (!a) return;
    var r = document.querySelector('#presupuesto input[name="tipo"][value="' + a.getAttribute('data-set-type') + '"]');
    if (r) { r.checked = true; track('select_service', { service: r.value, location: a.getAttribute('data-track-loc') || 'enlace' }); }
  });

  /* ------------------------------------------------- muro de reseñas -- */
  var wall = document.querySelector('.rwall');
  var more = wall && wall.querySelector('[data-more]');
  if (wall && more && wall.querySelectorAll('[data-more-item]').length && matchMedia('(max-width: 760px)').matches) {
    var hiddenN = wall.querySelectorAll('[data-more-item]').length;
    wall.classList.add('is-collapsed');
    more.hidden = false;
    more.textContent = 'Ver ' + hiddenN + ' opiniones más';
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') !== 'true';
      wall.classList.toggle('is-collapsed', !open);
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Ver menos opiniones' : 'Ver ' + hiddenN + ' opiniones más';
      if (open) { var first = wall.querySelector('[data-more-item]'); if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: false }); } }
      track('reviews_more', { open: open });
    });
  }

  /* ------------------------------------------- reseñas de Google en vivo --
     Si el servidor tiene configurada la API de Places (/api/resenas, PHP o
     función de Netlify), se sustituyen valoración, número y reseñas por los
     datos de Google con su atribución. Si no responde, se queda el bloque
     editorial con su fecha. Nunca se vacía ni se presenta lo antiguo como actual. */
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var STAR = '<svg class="ic ic--star ic--fill" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z"/></svg>';
  $$('[data-g-checked]').forEach(function (n) {
    var d = new Date(n.getAttribute('data-g-checked') + 'T12:00:00');
    if (!isNaN(d) && (Date.now() - d) / 864e5 > 180) { n.textContent += ' · puede haber cambiado'; n.classList.add('is-stale'); }
  });
  var live = function (d) {
    var rating = Number(d.rating).toFixed(1).replace('.', ',');
    $$('[data-g-rating]').forEach(function (n) { n.textContent = rating; });
    $$('[data-g-count]').forEach(function (n) { n.textContent = d.count; });
    $$('[data-g-when]').forEach(function (n) { n.textContent = 'datos de Google en este momento'; n.classList.remove('is-stale'); });
    $$('[data-g-badge]').forEach(function (n) { if (d.mapsUri) n.href = d.mapsUri; });
    var mode = document.querySelector('[data-g-mode]');
    if (mode) mode.textContent = 'Reseñas servidas por Google en este momento. Google elige cuáles devuelve (como máximo cinco) y no verifica las reseñas.';
    var list = document.querySelector('[data-g-list]');
    if (!list || !d.reviews || !d.reviews.length) return;
    var card = function (rv, lead) {
      var a = rv.author || {};
      var who = a.uri ? '<a href="' + esc(a.uri) + '" rel="noopener" target="_blank">' + esc(a.name) + '<span class="vh"> (se abre en otra pestaña)</span></a>' : esc(a.name);
      var av = a.photo ? '<img class="rcard__photo" src="' + esc(a.photo) + '" alt="" width="42" height="42" loading="lazy" referrerpolicy="no-referrer">' : '<span class="rcard__av" aria-hidden="true">' + esc((a.name || '?').charAt(0)) + '</span>';
      var paras = String(rv.text || '').split(/\n+/).filter(Boolean).map(function (t, i, all) { return '<p>' + (i === 0 ? '«' : '') + esc(t) + (i === all.length - 1 ? '»' : '') + '</p>'; }).join('');
      return '<figure class="rcard' + (lead ? ' rcard--lead' : '') + '">' +
        '<p class="rcard__stars"><span class="stars" role="img" aria-label="' + esc(rv.rating) + ' de 5 estrellas">' + new Array((rv.rating | 0) + 1).join(STAR) + '</span>' + esc(rv.rating) + ' de 5</p>' +
        '<blockquote>' + paras + '</blockquote>' +
        (rv.uri ? '<a class="rcard__more" href="' + esc(rv.uri) + '" rel="noopener" target="_blank">Ver la reseña en Google Maps<span class="vh"> (se abre en otra pestaña)</span></a>' : '') +
        '<figcaption>' + av + '<span class="rcard__who"><strong>' + who + '</strong><span>Reseña de Google · ' + esc(rv.when) + '</span></span></figcaption></figure>';
    };
    var rs = d.reviews.slice(0, 5);
    list.innerHTML = card(rs[0], true) + '<div class="rwall__cols">' + rs.slice(1).map(function (r) { return card(r, false); }).join('') + '</div>' +
      '<p class="rwall__attr">Fuente: Google Maps</p>';
    if (wall) { wall.classList.remove('is-collapsed'); if (more) more.hidden = true; }
    track('reviews_live', { count: rs.length });
  };
  var reviewsEl = document.querySelector('[data-reviews]') || document.querySelector('[data-g-badge]');
  var loadLive = function () {
    if (!window.fetch) return;
    fetch('/api/resenas', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.available) live(d); })
      .catch(function () {});
  };
  if (reviewsEl && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); loadLive(); } }, { rootMargin: '600px 0px' });
    io.observe(reviewsEl);
  }

  /* ---------------------------------------------- formulario: envío real -- */
  var form = document.querySelector('[data-quote]');
  if (form) {
    var t = form.querySelector('[data-t]');
    if (t) t.value = String(Date.now());
    var status = form.querySelector('[data-status]');
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.querySelector('.qf__send-t');
    var btnText = btnLabel.textContent;
    var started = false;
    var origin = form.getAttribute('data-origin');
    form.addEventListener('input', function () { if (!started) { started = true; track('form_start', { origin: origin }); } });
    form.addEventListener('change', function (e) { if (e.target.name === 'tipo') track('select_service', { service: e.target.value, location: origin }); });
    var preset = new URLSearchParams(location.search).get('tipo');
    if (preset) { var r0 = form.querySelector('input[name="tipo"][value="' + preset + '"]'); if (r0) r0.checked = true; }

    var field = function (n) { return form.elements[n]; };
    var idp = field('nombre').id.split('-')[0];
    var errBox = function (k) { return document.getElementById(idp + '-' + k + '-err'); };
    var showErr = function (input, box, msg) {
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (box) { box.textContent = msg || ''; box.hidden = !msg; }
    };
    var isMail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    var validate = function () {
      var first = null;
      var nombre = field('nombre'), contacto = field('contacto');
      var nErr = nombre.value.trim().length < 2 ? 'Escribe tu nombre.' : '';
      showErr(nombre, errBox('nombre'), nErr);
      if (nErr) first = nombre;
      var v = contacto.value.trim(), cErr = '';
      if (!v) cErr = 'Escribe un teléfono o un correo para poder contestarte.';
      else if (v.indexOf('@') > -1 ? !isMail(v) : v.replace(/\D/g, '').length < 9) cErr = v.indexOf('@') > -1 ? 'Revisa el correo: parece incompleto.' : 'Revisa el teléfono: debe tener al menos 9 cifras.';
      showErr(contacto, errBox('contacto'), cErr);
      if (cErr && !first) first = contacto;
      return { ok: !first, first: first };
    };
    field('contacto').addEventListener('blur', function () { if (this.getAttribute('aria-invalid') === 'true') validate(); });
    var say = function (kind, html) {
      status.hidden = false;
      status.className = 'qf__status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
      status.innerHTML = html;
      status.focus({ preventScroll: false });
    };
    var TEL = '<a href="tel:+34691312106" data-track="click_phone" data-track-loc="form">691 312 106</a>';
    var WA = '<a href="https://wa.me/34691312106" rel="noopener" target="_blank" data-track="click_whatsapp" data-track-loc="form">WhatsApp<span class="vh"> (se abre en otra pestaña)</span></a>';
    var busy = function (on) {
      form.classList.toggle('is-sending', on);
      form.setAttribute('aria-busy', String(on));
      if (on) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
      btnLabel.textContent = on ? 'Enviando…' : btnText;
    };
    var send = function () {
      if (form.hasAttribute('data-netlify-form')) {
        /* Netlify Forms: POST codificado a la propia web; 200 = recibido. */
        return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
          .then(function (r) { return { ok: r.ok, status: r.status }; });
      }
      return fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (r) { return r.json().catch(function () { return { ok: false, message: '' }; }).then(function (j) { j.status = r.status; return j; }); });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.classList.contains('is-sending')) return;
      var v = validate();
      if (!v.ok) { v.first.focus(); track('form_invalid', { origin: origin }); return; }
      var tipo = form.querySelector('input[name="tipo"]:checked');
      track('form_submit', { origin: origin, service: tipo ? tipo.value : '' });
      if (form.hasAttribute('data-demo')) {
        say('ok', '<strong>Versión de demostración</strong>El formulario comprueba los datos, pero esta copia no envía nada. En la web publicada la solicitud llegará a daniel@proreforma.es. Para contactar ahora: ' + TEL + ' o ' + WA + '.');
        return;
      }
      busy(true);
      send()
        .then(function (j) {
          if (j.ok) {
            track('form_success', { origin: origin, service: tipo ? tipo.value : '' });
            $$('.qf > fieldset, .qf__grid, .qf__foot', form).forEach(function (el) { el.hidden = true; });
            say('ok', '<strong>Solicitud enviada</strong>Gracias, ' + esc(field('nombre').value.trim().split(' ')[0]) + '. La hemos recibido y te contactaremos para concertar la visita (de lunes a viernes, de 9:00 a 19:00). Si es urgente: ' + TEL + ' o ' + WA + '.');
            return;
          }
          if (j.fields) {
            if (j.fields.nombre) showErr(field('nombre'), errBox('nombre'), j.fields.nombre);
            if (j.fields.contacto) showErr(field('contacto'), errBox('contacto'), j.fields.contacto);
          }
          throw j;
        })
        .catch(function (j) {
          track('form_error', { origin: origin, status: (j && j.status) || 0 });
          var msg = (j && j.message) ? esc(j.message) : 'No hemos podido enviar tu solicitud.';
          var body = encodeURIComponent(['Nombre: ' + field('nombre').value, 'Contacto: ' + field('contacto').value, 'Trabajo: ' + (tipo ? tipo.parentNode.textContent.trim() : ''), '', field('mensaje').value].join('\n'));
          say('err', '<strong>No se ha enviado</strong>' + msg + ' Tus datos siguen en el formulario. Puedes llamar al ' + TEL + ', escribir por ' + WA + ' o <a href="mailto:daniel@proreforma.es?subject=' + encodeURIComponent('Solicitud de presupuesto') + '&body=' + body + '" data-track="click_email" data-track-loc="form-error">enviarla por correo</a>.');
        })
        .then(function () { busy(false); });
    });
  }
  void sc;
})();
