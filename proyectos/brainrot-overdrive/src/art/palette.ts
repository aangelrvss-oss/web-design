/**
 * Colour language:
 *  - cool (cyan / violet / magenta) = the player, their attacks, rewards
 *  - warm (orange / red)            = danger: enemy bullets, telegraphs, hazards
 *  - gold                           = elites, crits, rare loot
 * Creatures share an ink outline + neon rim light so they read as one universe.
 */
export const PAL = {
  void: 0x07040f,
  deep: 0x120822,
  floor: 0x160b2a,
  violet: 0x7b3dff,
  violetDim: 0x3a1a78,
  cyan: 0x3ee6ff,
  magenta: 0xff3fa4,
  gold: 0xffc84a,
  danger: 0xff5a2e,
  dangerHot: 0xff2d55,
  ink: 0x12061f,
  white: 0xffffff,
  grass: 0x5dff8a,
} as const;

export const css = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
