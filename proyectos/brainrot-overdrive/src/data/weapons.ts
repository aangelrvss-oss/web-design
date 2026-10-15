/** Weapon tables. Level 1 is the base; each later level lists what changes, and the
 *  `at(level)` helpers fold those deltas so gameplay code reads a flat parameter set. */
export type WeaponId = 'cannon' | 'orbit' | 'boom' | 'zap' | 'homing' | 'puddle';

export interface WeaponParams {
  damage: number;
  cooldown: number; // seconds between activations
  count: number; // projectiles / blades / missiles / puddles / initial zap targets
  speed: number; // projectile speed, or orbit angular speed (rad/s)
  radius: number; // AoE / orbit / explosion radius
  pierce: number;
  chains: number; // zap chain hops
  duration: number; // puddle lifetime
  extra: number; // weapon-specific flag (boom double pulse, etc.)
}

interface WeaponDef {
  id: WeaponId;
  name: string;
  short: string;
  base: WeaponParams;
  /** Per-level deltas for levels 2..5 (index 0 is level 2). */
  levels: Array<Partial<Record<keyof WeaponParams, number>> & { mult?: Partial<Record<'damage' | 'cooldown' | 'radius' | 'speed' | 'duration', number>> }>;
  levelText: string[]; // what each level (1..5) does, for upgrade cards
}

const W = (
  id: WeaponId,
  name: string,
  short: string,
  base: Partial<WeaponParams>,
  levels: WeaponDef['levels'],
  levelText: string[],
): WeaponDef => ({
  id,
  name,
  short,
  base: { damage: 10, cooldown: 1, count: 1, speed: 600, radius: 40, pierce: 0, chains: 0, duration: 0, extra: 0, ...base },
  levels,
  levelText,
});

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  cannon: W(
    'cannon',
    'Clout Cannon',
    'Fires clout bolts at your cursor.',
    { damage: 12, cooldown: 0.42, count: 1, speed: 640, radius: 7 },
    [{ count: 1 }, { mult: { damage: 1.3 } }, { count: 1, mult: { cooldown: 0.85 } }, { pierce: 1, mult: { damage: 1.3 } }],
    ['Fires clout bolts at your cursor.', '+1 bolt per volley.', '+30% bolt damage.', '+1 bolt, fires 15% faster.', 'Bolts pierce +1 enemy, +30% damage.'],
  ),
  orbit: W(
    'orbit',
    'Fidget Orbit',
    'Spinners orbit you and shred anything close.',
    { damage: 9, cooldown: 0.4, count: 2, speed: 3.1, radius: 74 },
    [{ count: 1 }, { radius: 16, mult: { damage: 1.4 } }, { count: 1 }, { count: 1, mult: { speed: 1.3 } }],
    ['Two spinners orbit you, shredding anything close.', '+1 spinner.', 'Wider orbit, +40% damage.', '+1 spinner.', '+1 spinner, spins 30% faster.'],
  ),
  boom: W(
    'boom',
    'Bass Drop',
    'A shockwave erupts around you.',
    { damage: 22, cooldown: 2.6, radius: 135 },
    [{ mult: { radius: 1.2 } }, { mult: { damage: 1.4 } }, { mult: { cooldown: 0.8 } }, { extra: 1 }],
    ['Periodic shockwave around you with heavy knockback.', '+20% shockwave radius.', '+40% shockwave damage.', 'Drops 20% more often.', 'Double drop: a second wave follows.'],
  ),
  zap: W(
    'zap',
    'Wi-Fi Zap',
    'Lightning jumps between nearby enemies.',
    { damage: 16, cooldown: 1.15, count: 1, chains: 2, radius: 330 },
    [{ chains: 1 }, { mult: { damage: 1.35 } }, { chains: 1, mult: { cooldown: 0.8 } }, { count: 1 }],
    ['Zaps the nearest enemy and chains to 2 more.', '+1 chain hop.', '+35% zap damage.', '+1 chain hop, zaps 20% faster.', 'Forks: hits a second target each zap.'],
  ),
  homing: W(
    'homing',
    'Reply Guys',
    'Homing missiles that never let it go.',
    { damage: 20, cooldown: 1.6, count: 2, speed: 380, radius: 42 },
    [{ count: 1 }, { mult: { damage: 1.3 } }, { mult: { radius: 1.35 } }, { count: 1, mult: { damage: 1.15 } }],
    ['Launches 2 homing missiles that explode on impact.', '+1 missile.', '+30% missile damage.', '+35% explosion radius.', '+1 missile, +15% damage.'],
  ),
  puddle: W(
    'puddle',
    'Tea Spill',
    'Spills scalding tea that burns and slows.',
    { damage: 18, cooldown: 3, count: 1, radius: 58, duration: 3.2 },
    [{ mult: { radius: 1.25 } }, { mult: { damage: 1.4 } }, { count: 1 }, { count: 1, mult: { duration: 1.5 } }],
    ['Spills a burning puddle that slows enemies (damage per second).', '+25% puddle size.', '+40% burn damage.', '+1 puddle per spill.', '+1 puddle, puddles last 50% longer.'],
  ),
};

export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[];
export const WEAPON_MAX_LEVEL = 5;

/** Flat parameters of a weapon at a level (1..5), before player stats are applied. */
export function weaponAt(id: WeaponId, level: number): WeaponParams {
  const def = WEAPONS[id];
  const p: WeaponParams = { ...def.base };
  for (let l = 2; l <= Math.min(level, WEAPON_MAX_LEVEL); l++) {
    const d = def.levels[l - 2];
    for (const k of Object.keys(d) as Array<keyof typeof d>) {
      if (k === 'mult') continue;
      (p as unknown as Record<string, number>)[k] += d[k] as number;
    }
    if (d.mult) for (const [k, m] of Object.entries(d.mult)) (p as unknown as Record<string, number>)[k] *= m as number;
  }
  return p;
}
