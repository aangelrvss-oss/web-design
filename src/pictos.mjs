// Dibujos auxiliares en el mismo lenguaje de plano técnico.

// Primer plano del hero: un tramo de tubería con dos codos y una llave de
// corte de bola. Se dibuja con dos trazos (contorno y alma) para dar volumen.
export const heroPipe = `<svg class="pipe" viewBox="0 0 900 520" aria-hidden="true" focusable="false">
  <g class="pipe__run">
    <path class="pipe__out" d="M-40 430H300q40 0 40-40V250q0-40 40-40H960"/>
    <path class="pipe__in" d="M-40 430H300q40 0 40-40V250q0-40 40-40H960"/>
    <path class="pipe__hi" d="M-40 420H296q34 0 34-34V246q0-34 34-34H960"/>
  </g>
  <g class="pipe__joint"><rect x="120" y="404" width="26" height="52" rx="4"/><rect x="314" y="300" width="52" height="26" rx="4"/><rect x="760" y="184" width="26" height="52" rx="4"/></g>
  <g class="valve">
    <path class="valve__body" d="M520 176h96l14 18v32l-14 18h-96l-14-18v-32z"/>
    <path class="valve__nut" d="M546 176v-22h44v22"/>
    <rect class="valve__stem" x="560" y="128" width="16" height="28" rx="3"/>
    <path class="valve__lever" d="M552 120h214q14 0 14 14v4q0 14-14 14H552q-10 0-10-10v-12q0-10 10-10z"/>
  </g>
</svg>`;

export const picto = {
  house: `<svg viewBox="0 0 240 160" aria-hidden="true" focusable="false"><path d="M30 150V70L120 18l90 52v80M14 150h212M30 70h180M98 150v-46h44v46M50 92h30v26H50zM160 92h30v26h-30z"/><path class="acc" d="M64 150v-12h112v12M120 130v-12"/></svg>`,
  shop: `<svg viewBox="0 0 240 160" aria-hidden="true" focusable="false"><path d="M24 150V46h192v104M10 150h220M24 46l14-28h164l14 28M24 46q16 18 32 0q16 18 32 0q16 18 32 0q16 18 32 0q16 18 32 0q16 18 32 0M44 150V86h60v64M126 86h70v40h-70z"/><path class="acc" d="M136 30h50"/></svg>`,
  plant: `<svg viewBox="0 0 240 160" aria-hidden="true" focusable="false"><path d="M14 150V78l52-30v30l52-30v30l52-30v102M170 150V30h22v120M10 150h222M36 104h22v22H36zM88 104h22v22H88zM140 104h22v22h-22z"/><path class="acc" d="M192 52h30v30h-30"/></svg>`,
  build: `<svg viewBox="0 0 240 160" aria-hidden="true" focusable="false"><path d="M40 150V60h100v90M40 90h100M40 120h100M73 60v90M107 60v90M10 150h220M170 150V18M150 18h80M170 18l40 30M224 18v38"/><path class="acc" d="M224 56v18"/></svg>`,
};

export const icon = {
  phone: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 3h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.8 6.8l1.4-2 4.2 1.4v2.6A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z"/></svg>`,
  mail: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5"/></svg>`,
  pin: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s6.5-6.2 6.5-11.2a6.5 6.5 0 0 0-13 0C5.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/></svg>`,
  clock: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`,
  arrow: `<svg class="ic ic--arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></svg>`,
  menu: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  chevron: `<svg class="ic ic--chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9.5l6 6 6-6"/></svg>`,
  doc: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/></svg>`,
};
