import { BALANCE } from '../config/balance';

/** Every player stat that upgrades can touch. Multipliers start at 1. */
export interface Stats {
  maxHp: number;
  regen: number; // hp per second
  moveSpeed: number;
  damageMult: number;
  fireRateMult: number;
  areaMult: number;
  projSpeedMult: number;
  durationMult: number;
  extraProjectiles: number;
  pierce: number;
  critChance: number;
  critMult: number;
  pickupRadius: number;
  xpMult: number;
  damageTaken: number; // multiplier on incoming damage (lower is better)
  dashCooldown: number;
  dashInvulnExtra: number;
  enemySpeedMult: number;
  luck: number; // shifts upgrade rarity odds
}

export function baseStats(): Stats {
  const p = BALANCE.player;
  return {
    maxHp: p.maxHp,
    regen: 0,
    moveSpeed: p.moveSpeed,
    damageMult: 1,
    fireRateMult: 1,
    areaMult: 1,
    projSpeedMult: 1,
    durationMult: 1,
    extraProjectiles: 0,
    pierce: 0,
    critChance: p.critChance,
    critMult: p.critMult,
    pickupRadius: p.pickupRadius,
    xpMult: 1,
    damageTaken: 1,
    dashCooldown: p.dash.cooldown,
    dashInvulnExtra: p.dash.invulnExtra,
    enemySpeedMult: 1,
    luck: 0,
  };
}

/** Clamp derived stats into sane ranges so stacking can never break the economy. */
export function sanitizeStats(s: Stats): Stats {
  s.maxHp = Math.max(20, Math.round(s.maxHp));
  s.critChance = Math.min(0.85, Math.max(0, s.critChance));
  s.damageTaken = Math.max(0.45, s.damageTaken);
  s.dashCooldown = Math.max(0.5, s.dashCooldown);
  s.fireRateMult = Math.min(4, s.fireRateMult);
  s.moveSpeed = Math.min(420, s.moveSpeed);
  s.regen = Math.min(6, s.regen);
  return s;
}
