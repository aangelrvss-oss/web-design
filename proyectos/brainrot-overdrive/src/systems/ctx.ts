import type Phaser from 'phaser';
import type { Rng } from '../core/rng';
import type { SpatialGrid } from '../core/spatialHash';
import type { Settings } from '../core/save';
import type { Stats } from '../logic/stats';
import type { Owned } from '../logic/upgrades';
import type { Fx } from './fx';
import type { Enemy } from './entities';
import type { EnemySystem } from './enemies';
import type { ShotSystem } from './shots';
import type { PickupSystem } from './pickups';
import type { HazardSystem } from './hazards';
import type { Player } from './player';
import type { WeaponSystem } from './weapons';

export interface DamageOpts {
  canCrit?: boolean;
  knock?: number; // knockback impulse
  kx?: number; // knock direction (normalized) — defaults to away from player
  ky?: number;
  noMeltdown?: boolean;
  silent?: boolean; // no hit sound
  color?: number;
}

/** What systems can ask of the running game. Implemented by GameScene. */
export interface GameCtx {
  sc: Phaser.Scene;
  rng: Rng; // gameplay stream (spawns, procs)
  fx: Fx;
  settings: Settings;
  stats: Stats;
  owned: Owned;
  player: Player;
  enemies: EnemySystem;
  shots: ShotSystem;
  pickups: PickupSystem;
  hazards: HazardSystem;
  weapons: WeaponSystem;
  grid: SpatialGrid;
  runTime: number;
  overdrive: boolean;
  has(id: string): boolean;
  damageEnemy(e: Enemy, base: number, source: string, opts?: DamageOpts): void;
  hurtPlayer(raw: number, fromX: number, fromY: number, cause: string): void;
  sfx(name: Parameters<typeof import('../audio/audio').audio.play>[0], p?: number): void;
  announce(text: string, kind?: 'info' | 'warn' | 'boss' | 'hype'): void;
  /** Visible world half-diagonal (for off-screen spawning). */
  viewRadius(): number;
}
