// Iconos de trazo, solo los que la interfaz necesita.
const svg = (cls, d, fill = false) => `<svg class="ic${cls ? ` ${cls}` : ''}${fill ? ' ic--fill' : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;

export const icon = {
  phone: svg('', '<path d="M6.6 3h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.8 6.8l1.4-2 4.2 1.4v2.6A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z"/>'),
  mail: svg('', '<path d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  pin: svg('', '<path d="M12 21s6.5-6.2 6.5-11.2a6.5 6.5 0 0 0-13 0C5.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>'),
  arrow: svg('ic--arrow', '<path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/>'),
  out: svg('ic--out', '<path d="M8 6h10v10M18 6 6 18"/>'),
  menu: svg('', '<path d="M4 7h16M4 12h16M4 17h16"/>'),
  chevron: svg('ic--chev', '<path d="M6 9.5l6 6 6-6"/>'),
  whatsapp: svg('ic--wa', '<path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2z"/><path d="M9 8.2c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7c-.1.1-.2.3 0 .5.4.7 1.6 2 3 2.6.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.3.3.3.5 0 .6-.3 1.6-1.6 1.9-1 .2-2.7-.2-4.6-1.8-1.6-1.4-2.6-3.1-2.8-3.9-.3-1.1.2-2.1.6-2.7z"/>'),
  check: svg('', '<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>'),
  clock: svg('', '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  star: svg('ic--star', '<path d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z"/>', true),
};

// Marca «G» de Google para atribuir las reseñas a su fuente (colores oficiales).
export const googleG = `<svg class="gmark" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
