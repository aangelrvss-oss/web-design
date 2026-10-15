import { icon } from './icons';
import { formatNum, formatTime } from '../core/math';
import type { Rarity, UpgradeDef } from '../data/upgrades';

/** Escape for text interpolated into HTML templates. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface HudState {
  hp: number;
  maxHp: number;
  level: number;
  xpFrac: number;
  time: number;
  nextLabel: string;
  score: number;
  kills: number;
  combo: number;
  comboMult: number;
  dashFrac: number; // 1 = ready
  od: number; // 0..100
  odActive: boolean;
  weapons: Array<{ id: string; icon: string; level: number; cd: number }>;
  synergies: Array<{ icon: string; name: string }>;
  lowHp: boolean;
  fps: number | null;
}

export interface OfferView {
  def: UpgradeDef;
  nextLevel: number;
  isNew: boolean;
  text: string;
  /** For synergies: which owned upgrades enabled it. */
  combo?: string;
}

type Btn = { label: string; cls?: string; key?: string; action: () => void; id?: string };

/**
 * DOM interface layer: menus, HUD, upgrade cards, overlays. Built once; screens toggle.
 * Real <button>s give keyboard + screen-reader support for free; arrow keys move focus.
 */
export class UI {
  readonly root = document.getElementById('ui')!;
  private screens = new Map<string, HTMLElement>();
  private current: string | null = null;
  private backAction: (() => void) | null = null;
  private cardHandler: ((i: number) => void) | null = null;
  private extraKeys: Record<string, () => void> = {};
  private hudEl!: HTMLElement;
  private hudRefs: Record<string, HTMLElement> = {};
  private lastHud: Partial<Record<string, string>> = {};
  private hurtEl = document.querySelector<HTMLElement>('.hurt-vignette')!;
  private odEl = document.querySelector<HTMLElement>('.overdrive-tint')!;
  private announceEl!: HTMLElement;
  private toastsEl!: HTMLElement;
  private bossEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private lastCombo = 0;
  private introUntil = 0;
  onUiSound: (k: 'uiMove' | 'uiClick') => void = () => {};

