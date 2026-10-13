/* Marca que hay JavaScript antes del primer pintado. Si el motor de scroll no
   llega a montarse, site.js lo detecta y el CSS muestra todo en estático. */
document.documentElement.classList.add('js');
