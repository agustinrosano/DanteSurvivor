// ============================================================================
// DANTE QUEST — Persistence System (LocalStorage Saves, Souls & Unlocks)
// ============================================================================

const SAVE_KEY = 'DANTE_QUEST_SAVE_DATA_V1';

const DEFAULT_DATA = {
  souls: 0,
  unlockedCharacters: ['dante', 'lyra', 'kael', 'morgana', 'thorin'],
  selectedCharacter: 'dante',
  selectedMap: 'bosque',
  metaUpgrades: {
    health: 0,
    attack: 0,
    speed: 0,
    magnet: 0
  },
  stats: {
    totalKills: 0,
    highestLevel: 1,
    bestTimeSeconds: 0,
    bossesDefeated: 0
  }
};

export class SaveDataSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        return { ...DEFAULT_DATA, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return { ...DEFAULT_DATA };
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  addSouls(amount) {
    this.data.souls += amount;
    this.save();
  }

  recordRun(kills, level, timeSeconds, bossDefeated) {
    this.data.stats.totalKills += kills;
    if (level > this.data.stats.highestLevel) this.data.stats.highestLevel = level;
    if (timeSeconds > this.data.stats.bestTimeSeconds) this.data.stats.bestTimeSeconds = timeSeconds;
    if (bossDefeated) this.data.stats.bossesDefeated += 1;
    this.save();
  }

  buyUpgrade(type, cost) {
    if (this.data.souls >= cost && (this.data.metaUpgrades[type] || 0) < 5) {
      this.data.souls -= cost;
      this.data.metaUpgrades[type] = (this.data.metaUpgrades[type] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }
}

export const saveData = new SaveDataSystem();
