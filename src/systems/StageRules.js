import { MAPS } from './Maps.js';

// Snapshot these multipliers at spawn, never while a combatant is alive.
export function enemyHealthMultiplier(mapId, seconds, level = 1) {
  const map = MAPS[mapId] || MAPS.bosque;
  return map.enemyMultiplier * (1 + 0.08 * Math.max(0, seconds) / 60 + 0.01 * Math.max(0, level - 1));
}

export function bossHealthMultiplier(mapId, seconds, level = 1) {
  const map = MAPS[mapId] || MAPS.bosque;
  return map.enemyMultiplier * (1 + 0.04 * Math.max(0, seconds) / 60 + 0.005 * Math.max(0, level - 1));
}

export function stageReward(mapId, amount) {
  return Math.max(1, Math.round(amount * (MAPS[mapId] || MAPS.bosque).soulsMultiplier));
}
