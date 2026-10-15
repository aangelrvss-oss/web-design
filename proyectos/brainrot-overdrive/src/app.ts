import Phaser from 'phaser';
import { audio } from './audio/audio';
import { input } from './core/input';
import { formatNum, formatTime } from './core/math';
import { hash32 } from './core/rng';
import { defaultSave, loadSave, writeSave, type SaveData, type Settings } from './core/save';
import { ACHIEVEMENTS } from './data/achievements';
import { CHARACTERS, CHARACTER_BY_ID, type CharacterId } from './data/characters';
import { BOSSES } from './data/enemies';
import { DEATH_QUIPS, runTitle } from './data/text';
import { UPGRADE_BY_ID, UPGRADES } from './data/upgrades';
import { WEAPONS, WEAPON_IDS } from './data/weapons';
import { RES } from './art/textures';
import { dailySpec, localDateKey, msUntilNextDaily } from './logic/daily';
import { finalScore, grade, topWeapon, type RunStats } from './logic/runStats';
import { setAppHooks, type GameScene, type RunConfig, type RunResult } from './scenes/GameScene';
import { icon } from './ui/icons';
import { TouchControls } from './ui/touch';
import { esc, ui } from './ui/ui';

/**
 * The shell: menus, persistence, run lifecycle. Phaser scenes only run gameplay and
 * backdrops; everything that survives between runs lives here.
 */
export class App {
  save: SaveData = loadSave();
  private touch: TouchControls;
  private lastConfig: RunConfig | null = null;
  private resetArmed = false;

