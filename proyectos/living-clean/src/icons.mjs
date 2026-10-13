// Iconos de trazo, solo los que la interfaz necesita. Sin iconos decorativos.
const svg = (cls, d) => `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;

export const icon = {
  phone: svg('', '<path d="M6.6 3h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.8 6.8l1.4-2 4.2 1.4v2.6A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z"/>'),
  mail: svg('', '<path d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  pin: svg('', '<path d="M12 21s6.5-6.2 6.5-11.2a6.5 6.5 0 0 0-13 0C5.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>'),
  arrow: svg('ic--arrow', '<path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/>'),
  menu: svg('', '<path d="M4 7h16M4 12h16M4 17h16"/>'),
  chevron: svg('ic--chev', '<path d="M6 9.5l6 6 6-6"/>'),
  check: svg('ic--check', '<path d="M5 12.5l4.2 4.2L19 7"/>'),
  minus: svg('ic--minus', '<path d="M6 12h12"/>'),
  plus: svg('ic--plus', '<path d="M12 6v12M6 12h12"/>'),
  insta: svg('', '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>'),
};
