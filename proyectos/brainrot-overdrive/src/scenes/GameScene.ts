import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { PAL } from '../art/palette';
import { ART_SCALE } from '../art/textures';
import { audio } from '../audio/audio';
import { Rng } from '../core/rng';
import { SpatialGrid } from '../core/spatialHash';
import { input } from '../core/input';
import { clamp, damp, formatTime, TAU } from '../core/math';
import type { Settings } from '../core/save';
import { CHARACTER_BY_ID, type CharacterDef, type CharacterId } from '../data/characters';
import { BOSSES, ELITE, ENEMIES, type BossId } from '../data/enemies';
import { LINES, fill } from '../data/text';
import { UPGRADE_BY_ID, UPGRADES, type UpgradeDef } from '../data/upgrades';
import { WEAPON_IDS, WEAPONS } from '../data/weapons';
import { rollHit, incomingDamage, type HitContext } from '../logic/combat';
import type { DailySpec } from '../logic/daily';
import { comboMultiplier, emptyRunStats, xpToNext, type RunStats } from '../logic/runStats';
import type { Stats } from '../logic/stats';
import { computeStats, isEligible, levelOf, rollOffers, type Owned } from '../logic/upgrades';
import { WaveDirector, type DirectorEvent } from '../logic/waves';
import { createBoss, type AnyBoss } from '../systems/bosses';
import type { DamageOpts, GameCtx } from '../systems/ctx';
import { EnemySystem } from '../systems/enemies';
import type { Enemy, PickupKind } from '../systems/entities';
import { Fx } from '../systems/fx';
import { HazardSystem } from '../systems/hazards';
import { PickupSystem } from '../systems/pickups';
import { Player } from '../systems/player';
import { ShotSystem } from '../systems/shots';
import { WeaponSystem } from '../systems/weapons';
import { ui, type OfferView } from '../ui/ui';

export interface RunConfig {
  character: CharacterId;
  seed: number;
  daily: DailySpec | null;
}

export interface RunResult {
  stats: RunStats;
  hpLeft: number;
  owned: Owned;
  cause: string;
  config: RunConfig;
}

/** Bridge to the app shell (menus, persistence). Set by main.ts. */
export interface AppHooks {
  settings(): Settings;
  seenTutorial(): boolean;
  markTutorialSeen(): void;
  onRunEnd(result: RunResult): void;
  openPause(): void;
}
let hooks: AppHooks;
export const setAppHooks = (h: AppHooks) => { hooks = h; };

export class GameScene extends Phaser.Scene implements GameCtx {
  // GameCtx
  rng!: Rng;
  fx!: Fx;
  settings!: Settings;
  stats!: Stats;
  owned: Owned = {};
  player!: Player;
  enemies!: EnemySystem;
  shots!: ShotSystem;
  pickups!: PickupSystem;
  hazards!: HazardSystem;
  weapons!: WeaponSystem;
  grid!: SpatialGrid;
  runTime = 0;
  overdrive = false;
  get sc(): Phaser.Scene { return this; }

  private cfg!: RunConfig;
  private character!: CharacterDef;
  private director!: WaveDirector;
  private offerRng!: Rng;
  private lootRng!: Rng;
  private run!: RunStats;
  private boss: AnyBoss | null = null;
  private xp = 0;
  private level = 1;
  private pendingLevels = 0;
  private pendingCrates = 0;
  private rerolls = 0;
  private combo = 0;
  private comboT = 0;
  private od = 0;
  private odT = 0;
  private odIdle = 0;
  private odAnnounced = false;
  private hitStop = 0;
  private timeScale = 1;
  private endTimer = -1;
  private ended = false;
  private victory = false;
  private lastCause = 'the feed';
  private comebackKills = 0;
  private dominoQueue: Array<{ x: number; y: number }> = [];
  private lowHpCd = 0;
  private camX = 0;
  private camY = 0;
  private fitZoom = 1;
  private voidBg!: Phaser.GameObjects.TileSprite;
  private lightPools: Phaser.GameObjects.Image[] = [];
  private tutorial: { moved: number; aimed: boolean; dashed: boolean; leveled: boolean; t: number } | null = null;
  private announceCd = 0;
  private hudT = 0;
  private resizeHandler = () => this.applyZoom();
  private modal = false;
  /** QA autopilot (only reachable through ?qa hooks). */
  private qaBot = false;
  private qaPick: ((i: number) => void) | null = null;
  private qaGod = false;
  /** Synergies that have appeared in an offer at least once this run. */
  private offeredSynergies = new Set<string>();

