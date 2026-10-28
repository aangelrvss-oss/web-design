/* MRI V2 · botón flotante de WhatsApp.
   El enlace funciona sin JavaScript. Esto solo lo aparta mientras el
   formulario de presupuesto está en pantalla (para que no tape campos ni el
   botón de envío) y al llegar a la franja del Kit Digital del pie, cuyos
   logotipos deben verse enteros. Con el menú móvil abierto lo oculta el CSS. */
(function () {
  'use strict';
  var wa = document.querySelector('[data-wa]');
  if (!wa || !('IntersectionObserver' in window)) return;
  var inView = new Set();
  var watch = function (el, margin) {
    if (!el) return;
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) inView.add(el); else inView.delete(el);
      wa.classList.toggle('wa--off', inView.size > 0);
    }, { rootMargin: margin }).observe(el);
  };
  // El formulario cuenta cuando ya ocupa la pantalla, no al asomar por abajo;
  // la franja del pie, en cuanto aparece (está pegada al final de la página).
  watch(document.querySelector('[data-quote]'), '0px 0px -12% 0px');
  watch(document.querySelector('.foot .kit'), '0px');
})();