  constructor(private readonly game: Phaser.Game) {
    this.touch = new TouchControls(ui.root);
    ui.onUiSound = (k) => audio.play(k);
    audio.apply(this.save.settings);
    this.applyVisualSettings();
    setAppHooks({
      settings: () => this.save.settings,
      seenTutorial: () => this.save.seenTutorial,
      markTutorialSeen: () => {
        this.save.seenTutorial = true;
        this.persist();
      },
      onRunEnd: (r) => this.onRunEnd(r),
      openPause: () => this.showPause(),
    });
    // first real gesture unlocks audio (browser autoplay policy)
    const unlock = () => {
      audio.unlock();
      audio.music.start(this.gameScene()?.scene.isActive() ? 1 : 0);
    };
    window.addEventListener('pointerdown', unlock, { once: false, passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') input.usedTouch = true; }, { passive: true });
    if (matchMedia('(pointer: coarse)').matches) input.usedTouch = true;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const g = this.gameScene();
        if (g && this.isPlaying() && !g.isModal && !g.isOver) g.requestPause();
        audio.suspend();
      } else audio.resume();
    });
    window.addEventListener('blur', () => {
      const g = this.gameScene();
      if (g && this.isPlaying() && !g.isModal && !g.isOver) g.requestPause();
    });
  }

  private gameScene(): GameScene | null {
    return (this.game.scene.getScene('Game') as unknown as GameScene) ?? null;
  }

  private isPlaying() {
    const s = this.game.scene.getScene('Game');
    return !!s && (s.scene.isActive() || s.scene.isPaused());
  }

  persist() {
    writeSave(this.save);
  }

  private applyVisualSettings() {
    document.documentElement.classList.toggle('reduced', this.save.settings.reducedMotion);
  }

  private unlocked(c: CharacterId) {
    const def = CHARACTER_BY_ID[c];
    return !def.unlock || this.save.achievements.includes(def.unlock.achievement);
  }

  // ── menu ─────────────────────────────────────────────────────────────────
  showMenu() {
    this.touch.show(false);
    ui.showHud(false);
    if (this.isPlaying()) this.game.scene.stop('Game');
    if (!this.game.scene.isActive('Menu')) this.game.scene.start('Menu');
    audio.music.setIntensity(0);
    audio.music.duck(false);
    const r = this.save.records;
    const today = localDateKey();
    const daily = dailySpec(today);
    const dailyBest = this.save.daily[today];
    const left = msUntilNextDaily();
    const hh = Math.floor(left / 3_600_000), mm = Math.floor((left % 3_600_000) / 60_000);
    const el = ui.show('menu', `
      <div class="logo display" aria-label="Brainrot Overdrive"><span class="l1">Brainrot</span><span class="l2">${'OVERDRIVE'.split('').map((c) => `<span>${c}</span>`).join('')}</span></div>
      <p class="tagline">You are an NPC who gained sentience mid-scroll. The feed wants you back. Survive 8 minutes, beat The Algorithm, log off.</p>
      <div class="menu-actions">
        <button class="btn primary" data-a="play" data-autofocus>Play</button>
        <button class="btn gold" data-a="daily">Daily · ${esc(daily.modifier.name)}</button>
        <div class="daily-meta">${esc(CHARACTER_BY_ID[daily.character].name)} · ${dailyBest ? `today's best ${formatNum(dailyBest)}` : 'not played today'} · new in ${hh}h ${mm}m</div>
        <div class="menu-sub">
          <button class="btn ghost" data-a="records">Records</button>
          <button class="btn ghost" data-a="settings">Settings</button>
          <button class="btn ghost" data-a="how">How to</button>
        </div>
      </div>
      ${r.runs > 0 ? `<div class="best-line">Best <b>${formatNum(r.bestScore)}</b> · longest ${formatTime(r.bestTime)} · ${r.runs} run${r.runs === 1 ? '' : 's'}</div>` : ''}
      <div class="corner left">Original game · no tracking · progress saved on this device</div>
      <div class="corner right">v1.0</div>`, { cls: 'menu' });
    el.querySelector('[data-a=play]')!.addEventListener('click', () => this.playFlow());
    el.querySelector('[data-a=daily]')!.addEventListener('click', () => this.startRun({ character: daily.character, seed: daily.seed, daily }));
    el.querySelector('[data-a=records]')!.addEventListener('click', () => this.showRecords());
    el.querySelector('[data-a=settings]')!.addEventListener('click', () => this.showSettings(() => this.showMenu()));
    el.querySelector('[data-a=how]')!.addEventListener('click', () => this.showHowTo());
  }

  private playFlow() {
    const available = CHARACTERS.filter((c) => this.unlocked(c.id));
    if (available.length <= 1 && this.save.records.runs === 0) this.startRun(this.freshConfig('npc'));
    else this.showCharacters();
  }

  private freshConfig(character: CharacterId): RunConfig {
    return { character, seed: hash32(`${Date.now()}:${Math.random()}`), daily: null };
  }

  private portrait(key: string): string {
    const src = this.game.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const c = document.createElement('canvas');
    c.width = 44 * RES;
    c.height = 52 * RES;
    c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height, 0, 0, c.width, c.height);
    return c.toDataURL();
  }

  showCharacters() {
    const last = this.save.lastCharacter as CharacterId;
    const el = ui.show('chars', `
      <div class="stack" style="align-items:center;width:100%">
        <div class="kicker">Choose your main character</div>
        <div class="chars">${CHARACTERS.map((c) => {
          const ok = this.unlocked(c.id);
          return `<button class="char ${ok ? '' : 'locked'}" data-c="${c.id}" style="--c:${c.accent}" ${ok ? '' : 'aria-disabled="true"'}>
            <img alt="" src="${this.portrait(c.texture)}">
            <h3>${esc(c.name)}</h3><p>${esc(c.tagline)}</p><div class="perk">${esc(c.perk)}</div>
            <div class="lockbar">${icon('lock')} ${esc(c.unlock?.hint ?? '')}</div>
          </button>`;
        }).join('')}</div>
        <button class="btn ghost small" data-back>Back <span class="key">ESC</span></button>
      </div>`, { cls: 'dim', back: () => this.showMenu(), focus: `[data-c="${this.unlocked(last) ? last : 'npc'}"]` });
    el.querySelectorAll<HTMLButtonElement>('[data-c]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.c as CharacterId;
      if (!this.unlocked(id)) {
        audio.play('deny');
        return;
      }
      this.save.lastCharacter = id;
      this.persist();
      this.startRun(this.freshConfig(id));
    }));
    el.querySelector('[data-back]')!.addEventListener('click', () => this.showMenu());
  }

  private showHowTo() {
    ui.dialog('how', `
      <div class="kicker">How to play</div><h2 class="display">Don't log off</h2>
      <div class="stack" style="gap:8px;font-size:15px">
        <div><b>Move</b> · WASD / arrows · left thumb on mobile</div>
        <div><b>Attack</b> · automatic. Your Clout Cannon fires at the mouse (or the nearest enemy with auto-aim / touch)</div>
        <div><b>Dash</b> · Space / Shift / right-click · you're invulnerable mid-dash</div>
        <div><b>Overdrive</b> · kill to fill the meter, then E for 7 seconds of double fire rate</div>
        <div><b>Level up</b> · grab XP gems, pick 1 of 3 upgrades. Certain pairs unlock <b style="color:var(--gold)">synergies</b> that change how your build plays</div>
        <div><b>Read the floor</b> · warm colours are danger. Outlined circles fill up, then explode. Lines become dashes and beams</div>
        <div><b>Goal</b> · The Doomscroller arrives at 4:00, The Algorithm at 8:00. Beat it to win</div>
        <div class="muted">Pause any time with Esc or P.</div>
      </div><div style="height:18px"></div>`, [{ label: 'Got it', action: () => this.showMenu() }], { back: () => this.showMenu() });
  }

  // ── run lifecycle ────────────────────────────────────────────────────────
  startRun(cfg: RunConfig) {
    audio.unlock();
    this.lastConfig = cfg;
    ui.hideScreens();
    this.game.scene.stop('Menu');
    const g = this.game.scene.getScene('Game');
    if (g && (g.scene.isActive() || g.scene.isPaused())) {
      g.scene.restart(cfg);
    } else this.game.scene.start('Game', cfg);
    this.touch.show(true);
  }

  private showPause() {
    const g = this.gameScene();
    if (!g) return;
    const s = g.buildSummary();
    const chips = [
      ...s.weapons.map((w) => `<span class="chip">${icon(w.icon)}${esc(w.name)} ${w.level}</span>`),
      ...s.passives.map((p) => `<span class="chip">${icon(p.icon)}${esc(p.name)} ${p.level}</span>`),
      ...s.syn.map((x) => `<span class="chip syn">${icon(x.icon)}${esc(x.name)}</span>`),
    ].join('');
    const resume = () => g.resumeFromPause();
    this.touch.show(false);
    ui.dialog('pause', `
      <div class="kicker">Paused · ${formatTime(s.time)} · level ${s.level} · ${s.kills} kills</div>
      <h2 class="display">Touching grass?</h2>
      <div class="build-list">${chips}</div>`, [
      { label: 'Resume', cls: 'primary', action: () => { resume(); this.touch.show(true); } },
      { label: 'Restart run', cls: 'ghost', action: () => { this.startRun(this.lastConfig?.daily ? this.lastConfig : this.freshConfig(this.lastConfig?.character ?? 'npc')); } },
      { label: 'Settings', cls: 'ghost', action: () => this.showSettings(() => this.showPause()) },
      { label: 'Quit to menu', cls: 'ghost', action: () => this.showMenu() },
    ], { panelCls: 'pause-panel', back: () => { resume(); this.touch.show(true); } });
  }

  private onRunEnd(r: RunResult) {
    this.touch.show(false);
    const s = r.stats;
    const score = finalScore(s, r.hpLeft);
    s.score = score;
    const rec = this.save.records;
    const best = {
      score: score > rec.bestScore,
      time: s.time > rec.bestTime,
      level: s.level > rec.bestLevel,
      kills: s.kills > rec.bestKills,
      combo: s.maxCombo > rec.bestCombo,
    };
    rec.bestScore = Math.max(rec.bestScore, score);
    rec.bestTime = Math.max(rec.bestTime, s.time);
    rec.bestLevel = Math.max(rec.bestLevel, s.level);
    rec.bestKills = Math.max(rec.bestKills, s.kills);
    rec.bestCombo = Math.max(rec.bestCombo, s.maxCombo);
    rec.runs++;
    rec.totalKills += s.kills;
    if (s.victory) rec.victories++;
    if (r.config.daily) {
      const k = r.config.daily.date;
      this.save.daily[k] = Math.max(this.save.daily[k] ?? 0, score);
    }
    const newly = ACHIEVEMENTS.filter((a) => !this.save.achievements.includes(a.id) && a.check(s, { totalKills: rec.totalKills, runs: rec.runs }));
    for (const a of newly) this.save.achievements.push(a.id);
    this.persist();
    this.showResults(r, score, best, newly.map((a) => ({ name: a.name, text: a.text, reward: a.reward })));
  }

  private showResults(r: RunResult, score: number, best: Record<string, boolean>, unlocks: Array<{ name: string; text: string; reward?: string }>) {
    const s = r.stats;
    const g = grade(s);
    const t = runTitle(s);
    const top = topWeapon(s);
    const weapons = WEAPON_IDS.filter((id) => (r.owned[id] ?? 0) > 0);
    const syn = UPGRADES.filter((u) => u.kind === 'synergy' && (r.owned[u.id] ?? 0) > 0);
    const headline = s.victory ? 'You logged off.' : DEATH_QUIPS[hash32(`${s.time}:${s.kills}`) % DEATH_QUIPS.length];
    const cause = s.victory ? `Defeated ${BOSSES.algorithm.name}.` : `Taken out by ${r.cause} at ${formatTime(s.time)}.`;
    const stat = (label: string, value: string, isBest = false, cls = '') => `<div class="stat ${isBest ? 'best' : ''} ${cls}"><b class="mono">${value}</b><span>${label}</span></div>`;
    const totalDmg = Math.max(1, s.damageDealt);
    const el = ui.show('results', `
      <div class="panel results">
        <div class="kicker">${s.victory ? 'Victory' : 'Run over'}${r.config.daily ? ` · Daily ${esc(r.config.daily.date)}` : ''}</div>
        <div class="grade-row">
          <div class="grade ${g}" aria-label="Grade ${g}">${g}</div>
          <div><div class="muted">${esc(headline)}</div><div class="title display">${esc(t.title)}</div><div class="why">${esc(t.reason)} ${esc(cause)}</div></div>
        </div>
        <div class="statgrid">
          ${stat('Score', formatNum(score), best.score, 'score')}
          ${stat('Time', formatTime(s.time), best.time)}
          ${stat('Level', String(s.level), best.level)}
          ${stat('Kills', formatNum(s.kills), best.kills)}
          ${stat('Best combo', String(s.maxCombo), best.combo)}
          ${stat('Crits', formatNum(s.crits))}
          ${stat('Damage', formatNum(s.damageDealt))}
          ${stat('Overdrives', String(s.overdrives))}
        </div>
        <div class="kicker" style="color:var(--muted)">Build</div>
        <div class="build-list">
          ${weapons.map((id) => `<span class="chip">${icon(UPGRADE_BY_ID[id].icon)}${esc(WEAPONS[id].name)} ${r.owned[id]}${s.weaponDamage[id] ? ` · ${Math.round(((s.weaponDamage[id] ?? 0) / totalDmg) * 100)}%` : ''}</span>`).join('')}
          ${syn.map((u) => `<span class="chip syn">${icon(u.icon)}${esc(u.name)}</span>`).join('')}
        </div>
        ${unlocks.length ? `<div class="unlocks">${unlocks.map((u) => `<div class="unlock"><b>Achievement</b>${esc(u.name)} — ${esc(u.text)}${u.reward ? ` <b style="margin-left:6px">${esc(u.reward)}</b>` : ''}</div>`).join('')}</div>` : ''}
        <div class="row">
          <button class="btn primary" data-a="retry" data-autofocus>${r.config.daily ? 'Retry daily' : 'Run it back'} <span class="key">R</span></button>
          <button class="btn" data-a="share">Share</button>
          <button class="btn ghost" data-a="menu">Menu</button>
        </div>
        <div class="share-status" role="status" aria-live="polite"></div>
      </div>`, { cls: 'dim', back: () => this.showMenu() });
    const retry = () => this.startRun(r.config.daily ? r.config : this.freshConfig(r.config.character));
    el.querySelector('[data-a=retry]')!.addEventListener('click', retry);
    el.querySelector('[data-a=menu]')!.addEventListener('click', () => this.showMenu());
    el.querySelector('[data-a=share]')!.addEventListener('click', () => void this.share(el, s, score, t.title, top));
    ui.setKeys({ r: retry });
  }

  private async share(el: HTMLElement, s: RunStats, score: number, title: string, top: string | null) {
    const status = el.querySelector<HTMLElement>('.share-status')!;
    const syn = s.synergies.map((id) => UPGRADE_BY_ID[id]?.name).filter(Boolean);
    const text = [
      `BRAINROT OVERDRIVE — “${title}” (${grade(s)})`,
      `${formatNum(score)} pts · ${formatTime(s.time)} · lvl ${s.level} · ${formatNum(s.kills)} kills · best combo ${s.maxCombo}`,
      top ? `Carried by ${WEAPONS[top as keyof typeof WEAPONS]?.name ?? top}${syn.length ? ` + ${syn.join(', ')}` : ''}` : '',
      s.victory ? 'I beat The Algorithm. I logged off.' : '',
    ].filter(Boolean).join('\n');
    status.classList.remove('err');
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: 'BRAINROT OVERDRIVE', text });
        status.textContent = 'Shared.';
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') {
          status.textContent = 'Share cancelled.';
          return;
        }
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Result copied to clipboard.';
    } catch {
      status.classList.add('err');
      status.innerHTML = `Couldn't access the clipboard. Copy it manually:<br><textarea readonly rows="4" style="width:100%;margin-top:6px;background:var(--panel);color:var(--text);border:2px solid var(--line);border-radius:8px;padding:8px;font:13px var(--body)">${esc(text)}</textarea>`;
      status.querySelector('textarea')?.select();
    }
  }

  // ── records ──────────────────────────────────────────────────────────────
  private showRecords() {
    const r = this.save.records;
    const days = Object.entries(this.save.daily).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
    ui.dialog('records', `
      <div class="kicker">Personal records · this device</div><h2 class="display">Receipts</h2>
      <div class="statgrid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat"><b>${formatNum(r.bestScore)}</b><span>Best score</span></div>
        <div class="stat"><b>${formatTime(r.bestTime)}</b><span>Longest run</span></div>
        <div class="stat"><b>${r.bestLevel}</b><span>Best level</span></div>
        <div class="stat"><b>${r.bestCombo}</b><span>Best combo</span></div>
        <div class="stat"><b>${formatNum(r.totalKills)}</b><span>Total kills</span></div>
        <div class="stat"><b>${r.victories}/${r.runs}</b><span>Wins / runs</span></div>
      </div>
      ${days.length ? `<div class="kicker" style="color:var(--muted)">Daily bests</div><div class="build-list">${days.map(([d, v]) => `<span class="chip">${esc(d)} · ${formatNum(v)}</span>`).join('')}</div>` : ''}
      <div class="kicker" style="color:var(--muted);margin-top:8px">Achievements ${this.save.achievements.length}/${ACHIEVEMENTS.length}</div>
      <div>${ACHIEVEMENTS.map((a) => {
        const got = this.save.achievements.includes(a.id);
        return `<div class="ach ${got ? 'got' : ''}"><div class="dot">${icon(got ? 'crown' : 'lock')}</div><div><b>${esc(a.name)}</b><span>${esc(a.text)}</span>${a.reward ? ` <em>${esc(a.reward)}</em>` : ''}</div></div>`;
      }).join('')}</div><div style="height:16px"></div>`,
    [{ label: 'Back', action: () => this.showMenu() }], { back: () => this.showMenu(), panelCls: 'scroll-panel' });
  }

  // ── settings ─────────────────────────────────────────────────────────────
  private showSettings(back: () => void) {
    const s = this.save.settings;
    const range = (k: keyof Settings, label: string, hint = '') =>
      `<div class="setting"><label for="set-${k}">${label}${hint ? `<small>${hint}</small>` : ''}</label><input id="set-${k}" type="range" min="0" max="100" step="5" value="${Math.round((s[k] as number) * 100)}" data-k="${k}"></div>`;
    const toggle = (k: keyof Settings, label: string, hint = '') =>
      `<div class="setting"><label for="set-${k}">${label}${hint ? `<small>${hint}</small>` : ''}</label><input id="set-${k}" class="toggle" type="checkbox" ${s[k] ? 'checked' : ''} data-k="${k}"></div>`;
    const seg = (k: keyof Settings, label: string, opts: string[], hint = '') =>
      `<div class="setting"><label>${label}${hint ? `<small>${hint}</small>` : ''}</label><div class="seg" role="group" aria-label="${label}">${opts.map((o) => `<button aria-pressed="${s[k] === o}" data-seg="${k}" data-v="${o}">${o}</button>`).join('')}</div></div>`;
    const el = ui.dialog('settings', `
      <div class="kicker">Settings</div><h2 class="display">Vibe check</h2>
      ${toggle('muted', 'Mute all')}
      ${range('master', 'Master volume')}
      ${range('music', 'Music')}
      ${range('sfx', 'Sound effects')}
      ${range('shake', 'Screen shake')}
      ${seg('intensity', 'Visual intensity', ['low', 'medium', 'high'], 'Particles, damage numbers, crowd size')}
      ${toggle('reducedMotion', 'Reduced motion', 'No shake, softer flashes, calmer menus')}
      ${seg('aim', 'Aiming', ['mouse', 'auto'], 'Touch always uses auto-aim')}
      ${toggle('damageNumbers', 'Damage numbers')}
      ${toggle('showFps', 'Show FPS')}
      <div class="setting"><label>Reset progress<small>Records, achievements and unlocks on this device</small></label><button class="btn ghost small" data-reset>Reset</button></div>
      <div style="height:16px"></div>`, [{ label: 'Done', action: back }], { back, panelCls: 'scroll-panel' });
    const commit = () => {
      this.persist();
      audio.apply(this.save.settings);
      this.applyVisualSettings();
      this.gameScene()?.applySettings?.(this.save.settings);
    };
    el.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const k = inp.dataset.k as keyof Settings;
        (s as unknown as Record<string, unknown>)[k] = inp.type === 'checkbox' ? inp.checked : Number(inp.value) / 100;
        commit();
        if (k === 'sfx' || k === 'master') audio.play('pickup');
      });
    });
    el.querySelectorAll<HTMLButtonElement>('[data-seg]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.seg as keyof Settings;
      (s as unknown as Record<string, unknown>)[k] = b.dataset.v;
      el.querySelectorAll<HTMLButtonElement>(`[data-seg="${k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      commit();
    }));
    const reset = el.querySelector<HTMLButtonElement>('[data-reset]')!;
    this.resetArmed = false;
    reset.addEventListener('click', () => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        reset.textContent = 'Click again to confirm';
        return;
      }
      const settings = this.save.settings;
      this.save = defaultSave();
      this.save.settings = settings;
      this.persist();
      reset.textContent = 'Progress reset';
      reset.disabled = true;
    });
  }
}