  constructor() {
    super('Game');
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────
  init(cfg: RunConfig) {
    this.cfg = cfg;
    this.character = CHARACTER_BY_ID[cfg.character] ?? CHARACTER_BY_ID.npc;
    const base = new Rng(cfg.seed);
    this.rng = base.fork(1);
    this.offerRng = base.fork(2);
    this.lootRng = base.fork(3);
    this.settings = hooks.settings();
    const mod = cfg.daily?.modifier;
    this.director = new WaveDirector(base.fork(4), {
      spawnMult: mod?.spawnMult ?? 1,
      hardCap: this.settings.intensity === 'low' ? BALANCE.spawns.hardCapLow : BALANCE.spawns.hardCap,
      enemyHpMult: mod?.enemyHpMult ?? 1,
    });
    this.owned = { [this.character.weapon]: 1 };
    this.run = emptyRunStats(this.character.id, !!cfg.daily);
    this.boss = null;
    this.runTime = 0;
    this.overdrive = false;
    this.xp = 0;
    this.level = 1;
    this.pendingLevels = 0;
    this.pendingCrates = 0;
    this.rerolls = BALANCE.run.rerollsPerRun;
    this.combo = 0;
    this.comboT = 0;
    this.od = 0;
    this.odT = 0;
    this.odIdle = 0;
    this.odAnnounced = false;
    this.hitStop = 0;
    this.timeScale = 1;
    this.endTimer = -1;
    this.ended = false;
    this.victory = false;
    this.lastCause = 'the feed';
    this.comebackKills = 0;
    this.dominoQueue = [];
    this.lowHpCd = 0;
    this.lightPools = [];
    this.announceCd = 0;
    this.hudT = 0;
    this.modal = false;
    this.offeredSynergies = new Set();
    this.tutorial = hooks.seenTutorial() ? null : { moved: 0, aimed: false, dashed: false, leveled: false, t: 0 };
  }

  create() {
    const A = BALANCE.arena;
    this.recomputeStats();
    this.grid = new SpatialGrid(A.width, A.height, 64);
    this.fx = new Fx(this, this.settings);
    this.buildArena();
    this.player = new Player(this, this.character.texture, A.width / 2, A.height / 2, this.stats.maxHp);
    this.enemies = new EnemySystem(this);
    this.shots = new ShotSystem(this);
    this.hazards = new HazardSystem(this);
    this.weapons = new WeaponSystem(this);
    this.pickups = new PickupSystem(this, (k, v, x, y) => this.collect(k, v, x, y));
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.cameras.main.setBackgroundColor(PAL.void);
    this.applyZoom();
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    input.clearPressed();
    ui.hideScreens();
    ui.showHud(true);
    ui.onPause(() => this.requestPause());
    audio.music.start(1);
    audio.music.setIntensity(1);
    audio.music.setBoost(false);
    audio.music.duck(false);
    const mod = this.cfg.daily?.modifier;
    this.announce(mod ? `DAILY · ${mod.name.toUpperCase()}` : this.rng.pick(LINES.start), 'hype');
    if (new URLSearchParams(location.search).has('qa')) this.exposeQa();
  }

  private cleanup() {
    this.scale.off('resize', this.resizeHandler);
    this.boss?.destroy();
    this.boss = null;
    this.enemies?.clearAll();
    this.shots?.clearAll();
    this.pickups?.clearAll();
    this.hazards?.clearAll();
    this.weapons?.clearAll();
    this.fx?.destroy();
    this.dominoQueue = [];
    ui.showHud(false);
    audio.music.setBoost(false);
  }

  private buildArena() {
    const A = BALANCE.arena;
    const cam = this.cameras.main;
    this.voidBg = this.add.tileSprite(0, 0, cam.width, cam.height, 'void').setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.add.tileSprite(0, 0, A.width, A.height, 'floor').setOrigin(0).setDepth(0);
    const vr = new Rng(this.cfg.seed ^ 0x5eed);
    // light pools: soft additive colour that gives the floor depth
    const tints = [PAL.magenta, PAL.cyan, PAL.violet];
    for (let i = 0; i < 16; i++) {
      const l = this.add.image(vr.range(100, A.width - 100), vr.range(100, A.height - 100), 'glow')
        .setTint(tints[i % 3]).setBlendMode(Phaser.BlendModes.ADD).setScale(vr.range(5, 9)).setAlpha(0.1).setDepth(1);
      l.setData('ph', vr.range(0, TAU));
      this.lightPools.push(l);
    }
    for (let i = 0; i < 90; i++) {
      this.add.image(vr.range(40, A.width - 40), vr.range(40, A.height - 40), 'decal', vr.int(0, 5))
        .setScale(ART_SCALE * vr.range(0.8, 1.6)).setRotation(vr.range(-0.4, 0.4)).setDepth(1.1).setAlpha(vr.range(0.5, 1));
    }
    // the firewall: arena border
    const g = this.add.graphics().setDepth(1.5);
    g.lineStyle(26, PAL.magenta, 0.12).strokeRect(-13, -13, A.width + 26, A.height + 26);
    g.lineStyle(8, PAL.magenta, 0.45).strokeRect(-4, -4, A.width + 8, A.height + 8);
    g.lineStyle(2, 0xffffff, 0.9).strokeRect(0, 0, A.width, A.height);
    for (let x = 0; x < A.width; x += 48) {
      g.fillStyle(PAL.magenta, 0.5).fillTriangle(x, -8, x + 24, -8, x + 12, -22);
      g.fillTriangle(x, A.height + 8, x + 24, A.height + 8, x + 12, A.height + 22);
    }
    for (let y = 0; y < A.height; y += 48) {
      g.fillTriangle(-8, y, -8, y + 24, -22, y + 12);
      g.fillTriangle(A.width + 8, y, A.width + 8, y + 24, A.width + 22, y + 12);
    }
    // drifting dust motes in screen space
    const motes = this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: cam.width }, y: { min: 0, max: cam.height }, lifespan: 6000, speedY: { min: -12, max: -4 }, speedX: { min: -6, max: 6 },
      scale: { min: 0.3, max: 0.9 }, alpha: { start: 0, end: 0.5, ease: 'Sine.easeInOut' }, frequency: 220, blendMode: 'ADD', tint: [PAL.cyan, PAL.magenta, 0xffffff],
    });
    motes.setScrollFactor(0).setDepth(-5);
    if (this.settings.intensity === 'low' || this.settings.reducedMotion) motes.stop();
  }

  applyZoom() {
    const cam = this.cameras.main;
    const dpr = this.registry.get('dpr') as number || 1;
    const w = cam.width / dpr, h = cam.height / dpr;
    // keep roughly the same visible world area on every screen
    this.fitZoom = clamp(Math.sqrt((w * h) / (1180 * 720)), 0.58, 1.5);
    cam.setZoom(this.fitZoom * dpr);
    this.voidBg?.setSize(cam.width, cam.height);
  }

  viewRadius() {
    const cam = this.cameras.main;
    return Math.hypot(cam.width / cam.zoom, cam.height / cam.zoom) / 2;
  }

  has(id: string) {
    return (this.owned[id] ?? 0) > 0;
  }

  sfx(name: Parameters<typeof audio.play>[0], p = 1) {
    audio.play(name, p);
  }

  announce(text: string, kind: 'info' | 'warn' | 'boss' | 'hype' = 'info') {
    ui.announce(text, kind);
  }

  private recomputeStats() {
    const mods = [this.character.mod];
    const m = this.cfg.daily?.modifier;
    if (m?.stat) mods.push(m.stat);
    if (m?.xpMult) mods.push((s) => { s.xpMult *= m.xpMult!; });
    if (m?.enemySpeedMult) mods.push((s) => { s.enemySpeedMult *= m.enemySpeedMult!; });
    const prevMax = this.stats?.maxHp;
    this.stats = computeStats(this.owned, mods);
    if (this.player && prevMax !== undefined) {
      const delta = this.stats.maxHp - prevMax;
      this.player.maxHp = this.stats.maxHp;
      this.player.hp = clamp(this.player.hp + Math.max(0, delta), 1, this.player.maxHp);
    }
  }

  // ── main loop ─────────────────────────────────────────────────────────────
  update(_time: number, delta: number) {
    const realDt = Math.min(delta / 1000, 0.05);
    if (!this.ended && !this.modal) {
      if (input.consume('escape') || input.consume('p')) {
        this.requestPause();
        return;
      }
    }
    let dt = realDt * this.timeScale;
    if (this.hitStop > 0) {
      this.hitStop -= realDt;
      dt = realDt * 0.06;
    }
    if (!this.ended) this.step(dt);
    this.render(realDt);
    if (this.endTimer > 0) {
      this.endTimer -= realDt;
      if (this.endTimer <= 0) this.finishRun();
    }
  }

  private step(dt: number) {
    this.runTime += dt;
    const p = this.player;
    if (p.alive) {
      this.run.time = this.runTime;
      this.run.score += BALANCE.score.perSecond * dt;
    }

    if (p.alive && !this.victory) {
      const bossAlive = !!this.boss;
      for (const ev of this.director.update(dt, this.enemies.population, bossAlive)) this.onDirector(ev);
      this.enemies.hpMult = this.director.hpMult();
      this.enemies.dmgMult = this.director.dmgMult();
      this.enemies.speedMult = 1;
    }

    // input
    const mv = p.alive ? (this.qaBot ? this.botMove() : input.moveVector()) : { x: 0, y: 0 };
    if (p.alive && (input.consume(' ') || input.consume('shift') || input.consume('mouse2') || input.consume('dash'))) {
      if (p.tryDash(mv.x, mv.y)) {
        this.sfx('dash');
        this.run.dashes++;
        if (this.tutorial) this.tutorial.dashed = true;
      } else if (p.dashCd > 0) this.sfx('deny');
    }
    if (p.alive && (input.consume('e') || input.consume('f') || input.consume('overdrive'))) this.tryOverdrive();
    this.updateAim();
    p.update(dt, mv.x, mv.y);
    if (this.tutorial) this.tutorial.moved += Math.hypot(p.vx, p.vy) * dt;

    this.enemies.update(dt);
    this.enemies.rebuildGrid();
    this.enemies.separate();
    this.contactDamage();
    if (p.alive) this.weapons.update(dt);
    this.shots.update(dt);
    this.hazards.update(dt);
    if (this.boss) this.boss.update(dt);
    this.processDomino();
    this.pickups.update(dt);
    this.enemies.flush();

    // combo and overdrive
    if (this.combo > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    const O = BALANCE.overdrive;
    if (this.overdrive) {
      this.odT -= dt;
      this.od = Math.max(0, (this.odT / O.duration) * 100);
      if (this.odT <= 0) {
        this.overdrive = false;
        audio.music.setBoost(false);
      }
    } else {
      this.odIdle += dt;
      if (this.odIdle > O.decayDelay && this.od < 100) this.od = Math.max(0, this.od - O.decayPerSec * dt);
      if (this.od >= 100 && !this.odAnnounced) {
        this.odAnnounced = true;
        this.announce(input.usedTouch ? 'OVERDRIVE READY · TAP OD' : LINES.overdriveReady[0], 'hype');
      }
    }
    this.lowHpCd -= dt;
    this.announceCd -= dt;
    // soundtrack builds with the run: layers join at 1:15, everything during bosses
    if (p.alive && !this.victory) {
      const want = this.boss ? 3 : this.runTime > 75 ? 2 : 1;
      if (audio.music.intensity !== want) audio.music.setIntensity(want);
    }

    if (this.tutorial) {
      const t = this.tutorial;
      t.t += dt;
      if (t.t > 30 || (t.moved > 150 && t.dashed && t.leveled)) {
        this.tutorial = null;
        hooks.markTutorialSeen();
        ui.hints(null);
      }
    }

    if (p.alive && !this.modal && !this.ended) {
      if (this.pendingCrates > 0) this.openCrate();
      else if (this.pendingLevels > 0) this.openLevelUp();
    }
  }

  private updateAim() {
    const p = this.player;
    let ax = p.aimX, ay = p.aimY;
    const auto = this.settings.aim === 'auto' || input.usedTouch || this.qaBot;
    if (!auto) {
      const dpr = (this.registry.get('dpr') as number) || 1;
      const wp = this.cameras.main.getWorldPoint(input.mouseX * dpr, input.mouseY * dpr);
      const dx = wp.x - p.x, dy = wp.y - (p.y - 4);
      const l = Math.hypot(dx, dy);
      if (l > 4) { ax = dx / l; ay = dy / l; }
      if (this.tutorial && performance.now() - input.mouseMovedAt < 200) this.tutorial.aimed = true;
    } else {
      // nearest threat, but bosses and elites count as closer so auto-aim can focus them
      let best: Enemy | null = null;
      let bs = 600;
      for (const e of this.enemies.active) {
        if (!e.active) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d > 600) continue;
        const score = d - (e.boss ? (d > 150 ? 260 : 0) : e.elite ? 90 : 0) - e.r;
        if (score < bs) { bs = score; best = e; }
      }
      if (best) {
        const l = Math.hypot(best.x - p.x, best.y - p.y) || 1;
        ax = (best.x - p.x) / l;
        ay = (best.y - p.y) / l;
      } else if (Math.hypot(p.vx, p.vy) > 40) {
        const l = Math.hypot(p.vx, p.vy);
        ax = p.vx / l;
        ay = p.vy / l;
      }
      if (this.tutorial) this.tutorial.aimed = true;
    }
    p.aimX = ax;
    p.aimY = ay;
  }

  private contactDamage() {
    const p = this.player;
    if (!p.alive || p.invuln > 0) return;
    const list = this.enemies.active;
    for (const i of this.grid.query(p.x, p.y, p.r + 80)) {
      const e = list[i];
      if (!e || !e.active || e.spawnT > 0 || e.damage <= 0) continue;
      const rr = p.r * 0.8 + e.r * 0.85;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < rr * rr) {
        const name = e.boss ? (BOSSES[e.boss.id as BossId]?.name ?? 'a boss') : `${e.elite ? 'a Certified ' : 'a '}${e.def.name}`;
        this.hurtPlayer(e.damage * e.contactMult, e.x, e.y, name);
        // shove the attacker back so contact isn't a damage lock
        const dx = e.x - p.x, dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!e.boss) {
          e.kvx += (dx / d) * 260 * (1 - e.def.mass);
          e.kvy += (dy / d) * 260 * (1 - e.def.mass);
        }
        return;
      }
    }
  }

  // ── director ──────────────────────────────────────────────────────────────
  private onDirector(ev: DirectorEvent) {
    switch (ev.kind) {
      case 'announce':
        if (ev.line === 'bossWarn') {
          this.announce(LINES.bossWarn[0], 'warn');
          this.sfx('bossWarn');
        } else this.announce(this.rng.pick(LINES[ev.line]), 'warn');
        break;
      case 'boss':
        this.spawnBoss(ev.id);
        break;
      case 'spawn': {
        const cap = this.enemies.capFor();
        const room = cap - this.enemies.population;
        // elites always get through (bounded: at most one per event); scripted hordes are clipped to the cap
        const count = ev.elite ? 1 : Math.min(ev.count, Math.max(0, room));
        if (count <= 0) break;
        const spawned = this.enemies.spawnGroup(ev.enemy, count, ev.elite, ev.formation);
        if (ev.elite && spawned[0]) {
          const e = spawned[0];
          if (ev.enemy === 'copypasta') this.announce(this.rng.pick(LINES.copypasta), 'warn');
          else this.announce(fill(this.rng.pick(LINES.elite), { name: e.def.name.toUpperCase() }), 'warn');
          this.sfx('telegraph');
        }
        break;
      }
    }
  }

  private spawnBoss(id: BossId) {
    const B = BOSSES[id];
    this.boss = createBoss(id, this, {
      onDefeated: (bid, x, y) => this.onBossDefeated(bid, x, y),
      onPhase: (_bid, phase) => {
        this.announce(phase === 3 ? 'FINAL PHASE · TOUCH GRASS OR PERISH' : this.rng.pick(LINES.bossPhase), 'boss');
        this.fx.flash(PAL.dangerHot, 0.3, 200);
        this.fx.shake(10);
        this.hitStop = 0.12;
        this.sfx('bossRoar');
      },
      caption: (t) => ui.caption(t),
    });
    // the feed makes room: distant regular enemies scroll away so the fight is about the boss
    const p = this.player;
    for (const e of this.enemies.active) {
      if (!e.active || e.boss || e.elite) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > 260 * 260) {
        this.fx.glow(e.x, e.y, e.def.color, 1);
        this.enemies.despawn(e);
      }
    }
    this.shots.clearEnemyShots();
    ui.bossIntro(B.name, B.subtitle);
    ui.caption('');
    this.sfx('bossRoar');
    this.fx.shake(8);
    audio.music.setIntensity(3);
    if (!this.settings.reducedMotion) {
      const cam = this.cameras.main;
      const z = cam.zoom;
      this.tweens.add({ targets: cam, zoom: z * 0.9, duration: 500, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => this.applyZoom() });
    }
  }

  private onBossDefeated(id: BossId, x: number, y: number) {
    this.boss?.destroy();
    this.boss = null;
    ui.bossBar(null);
    this.run.bossesKilled.push(id);
    this.run.score += id === 'algorithm' ? BALANCE.score.finalBossKill : BALANCE.score.midBossKill;
    this.fx.flash(0xffffff, 0.5, 300);
    this.fx.shake(14);
    this.hitStop = 0.2;
    this.sfx('eliteKill');
    for (let i = 0; i < 24; i++) this.pickups.gem(x + this.lootRng.range(-60, 60), y + this.lootRng.range(-60, 60), 20);
    if (id === 'doomscroller') {
      this.pickups.item('crate', x, y);
      this.pickups.item('grass', x + 30, y);
      this.pickups.vacuum();
      this.announce('THE DOOMSCROLLER HAS BEEN SCROLLED PAST', 'hype');
      audio.music.setIntensity(2);
    } else {
      this.victory = true;
      this.run.victory = true;
      this.announce(LINES.victory[0], 'hype');
      this.sfx('victory');
      audio.music.setIntensity(0);
      // the feed collapses
      for (const e of this.enemies.active) if (e.active) {
        this.fx.burst(e.x, e.y, e.def.color, 4);
        this.enemies.despawn(e);
      }
      this.shots.clearEnemyShots();
      this.hazards.clearAll();
      this.player.invuln = 99;
      this.timeScale = 0.5;
      this.endTimer = 2.8;
    }
  }

  // ── damage & kills ────────────────────────────────────────────────────────
  private hitCtx(): HitContext {
    return { hpFrac: this.player.hpFrac, overdrive: this.overdrive, comeback: this.has('comeback'), mainCharacter: this.has('maincharacter') };
  }

  damageEnemy(e: Enemy, base: number, source: string, opts: DamageOpts = {}) {
    if (!e.active) return;
    if (e.boss && (e.boss as AnyBoss).dying) return;
    const hit = rollHit(base, this.stats, this.hitCtx(), this.rng, opts.canCrit ?? true);
    const amount = hit.amount;
    e.flash = 0.07;
    if (hit.crit) {
      this.run.crits++;
      this.sfx('crit');
    } else if (!opts.silent) this.sfx('hit');
    // AoE / damage-over-time sources stay quiet unless they crit
    const showNum = hit.crit || (!opts.silent && this.settings.intensity !== 'low');
    if (showNum) this.fx.number(e.x, e.y - e.r, amount, hit.crit, opts.color);
    if (e.boss) {
      const b = e.boss;
      const before = b.hp;
      b.onPartHit(e, amount);
      const dealt = before - b.hp;
      this.run.damageDealt += dealt;
      this.run.weaponDamage[source] = (this.run.weaponDamage[source] ?? 0) + dealt;
      if (!this.overdrive) this.gainOd((dealt / b.maxHp) * 100 * BALANCE.overdrive.perBossHitFraction * 0.2);
    } else {
      const dealt = Math.min(e.hp, amount);
      e.hp -= amount;
      this.run.damageDealt += dealt;
      this.run.weaponDamage[source] = (this.run.weaponDamage[source] ?? 0) + dealt;
      const k = (opts.knock ?? 60) * (1 - e.def.mass);
      if (k > 0) {
        let kx = opts.kx, ky = opts.ky;
        if (kx === undefined || ky === undefined) {
          const dx = e.x - this.player.x, dy = e.y - this.player.y;
          const d = Math.hypot(dx, dy) || 1;
          kx = dx / d;
          ky = dy / d;
        }
        e.kvx += kx * k;
        e.kvy += ky * k;
      }
    }
    if (hit.crit && this.has('meltdown') && !opts.noMeltdown) this.meltdown(e.x, e.y, amount, e);
    if (!e.boss && e.hp <= 0) this.killEnemy(e, source);
  }

  private meltdown(x: number, y: number, amount: number, src: Enemy) {
    const S = BALANCE.synergy;
    const R = S.meltdownRadius * this.stats.areaMult;
    const list = this.enemies.active;
    for (const i of this.grid.query(x, y, R + 30)) {
      const e = list[i];
      if (!e || !e.active || e === src) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 > (R + e.r) ** 2) continue;
      // raw splash: bypasses multipliers already applied to `amount`
      this.damageEnemy(e, (amount * S.meltdownFrac) / (this.stats.damageMult || 1), 'meltdown', { canCrit: false, noMeltdown: true, silent: true, knock: 90 });
    }
    this.fx.ring(x, y, 8, R, PAL.gold, 0.25);
    this.fx.glow(x, y, PAL.gold, 2);
  }

  private killEnemy(e: Enemy, source: string) {
    const x = e.x, y = e.y;
    const def = e.def;
    const elite = e.elite;
    e.lastSource = source;
    this.enemies.despawn(e);
    this.run.kills++;
    if (elite) this.run.eliteKills++;
    if (source === 'domino') this.run.dominoKills++;
    this.combo++;
    this.comboT = BALANCE.combo.window;
    if (this.combo > this.run.maxCombo) this.run.maxCombo = this.combo;
    for (const [n, key] of [[50, 'combo50'], [100, 'combo100'], [200, 'combo200']] as const) {
      if (this.combo === n) this.announce(LINES[key][0], 'hype');
    }
    const mult = comboMultiplier(this.combo);
    this.run.score += def.score * (elite ? ELITE.scoreMult : 1) * mult;
    const O = BALANCE.overdrive;
    if (!this.overdrive) this.gainOd(elite ? O.perEliteKill : O.perKill);

    // xp
    const xp = def.xp * (elite ? ELITE.xpMult : 1);
    if (elite) {
      for (let i = 0; i < 5; i++) this.pickups.gem(x + this.lootRng.range(-30, 30), y + this.lootRng.range(-30, 30), xp / 5);
    } else this.pickups.gem(x, y, xp);

    // drops
    if (elite && !(def.id === 'copypasta' && !e.original)) this.pickups.item('crate', x, y);
    else if (!e.family) {
      const r = this.lootRng.next();
      if (r < BALANCE.drops.grassChance) this.pickups.item('grass', x, y);
      else if (r < BALANCE.drops.grassChance + BALANCE.drops.vacuumChance) this.pickups.item('router', x, y);
    }

    // feedback
    const big = elite || def.id === 'unit';
    this.fx.burst(x, y, def.color, big ? 18 : 5);
    this.fx.shatter(x, y, def.color, big ? 10 : 2);
    if (big) {
      this.fx.ring(x, y, 10, elite ? 140 : 80, elite ? PAL.gold : def.color, 0.35);
      this.fx.shake(elite ? 9 : 4);
      if (elite) {
        this.hitStop = Math.max(this.hitStop, 0.07);
        this.sfx('eliteKill');
      }
    }
    this.sfx('kill', 1 + Math.min(0.5, this.combo / 400));

    // archetype on-death behaviour
    if (def.behavior === 'splitter') {
      for (let i = 0; i < 2; i++) {
        const a = this.rng.range(0, TAU);
        const c = this.enemies.spawn('ratiolet', x + Math.cos(a) * 14, y + Math.sin(a) * 14, { elite: false });
        c.kvx = Math.cos(a) * 220;
        c.kvy = Math.sin(a) * 220;
        c.spawnT = 0.15;
      }
    }
    if (e.family && e.original) {
      e.family.alive = false;
      let n = 0;
      for (const m of e.family.members) if (m.active && m !== e) {
        this.fx.burst(m.x, m.y, PAL.cyan, 6);
        this.fx.ring(m.x, m.y, 4, 30, PAL.cyan, 0.2);
        this.pickups.gem(m.x, m.y, 2);
        this.enemies.despawn(m);
        this.run.kills++;
        n++;
      }
      if (n > 0) this.announce(`DELETED ${n} COPIES`, 'hype');
    }

    // synergies
    if (this.has('domino') && source !== 'boss' && this.rng.chance(BALANCE.synergy.dominoChance)) this.dominoQueue.push({ x, y });
    if (this.has('ratiod') && source === 'homing') this.weapons.ratiod(x, y);
    if (this.has('comeback') && this.player.hpFrac <= BALANCE.synergy.comebackThreshold) {
      this.comebackKills++;
      if (this.comebackKills % BALANCE.synergy.comebackHealEvery === 0) this.heal(BALANCE.synergy.comebackHeal, false);
    }
  }

  private processDomino() {
    const S = BALANCE.synergy;
    let n = 0;
    while (this.dominoQueue.length && n < S.dominoMaxPerFrame) {
      const { x, y } = this.dominoQueue.shift()!;
      n++;
      const R = S.dominoRadius * this.stats.areaMult;
      const list = this.enemies.active;
      for (const i of this.grid.query(x, y, R + 30)) {
        const e = list[i];
        if (!e || !e.active) continue;
        if ((e.x - x) ** 2 + (e.y - y) ** 2 > (R + e.r) ** 2) continue;
        this.damageEnemy(e, S.dominoBase + 4 * this.level, 'domino', { silent: true, knock: 200 });
      }
      this.fx.ring(x, y, 8, R, PAL.danger, 0.3);
      this.fx.burst(x, y, 0xffb547, 6);
      this.sfx('explode');
    }
    if (this.dominoQueue.length > 80) this.dominoQueue.length = 80;
  }

  private gainOd(v: number) {
    this.od = Math.min(100, this.od + v);
    this.odIdle = 0;
  }

  private tryOverdrive() {
    if (this.overdrive || this.od < 100) {
      if (!this.overdrive) this.sfx('deny');
      return;
    }
    const O = BALANCE.overdrive;
    this.overdrive = true;
    this.odT = O.duration;
    this.odAnnounced = false;
    this.run.overdrives++;
    this.announce(this.rng.pick(LINES.overdrive), 'hype');
    this.sfx('overdrive');
    audio.music.setBoost(true);
    this.fx.flash(PAL.magenta, 0.3, 200);
    this.fx.shake(8);
    const p = this.player;
    this.fx.ring(p.x, p.y, 20, 260, PAL.magenta, 0.45);
    const list = this.enemies.active;
    for (const i of this.grid.query(p.x, p.y, 260)) {
      const e = list[i];
      if (!e || !e.active) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 250) this.damageEnemy(e, 15, 'overdrive', { knock: 520, kx: dx / d, ky: dy / d, silent: true });
    }
  }

  hurtPlayer(raw: number, fromX: number, fromY: number, cause: string) {
    const p = this.player;
    if (!p.alive || p.invuln > 0 || this.ended || this.victory || this.qaGod) return;
    const dmg = incomingDamage(raw, this.stats);
    p.hp -= dmg;
    p.invuln = BALANCE.player.hurtInvuln;
    p.hurtFx();
    this.run.damageTaken += dmg;
    this.run.hitlessUntil = Math.min(this.run.hitlessUntil, this.runTime);
    this.run.lowestHpFrac = Math.min(this.run.lowestHpFrac, Math.max(0, p.hp) / p.maxHp);
    this.lastCause = cause;
    const dx = p.x - fromX, dy = p.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    p.vx += (dx / d) * BALANCE.player.contactKnockback;
    p.vy += (dy / d) * BALANCE.player.contactKnockback;
    this.fx.burst(p.x, p.y, PAL.dangerHot, 10);
    this.fx.number(p.x, p.y - 26, dmg, false, PAL.dangerHot);
    this.fx.shake(8);
    this.hitStop = Math.max(this.hitStop, 0.05);
    ui.hurtFlash();
    this.sfx('hurt');
    this.combo = 0;
    if (!this.overdrive) this.od = Math.max(0, this.od - BALANCE.overdrive.hurtPenalty);
    if (p.hp <= 0) {
      p.hp = 0;
      this.die();
    } else if (p.hpFrac < 0.25 && this.lowHpCd <= 0) {
      this.lowHpCd = 25;
      this.announce(this.has('comeback') ? LINES.lowHp[2] : this.rng.pick(LINES.lowHp.slice(0, 2)), 'warn');
    }
  }

  private heal(amount: number, sound = true) {
    const p = this.player;
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + amount);
    if (p.hp > before) {
      this.fx.number(p.x, p.y - 30, p.hp - before, false, PAL.grass);
      this.fx.glow(p.x, p.y, PAL.grass, 3);
      if (sound) this.sfx('heal');
    }
  }

  private die() {
    const p = this.player;
    p.alive = false;
    p.setVisible(false);
    this.fx.burst(p.x, p.y, PAL.cyan, 40);
    this.fx.shatter(p.x, p.y, 0xffffff, 20);
    this.fx.ring(p.x, p.y, 10, 200, PAL.dangerHot, 0.6);
    this.fx.flash(PAL.dangerHot, 0.45, 300);
    this.fx.shake(14);
    this.sfx('defeat');
    audio.music.setIntensity(0);
    audio.music.setBoost(false);
    this.overdrive = false;
    this.timeScale = 0.3;
    this.endTimer = 1.6;
    ui.bossBar(null);
  }

  private finishRun() {
    if (this.ended) return;
    this.ended = true;
    this.run.level = this.level;
    this.run.synergies = UPGRADES.filter((u) => u.kind === 'synergy' && this.has(u.id)).map((u) => u.id);
    this.run.score = Math.round(this.run.score);
    if (this.tutorial) {
      hooks.markTutorialSeen();
      this.tutorial = null;
    }
    ui.hints(null);
    hooks.onRunEnd({ stats: this.run, hpLeft: this.player.hp, owned: { ...this.owned }, cause: this.lastCause, config: this.cfg });
  }

  // ── xp, pickups, upgrades ─────────────────────────────────────────────────
  private collect(kind: PickupKind, value: number, x: number, y: number) {
    switch (kind) {
      case 'gem': {
        this.xp += value * this.stats.xpMult;
        let need = xpToNext(this.level);
        while (this.xp >= need) {
          this.xp -= need;
          this.level++;
          this.pendingLevels++;
          need = xpToNext(this.level);
        }
        this.sfx('pickup', 1 + Math.min(0.6, (this.combo % 40) / 60));
        break;
      }
      case 'grass':
        this.heal(this.player.maxHp * BALANCE.drops.grassHealFrac);
        this.announce('TOUCHED GRASS · +HP', 'info');
        break;
      case 'router':
        this.pickups.vacuum();
        this.fx.ring(x, y, 20, 400, PAL.violet, 0.5);
        this.sfx('levelup');
        this.announce('FULL BARS · ALL CLOUT INBOUND', 'info');
        break;
      case 'crate':
        this.pendingCrates++;
        this.sfx('crate');
        break;
    }
  }

  private offerViews(defs: UpgradeDef[]): OfferView[] {
    return defs.map((def) => {
      const lvl = levelOf(this.owned, def.id);
      // name the owned upgrades that unlocked a synergy, so the combo is learnable
      const combo = def.kind === 'synergy' && def.requires
        ? def.requires.map((g) => g.filter((r) => levelOf(this.owned, r.id) >= r.level).map((r) => UPGRADE_BY_ID[r.id].name)[0]).filter(Boolean).join(' + ')
        : undefined;
      return { def, nextLevel: lvl + 1, isNew: lvl === 0, text: def.text(lvl + 1), combo };
    });
  }

  private openLevelUp() {
    this.pendingLevels--;
    if (this.tutorial) this.tutorial.leveled = true;
    const first = this.level <= 2 && this.run.kills < 40;
    const roll = () => this.noteOffers(rollOffers(this.offerRng, this.owned, { luck: this.stats.luck, force: this.newSynergies() }));
    let offers = roll();
    this.sfx('levelup');
    this.fx.ring(this.player.x, this.player.y, 10, 120, PAL.cyan, 0.4);
    this.openModal();
    this.qaPick = (i) => this.pick(offers[Math.min(i, offers.length - 1)]);
    const show = () => ui.levelUp({
      title: `Level ${this.level - this.pendingLevels}`,
      kicker: first ? 'Pick one · it changes how you play' : this.pendingLevels > 0 ? `Level up · ${this.pendingLevels} more queued` : 'Level up',
      crate: false,
      offers: this.offerViews(offers),
      rerolls: this.rerolls,
      onPick: (i) => this.pick(offers[i]),
      onReroll: () => {
        this.rerolls--;
        offers = roll();
        this.sfx('select');
        show();
      },
    });
    show();
  }

  /** Eligible synergies never offered yet: guaranteed a slot so combos are discoverable. */
  private newSynergies(): string[] {
    return UPGRADES.filter((u) => u.kind === 'synergy' && !this.offeredSynergies.has(u.id) && isEligible(u, this.owned)).map((u) => u.id).slice(0, 1);
  }

  private noteOffers(offers: UpgradeDef[]): UpgradeDef[] {
    for (const o of offers) if (o.kind === 'synergy') this.offeredSynergies.add(o.id);
    return offers;
  }

  private openCrate() {
    this.pendingCrates--;
    let offers = this.noteOffers(rollOffers(this.offerRng, this.owned, { luck: this.stats.luck + 2, minRarity: 'rare', force: this.newSynergies() }));
    this.openModal();
    this.qaPick = (i) => this.pick(offers[Math.min(i, offers.length - 1)]);
    const show = () => ui.levelUp({
      title: 'Loot Crate',
      kicker: 'Elite drop · rare or better',
      crate: true,
      offers: this.offerViews(offers),
      rerolls: this.rerolls,
      onPick: (i) => this.pick(offers[i]),
      onReroll: () => {
        this.rerolls--;
        offers = this.noteOffers(rollOffers(this.offerRng, this.owned, { luck: this.stats.luck + 2, minRarity: 'rare' }));
        show();
      },
    });
    show();
  }

  private openModal() {
    this.modal = true;
    audio.music.duck(true);
    this.scene.pause();
  }

  closeModal() {
    this.modal = false;
    ui.hideScreens();
    input.clearPressed();
    audio.music.duck(false);
    this.scene.resume();
  }

  private pick(def: UpgradeDef) {
    this.qaPick = null;
    this.sfx('select');
    this.applyUpgrade(def);
    this.closeModal();
  }

  applyUpgrade(def: UpgradeDef) {
    if (def.id === 'snack') {
      this.heal(this.player.maxHp * 0.35);
      return;
    }
    if (def.id === 'cloutbag') {
      this.run.score += 2500;
      return;
    }
    this.owned[def.id] = (this.owned[def.id] ?? 0) + 1;
    this.recomputeStats();
    if (def.kind === 'synergy') {
      this.announce(fill(LINES.synergy[0], { name: def.name.toUpperCase() }), 'hype');
      this.sfx('synergy');
      this.fx.flash(PAL.gold, 0.2, 160);
      this.fx.ring(this.player.x, this.player.y, 20, 220, PAL.gold, 0.5);
    }
  }

  // ── pause ─────────────────────────────────────────────────────────────────
  requestPause() {
    if (this.modal || this.ended || !this.player.alive) return;
    this.openModal();
    hooks.openPause();
  }

  /** Called by the shell when the pause menu resumes. */
  resumeFromPause() {
    this.closeModal();
  }

  get isModal() {
    return this.modal;
  }

  get isOver() {
    return this.ended || !this.player?.alive;
  }

  applySettings(s: Settings) {
    this.settings = s;
    this.fx?.applySettings(s); // the scene may not have been created yet (menu)
  }

  /** Build summary for the pause screen. */
  buildSummary() {
    const weapons = WEAPON_IDS.filter((id) => this.has(id)).map((id) => ({ id, name: WEAPONS[id].name, level: this.owned[id], icon: UPGRADE_BY_ID[id].icon }));
    const syn = UPGRADES.filter((u) => u.kind === 'synergy' && this.has(u.id)).map((u) => ({ name: u.name, icon: u.icon }));
    const passives = UPGRADES.filter((u) => (u.kind === 'passive' || u.kind === 'cursed') && this.has(u.id)).map((u) => ({ name: u.name, level: this.owned[u.id], icon: u.icon }));
    return { weapons, syn, passives, time: this.runTime, level: this.level, kills: this.run.kills };
  }

  // ── render ────────────────────────────────────────────────────────────────
  private render(realDt: number) {
    const t = this.runTime;
    this.player.sync(t);
    this.enemies.sync();
    this.boss?.sync(t);
    this.shots.sync();
    this.pickups.sync();
    this.weapons.sync();
    this.hazards.draw();
    this.fx.update(realDt);
    for (const l of this.lightPools) l.setAlpha(0.08 + Math.sin(t * 0.6 + (l.getData('ph') as number)) * 0.035);

    // camera: smooth follow with a little look-ahead toward the aim
    const p = this.player;
    const look = this.settings.aim === 'mouse' && !input.usedTouch ? 46 : 20;
    const tx = p.x + p.aimX * look, ty = p.y + p.aimY * look;
    const k = damp(9, realDt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    const cam = this.cameras.main;
    cam.centerOn(this.camX + this.fx.offX, this.camY + this.fx.offY);
    this.voidBg.setTilePosition(cam.scrollX * 0.35, cam.scrollY * 0.35);

    this.hudT -= realDt;
    if (this.hudT <= 0) {
      this.hudT = 1 / 30;
      this.pushHud();
    }
  }

  private pushHud() {
    const p = this.player;
    const R = BALANCE.run;
    let next = '';
    if (this.boss) next = this.boss.id === 'algorithm' ? 'FINAL BOSS' : 'BOSS FIGHT';
    else if (this.victory) next = 'LOGGED OFF';
    else if (this.runTime < R.midBossAt) next = `BOSS IN ${formatTime(R.midBossAt - this.runTime)}`;
    else if (this.runTime < R.finalBossAt) next = `FINAL BOSS IN ${formatTime(R.finalBossAt - this.runTime)}`;
    else next = 'FINAL BOSS INCOMING';
    ui.updateHud({
      hp: p.hp,
      maxHp: p.maxHp,
      level: this.level,
      xpFrac: Math.min(1, this.xp / xpToNext(this.level)),
      time: this.runTime,
      nextLabel: next,
      score: this.run.score,
      kills: this.run.kills,
      combo: this.combo,
      comboMult: comboMultiplier(this.combo),
      dashFrac: 1 - p.dashCd / this.stats.dashCooldown,
      od: this.od,
      odActive: this.overdrive,
      weapons: WEAPON_IDS.filter((id) => this.has(id)).map((id) => ({ id, icon: UPGRADE_BY_ID[id].icon, level: this.owned[id], cd: this.weapons.cooldownFrac(id) })),
      synergies: UPGRADES.filter((u) => u.kind === 'synergy' && this.has(u.id)).map((u) => ({ icon: u.icon, name: u.name })),
      lowHp: p.alive && p.hpFrac < 0.3,
      fps: this.settings.showFps ? this.game.loop.actualFps : null,
    });
    if (this.boss) {
      const b = this.boss;
      ui.bossBar({ name: BOSSES[b.id].name, frac: b.hp / b.maxHp, marks: b.id === 'algorithm' ? [0.66, 0.33] : [0.5] });
    }
    touchState.dashFrac = 1 - p.dashCd / this.stats.dashCooldown;
    touchState.odReady = this.od >= 100 && !this.overdrive;
    if (this.tutorial) {
      const t = this.tutorial;
      const touch = input.usedTouch;
      ui.hints([
        { id: 'move', html: touch ? 'Drag the <kbd>left side</kbd> to move' : '<kbd>WASD</kbd> / <kbd>ARROWS</kbd> move', done: t.moved > 150 },
        { id: 'aim', html: touch ? 'You fire automatically at the nearest enemy' : 'You auto-fire · <kbd>MOUSE</kbd> aims', done: t.aimed && t.t > 4 },
        { id: 'dash', html: touch ? 'Tap <kbd>DASH</kbd> to dodge through danger' : '<kbd>SPACE</kbd> dash · invulnerable while dashing', done: t.dashed },
        { id: 'xp', html: 'Grab <kbd>XP</kbd> gems to level up', done: t.leveled },
      ]);
    }
  }

  /** Simple kiting autopilot for automated play tests: flee threats, grab gems, dash when cornered. */
  private botMove(): { x: number; y: number } {
    const p = this.player;
    let fx = 0, fy = 0, threat = 0;
    for (const e of this.enemies.active) {
      if (!e.active) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const R = 200 + e.r;
      if (d < R) {
        const w = ((R - d) / R) * (e.boss ? 3 : 1.6);
        fx += (dx / d) * w;
        fy += (dy / d) * w;
        if (d < e.r + 40) threat++;
      }
    }
    for (const s of this.shots.enemy) {
      if (!s.active) continue;
      const dx = p.x - s.x, dy = p.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 110) { fx += (dx / d) * 2.5; fy += (dy / d) * 2.5; if (d < 45) threat++; }
    }
    let best = 520 * 520, gx = 0, gy = 0;
    for (const g of this.pickups.list) {
      const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2;
      if (d < best) { best = d; gx = g.x - p.x; gy = g.y - p.y; }
    }
    if (best < 520 * 520) {
      const d = Math.sqrt(best) || 1;
      fx += (gx / d) * 0.9;
      fy += (gy / d) * 0.9;
    }
    const A = BALANCE.arena;
    fx += ((A.width / 2 - p.x) / A.width) * 1.2;
    fy += ((A.height / 2 - p.y) / A.height) * 1.2;
    if (this.hazards.zones.length) {
      const z = this.hazards.zones.reduce((a, b) => ((a.x - p.x) ** 2 + (a.y - p.y) ** 2 < (b.x - p.x) ** 2 + (b.y - p.y) ** 2 ? a : b));
      fx = (z.x - p.x) * 0.05;
      fy = (z.y - p.y) * 0.05;
    }
    const l = Math.hypot(fx, fy);
    if (l < 0.05) return { x: 0, y: 0 };
    const v = { x: fx / l, y: fy / l };
    if (threat > 0 && p.dashCd <= 0 && p.tryDash(v.x, v.y)) this.run.dashes++;
    if (this.od >= 100) this.tryOverdrive();
    return v;
  }

  // ── QA hooks (only with ?qa in the URL) ──────────────────────────────────
  private exposeQa() {
    const w = window as unknown as Record<string, unknown>;
    w.__bro = {
      scene: this,
      state: () => ({
        time: this.runTime, level: this.level, hp: this.player.hp, maxHp: this.player.maxHp, alive: this.player.alive,
        enemies: this.enemies.population, allEnemies: this.enemies.active.length, shots: this.shots.player.length, eshots: this.shots.enemy.length,
        pickups: this.pickups.list.length, kills: this.run.kills, score: Math.round(this.run.score), modal: this.modal, ended: this.ended,
        boss: this.boss ? { id: this.boss.id, hp: this.boss.hp, max: this.boss.maxHp, phase: this.boss.phase } : null,
        owned: { ...this.owned }, od: this.od, overdrive: this.overdrive, victory: this.victory,
        particles: this.children.list.length, puddles: this.weapons.puddles.filter((p) => p.active).length,
      }),
      giveXp: (n: number) => this.collect('gem', n, this.player.x, this.player.y),
      setTime: (t: number) => { this.runTime = t; this.director.time = t; },
      spawn: (id: keyof typeof ENEMIES, n = 1, elite = false) => this.enemies.spawnGroup(id, n, elite, 'cluster').length,
      boss: (id: BossId) => this.spawnBoss(id),
      bossHp: (frac: number) => { if (this.boss) this.boss.hp = this.boss.maxHp * frac; },
      /** Deal real damage to the boss through the normal damage pipeline. */
      hitBoss: (n: number) => { const part = this.boss?.parts[0]; if (part) this.damageEnemy(part, n, 'qa', { canCrit: false }); return this.boss ? this.boss.hp / this.boss.maxHp : null; },
      upgrade: (id: string) => { const d = UPGRADE_BY_ID[id]; if (d) this.applyUpgrade(d); return { ...this.owned }; },
      god: (on: boolean) => { this.qaGod = on; },
      hurt: (n: number) => { const g = this.qaGod; this.qaGod = false; this.player.invuln = 0; this.hurtPlayer(n, this.player.x + 1, this.player.y, 'QA'); this.qaGod = g; },
      audio: () => audio.ctx?.state ?? 'none',
      od: () => { this.od = 100; },
      crate: () => { this.pendingCrates++; },
      bot: (on: boolean) => { this.qaBot = on; },
      /** Run the real simulation in fixed 1/60 s steps (no rendering) until `sec` passes or a modal opens.
       *  With `autoPick`, level-up/crate choices are taken automatically (random card, seeded). */
      advance: (sec: number, autoPick = false, renderEach = false) => {
        const dt = 1 / 60;
        let n = Math.round(sec * 60);
        const pickRng = new Rng(Math.floor(this.runTime * 1000) + 7);
        while (n-- > 0 && !this.ended) {
          if (this.modal) {
            if (autoPick && this.qaPick) this.qaPick(pickRng.int(0, 2));
            else break;
          }
          this.step(dt * this.timeScale);
          if (renderEach) this.render(dt);
          if (this.endTimer > 0) {
            this.endTimer -= dt;
            if (this.endTimer <= 0) this.finishRun();
          }
        }
        this.render(dt);
        return { time: this.runTime, modal: this.modal, ended: this.ended };
      },
      fps: () => this.game.loop.actualFps,
    };
  }
}

/** Shared with the touch controls overlay (cooldown display). */
export const touchState = { dashFrac: 1, odReady: false };