  constructor() {
    this.buildHud();
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  // ── screens ──────────────────────────────────────────────────────────────
  private screen(name: string, html: string, cls = ''): HTMLElement {
    let el = this.screens.get(name);
    if (!el) {
      el = document.createElement('div');
      el.className = 'screen hidden';
      el.dataset.screen = name;
      this.root.appendChild(el);
      this.screens.set(name, el);
    }
    el.className = `screen ${cls}`;
    el.innerHTML = html;
    return el;
  }

  show(name: string, html: string, opts: { cls?: string; back?: (() => void) | null; focus?: string } = {}): HTMLElement {
    this.hideScreens();
    this.clearOverlays();
    const el = this.screen(name, html, opts.cls);
    this.current = name;
    this.backAction = opts.back ?? null;
    this.cardHandler = null;
    this.extraKeys = {};
    el.querySelectorAll<HTMLElement>('button').forEach((b) => b.addEventListener('click', () => this.onUiSound('uiClick')));
    requestAnimationFrame(() => {
      const f = (opts.focus && el.querySelector<HTMLElement>(opts.focus)) || el.querySelector<HTMLElement>('[data-autofocus], button:not([disabled])');
      f?.focus({ preventScroll: true });
    });
    return el;
  }

  hideScreens() {
    for (const el of this.screens.values()) el.classList.add('hidden');
    this.current = null;
    this.backAction = null;
    this.cardHandler = null;
    this.extraKeys = {};
  }

  get modalOpen() {
    return this.current !== null;
  }

  private buttons(btns: Btn[], wrap = 'row'): string {
    return `<div class="${wrap}">${btns.map((b, i) => `<button class="btn ${b.cls ?? ''}" data-b="${i}" ${b.id ? `id="${b.id}"` : ''}>${esc(b.label)}${b.key ? ` <span class="key">${esc(b.key)}</span>` : ''}</button>`).join('')}</div>`;
  }

  private wire(el: HTMLElement, btns: Btn[]) {
    el.querySelectorAll<HTMLButtonElement>('[data-b]').forEach((b) => {
      const i = Number(b.dataset.b);
      b.addEventListener('click', () => btns[i].action());
    });
  }

  private onKey(e: KeyboardEvent) {
    if (!this.current) return;
    const el = this.screens.get(this.current);
    if (!el) return;
    // a menu owns the keyboard: keep presses from leaking into gameplay input
    e.stopImmediatePropagation();
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      if (this.backAction) {
        e.preventDefault();
        this.backAction();
      }
      return;
    }
    if (this.cardHandler && /^[1-3]$/.test(k)) {
      e.preventDefault();
      this.cardHandler(Number(k) - 1);
      return;
    }
    if (this.extraKeys[k]) {
      e.preventDefault();
      this.extraKeys[k]();
      return;
    }
    const focusables = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]')].filter((x) => x.offsetParent !== null);
    if (!focusables.length) return;
    const idx = focusables.indexOf(document.activeElement as HTMLElement);
    const isRange = (document.activeElement as HTMLInputElement)?.type === 'range';
    const next = ['arrowdown', 'arrowright', 's', 'd'].includes(k);
    const prev = ['arrowup', 'arrowleft', 'w', 'a'].includes(k);
    if (isRange && (k === 'arrowleft' || k === 'arrowright')) return; // let sliders work
    if (next || prev) {
      e.preventDefault();
      const n = idx < 0 ? 0 : (idx + (next ? 1 : -1) + focusables.length) % focusables.length;
      focusables[n].focus();
      this.onUiSound('uiMove');
    } else if ((k === 'enter' || k === ' ') && idx >= 0) {
      const t = focusables[idx];
      if (t.tagName === 'BUTTON') {
        e.preventDefault();
        t.click();
      } else if ((t as HTMLInputElement).type === 'checkbox') {
        e.preventDefault();
        t.click();
      }
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  private buildHud() {
    const hud = document.createElement('div');
    hud.className = 'hud hidden';
    hud.innerHTML = `
      <div class="xpbar"><i data-r="xp"></i></div>
      <div class="top">
        <div>
          <div class="hp">
            <div class="lvl"><div><small>LV</small><span data-r="lvl">1</span></div></div>
            <div class="hpbar" role="meter" aria-label="Health"><b data-r="hpLag"></b><i data-r="hp"></i><span data-r="hpText">100</span></div>
          </div>
        </div>
        <div class="clock"><div class="t mono" data-r="time">0:00</div><div class="next" data-r="next"></div></div>
        <div class="scorebox">
          <div><div class="s mono" data-r="score">0</div><div class="k mono" data-r="kills">0 kills</div><div class="combo" data-r="combo"></div></div>
          <button class="icon-btn pausebtn" data-r="pause" aria-label="Pause">${icon('pause')}</button>
        </div>
      </div>
      <div class="bossbar hidden" data-r="boss"><div class="name" data-r="bossName"></div><div class="bar"><i data-r="bossHp"></i><b style="left:50%" data-r="bossMark1"></b><b class="hidden" style="left:33%" data-r="bossMark2"></b></div><div class="cap" data-r="bossCap"></div></div>
      <div class="bottom">
        <div class="weapons" data-r="weapons"></div>
        <div class="meters">
          <div class="meter dash"><i data-r="dash"></i><span>DASH<span class="kb"> · SPACE</span></span></div>
          <div class="meter od" data-r="odBox"><i data-r="od"></i><span data-r="odText">OVERDRIVE</span></div>
        </div>
        <div class="spacer"></div>
      </div>
      <div class="fps hidden" data-r="fps"></div>
      <div class="hint hidden" data-r="hint"></div>`;
    this.root.appendChild(hud);
    this.hudEl = hud;
    hud.querySelectorAll<HTMLElement>('[data-r]').forEach((el) => { this.hudRefs[el.dataset.r!] = el; });
    this.announceEl = document.createElement('div');
    this.announceEl.className = 'announce';
    this.root.appendChild(this.announceEl);
    this.toastsEl = document.createElement('div');
    this.toastsEl.className = 'toasts';
    this.root.appendChild(this.toastsEl);
    this.bossEl = document.createElement('div');
    this.bossEl.className = 'bossintro hidden';
    this.root.appendChild(this.bossEl);
    this.hintEl = this.hudRefs.hint;
  }

  onPause(fn: () => void) {
    this.hudRefs.pause.onclick = fn;
  }

  showHud(on: boolean) {
    this.hudEl.classList.toggle('hidden', !on);
    if (!on) {
      this.setLowHp(false);
      this.setOverdrive(false);
      this.bossBar(null);
      this.hintEl.classList.add('hidden');
    }
    this.lastHud = {};
  }

  private set(key: string, value: string, prop: 'text' | 'width' | 'transform' = 'text') {
    if (this.lastHud[key] === value) return;
    this.lastHud[key] = value;
    const el = this.hudRefs[key];
    if (prop === 'text') el.textContent = value;
    else if (prop === 'width') el.style.width = value;
    else el.style.transform = value;
  }

  updateHud(s: HudState) {
    const hpPct = `${Math.max(0, (s.hp / s.maxHp) * 100).toFixed(1)}%`;
    this.set('hp', hpPct, 'width');
    this.set('hpLag', hpPct, 'width');
    this.set('hpText', `${Math.ceil(Math.max(0, s.hp))} / ${s.maxHp}`);
    this.set('lvl', String(s.level));
    this.set('xp', `${(s.xpFrac * 100).toFixed(1)}%`, 'width');
    this.set('time', formatTime(s.time));
    this.set('next', s.nextLabel);
    this.set('score', formatNum(s.score));
    this.set('kills', `${formatNum(s.kills)} kills`);
    const comboEl = this.hudRefs.combo;
    if (s.combo >= 5) {
      const comboHtml = `${s.combo} COMBO <span class="mult">×${s.comboMult.toFixed(2)}</span>`;
      if (this.lastHud.combo !== comboHtml) {
        this.lastHud.combo = comboHtml;
        comboEl.innerHTML = comboHtml;
      }
      comboEl.classList.add('on');
      if (Math.floor(s.combo / 25) !== Math.floor(this.lastCombo / 25)) {
        comboEl.classList.remove('bump');
        void comboEl.offsetWidth;
        comboEl.classList.add('bump');
      }
    } else comboEl.classList.remove('on');
    this.lastCombo = s.combo;
    this.set('dash', `${(s.dashFrac * 100).toFixed(0)}%`, 'width');
    this.set('od', `${s.od.toFixed(0)}%`, 'width');
    const box = this.hudRefs.odBox;
    box.classList.toggle('ready', s.od >= 100 && !s.odActive);
    box.classList.toggle('active', s.odActive);
    this.set('odText', s.odActive ? 'OVERDRIVE!!' : s.od >= 100 ? (document.documentElement.classList.contains('is-touch') ? 'OVERDRIVE READY · TAP OD' : 'OVERDRIVE READY · E') : 'OVERDRIVE');
    const wkey = s.weapons.map((w) => `${w.id}${w.level}`).join() + '|' + s.synergies.map((x) => x.name).join();
    if (this.lastHud.weapons !== wkey) {
      this.lastHud.weapons = wkey;
      this.hudRefs.weapons.innerHTML =
        s.weapons.map((w) => `<div class="wpn" data-w="${w.id}">${icon(w.icon)}<div class="cd"></div><span class="lv">${w.level}</span></div>`).join('') +
        s.synergies.map((x) => `<div class="wpn syn" title="${esc(x.name)}">${icon(x.icon)}</div>`).join('');
    }
    for (const w of s.weapons) {
      const cd = this.hudRefs.weapons.querySelector<HTMLElement>(`[data-w="${w.id}"] .cd`);
      if (cd) cd.style.transform = `scaleY(${w.cd.toFixed(2)})`;
    }
    this.setLowHp(s.lowHp);
    this.setOverdrive(s.odActive);
    const fps = this.hudRefs.fps;
    fps.classList.toggle('hidden', s.fps === null);
    if (s.fps !== null) this.set('fps', `${s.fps.toFixed(0)} FPS`);
  }

  setLowHp(on: boolean) {
    this.hurtEl.classList.toggle('low', on);
  }

  hurtFlash() {
    this.hurtEl.classList.add('hit');
    requestAnimationFrame(() => requestAnimationFrame(() => this.hurtEl.classList.remove('hit')));
  }

  setOverdrive(on: boolean) {
    this.odEl.classList.toggle('on', on);
  }

  bossBar(state: { name: string; frac: number; marks: number[] } | null) {
    const el = this.hudRefs.boss;
    if (!state) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    this.set('bossName', state.name);
    this.set('bossHp', `${(state.frac * 100).toFixed(1)}%`, 'width');
    this.hudRefs.bossMark1.style.left = `${(state.marks[0] ?? 0.5) * 100}%`;
    const m2 = this.hudRefs.bossMark2;
    m2.classList.toggle('hidden', state.marks.length < 2);
    if (state.marks[1]) m2.style.left = `${state.marks[1] * 100}%`;
  }

  caption(text: string) {
    this.hudRefs.bossCap.textContent = text;
  }

  announce(text: string, kind: 'info' | 'warn' | 'boss' | 'hype' = 'info') {
    // the boss title card owns the centre of the screen while it is up
    if (performance.now() < this.introUntil && kind !== 'boss') return;
    const a = document.createElement('div');
    a.className = `a ${kind}`;
    a.textContent = text;
    this.announceEl.replaceChildren(a);
    setTimeout(() => a.remove(), 2300);
  }

  /** Drop transient centre-screen text (announcer, boss card) so it never sits over a menu. */
  clearOverlays() {
    this.announceEl.replaceChildren();
    this.bossEl.classList.add('hidden');
    this.introUntil = 0;
  }

  bossIntro(name: string, subtitle: string) {
    this.announceEl.replaceChildren();
    this.bossEl.classList.remove('hidden');
    this.introUntil = performance.now() + 2600;
    this.bossEl.innerHTML = `<div class="bi"><div class="warn">⚠ WARNING ⚠</div><h2 class="display">${esc(name)}</h2><p>${esc(subtitle)}</p><div class="stripe"></div></div>`;
    setTimeout(() => this.bossEl.classList.add('hidden'), 2600);
  }

  toast(title: string, text: string) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`;
    this.toastsEl.appendChild(t);
    setTimeout(() => t.remove(), 3700);
  }

  hints(items: Array<{ id: string; html: string; done: boolean }> | null) {
    if (!items) {
      this.hintEl.classList.add('hidden');
      return;
    }
    this.hintEl.classList.remove('hidden');
    const key = items.map((i) => i.id + i.done).join();
    if (this.lastHud.hints === key) return;
    this.lastHud.hints = key;
    this.hintEl.innerHTML = items.map((i) => `<div class="h ${i.done ? 'done' : ''}">${i.html}</div>`).join('');
  }

  // ── level-up ─────────────────────────────────────────────────────────────
  levelUp(opts: {
    title: string;
    kicker: string;
    crate: boolean;
    offers: OfferView[];
    rerolls: number;
    onPick: (i: number) => void;
    onReroll: () => void;
  }) {
    const RAR: Record<Rarity, string> = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
    const cards = opts.offers.map((o, i) => {
      const d = o.def;
      const kindLabel = d.kind === 'synergy' ? 'SYNERGY' : d.kind === 'cursed' ? 'CURSED' : d.kind === 'weapon' && o.isNew ? 'NEW WEAPON' : '';
      const max = d.maxStacks > 50 ? 0 : d.maxStacks;
      const pips = max > 1 ? `<div class="pips">${Array.from({ length: max }, (_, k) => `<i class="${k < o.nextLevel - 1 ? 'on' : k === o.nextLevel - 1 ? 'new' : ''}"></i>`).join('')}</div>` : '';
      return `<button class="card ${d.rarity}" data-card="${i}" aria-label="${esc(d.name)}: ${esc(o.text)}">
        ${kindLabel ? `<span class="tag">${kindLabel}</span>` : ''}
        <span class="num">${i + 1}</span>
        <div class="top"><div class="badge">${icon(d.icon)}</div><div class="meta"><span class="rar">${RAR[d.rarity]}${d.kind === 'weapon' ? ' · Weapon' : ''}</span><h3>${esc(d.name)}</h3>${pips}</div></div>
        <div class="desc">${esc(o.text)}</div>
        ${o.combo ? `<div class="req">Combo: ${esc(o.combo)}</div>` : ''}
        <div class="tags">${d.tags.map((t) => `<span>${t}</span>`).join('')}</div>
        <div class="flavor">“${esc(d.flavor)}”</div>
      </button>`;
    }).join('');
    const el = this.show('levelup', `
      <header><div class="kicker">${esc(opts.kicker)}</div><h2 class="display">${esc(opts.title)}</h2></header>
      <div class="cards">${cards}</div>
      <div class="actions"><button class="btn ghost small" data-reroll ${opts.rerolls <= 0 ? 'disabled' : ''}>Reroll (${opts.rerolls}) <span class="key">R</span></button></div>`,
    { cls: `dim levelup ${opts.crate ? 'crate' : ''}`, focus: '[data-card="0"]' });
    let picked = false;
    const pick = (i: number) => {
      if (picked || i >= opts.offers.length) return;
      picked = true;
      opts.onPick(i);
    };
    el.querySelectorAll<HTMLButtonElement>('[data-card]').forEach((b) => b.addEventListener('click', () => pick(Number(b.dataset.card))));
    el.querySelector<HTMLButtonElement>('[data-reroll]')!.addEventListener('click', () => { if (!picked && opts.rerolls > 0) opts.onReroll(); });
    this.cardHandler = pick;
    this.extraKeys = { r: () => { if (!picked && opts.rerolls > 0) opts.onReroll(); } };
  }

  // ── generic dialog ───────────────────────────────────────────────────────
  dialog(name: string, inner: string, btns: Btn[], opts: { cls?: string; back?: () => void; panelCls?: string } = {}) {
    const el = this.show(name, `<div class="panel ${opts.panelCls ?? ''}">${inner}${this.buttons(btns, 'stack')}</div>`, { cls: `dim ${opts.cls ?? ''}`, back: opts.back });
    this.wire(el, btns);
    return el;
  }

  setKeys(keys: Record<string, () => void>) {
    this.extraKeys = keys;
  }

  setBack(fn: (() => void) | null) {
    this.backAction = fn;
  }

  static esc = esc;
}

export const ui = new UI();
export { esc };
