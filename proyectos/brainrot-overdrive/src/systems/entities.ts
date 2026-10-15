import type Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';

/** Something that owns boss parts and receives their damage. */
export interface BossLike {
  hp: number;
  maxHp: number;
  readonly id: string;
  onPartHit(part: Enemy, amount: number): void;
}

/** Enemy instance. Pooled: `uid` changes on every (re)spawn so stale references are detectable. */
export class Enemy {
  active = false;
  uid = 0;
  def!: EnemyDef;
  x = 0;
  y = 0;
  kvx = 0; // knockback velocity
  kvy = 0;
  r = 10;
  hp = 1;
  maxHp = 1;
  speed = 0;
  damage = 0;
  elite = false;
  scale = 1;
  t = 0; // anim clock
  state = 0;
  stateT = 0;
  cd = 0; // attack cooldown
  dirX = 0;
  dirY = 0;
  slow = 1; // movement multiplier (puddles), reset each step
  flash = 0;
  orbitCd = 0;
  spawnT = 0; // spawn-in time remaining (no contact damage)
  boss: BossLike | null = null;
  contactMult = 1;
  family: CopyFamily | null = null;
  original = false;
  lastSource = '';
  inPuddle: Puddle | null = null;
  sprite!: Phaser.GameObjects.Image;
  shadow!: Phaser.GameObjects.Image;
  crown: Phaser.GameObjects.Image | null = null;
  aura: Phaser.GameObjects.Image | null = null;
}

export interface CopyFamily {
  members: Enemy[];
  alive: boolean;
}

export type ShotKind = 'bolt' | 'missile' | 'mini' | 'ebullet';

export class Shot {
  active = false;
  kind: ShotKind = 'bolt';
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  r = 6;
  dmg = 0;
  pierce = 0;
  bounces = 0;
  life = 0;
  speed = 0;
  radius = 0; // explosion radius (missiles)
  gold = false;
  target: Enemy | null = null;
  targetUid = 0;
  hit: number[] = [];
  trailT = 0;
  sprite!: Phaser.GameObjects.Image;
}

export class Puddle {
  active = false;
  x = 0;
  y = 0;
  r = 0;
  dps = 0;
  life = 0;
  max = 0;
  tick = 0;
  fire = false; // burnout trail segment
  sprite!: Phaser.GameObjects.Image;
}

export type PickupKind = 'gem' | 'grass' | 'router' | 'crate';

export class Pickup {
  active = false;
  kind: PickupKind = 'gem';
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  value = 1;
  magnet = false;
  t = 0;
  sprite!: Phaser.GameObjects.Image;
}
