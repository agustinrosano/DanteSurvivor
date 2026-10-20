// ============================================================================
// DANTE QUEST — Menu Navigation & Screens Manager
// ============================================================================

import { CHARACTERS } from '../systems/Characters.js';
import { MAPS } from '../systems/Maps.js';
import { saveData } from '../systems/SaveData.js';

export class MenuSystem {
  constructor(callbacks) {
    this.callbacks = callbacks; // onStartSolo, onStartCoop, onSelectChar

    // Screens
    this.screenMenu = document.getElementById('menu-screen');
    this.screenCharacter = document.getElementById('character-screen');
    this.screenLobby = document.getElementById('lobby-screen');
    this.screenSanctuary = document.getElementById('sanctuary-screen');
    this.hud = document.getElementById('hud');
    this.levelUpModal = document.getElementById('level-up-modal');
    this.endGameModal = document.getElementById('end-game-modal');

    // Stepper elements
    this.stepTabHero = document.getElementById('step-tab-hero');
    this.stepTabMap = document.getElementById('step-tab-map');
    this.stepPanelHero = document.getElementById('step-panel-hero');
    this.stepPanelMap = document.getElementById('step-panel-map');
    this.mapsContainer = document.getElementById('maps-roster-container');
    this.mapSummaryBar = document.getElementById('map-summary-bar');

    this.selectedCharId = saveData.data.selectedCharacter || 'dante';
    this.selectedMapId = saveData.data.selectedMap || 'bosque';

    this.initEventListeners();
    this.renderRoster();
    this.renderMaps();
  }

  showScreen(screen) {
    [this.screenMenu, this.screenCharacter, this.screenLobby, this.screenSanctuary].forEach(s => {
      if (s) s.classList.add('hidden');
    });
    if (this.hud) this.hud.classList.add('hidden');
    if (this.levelUpModal) this.levelUpModal.classList.add('hidden');
    if (this.endGameModal) this.endGameModal.classList.add('hidden');

    if (screen) screen.classList.remove('hidden');
  }

  showHUD() {
    this.showScreen(null);
    if (this.hud) this.hud.classList.remove('hidden');
  }

  setSetupStep(step) {
    if (step === 'hero') {
      this.stepTabHero?.classList.add('active');
      this.stepTabMap?.classList.remove('active');
      this.stepPanelHero?.classList.remove('hidden');
      this.stepPanelMap?.classList.add('hidden');
      this.renderRoster();
    } else if (step === 'map') {
      this.stepTabHero?.classList.remove('active');
      this.stepTabMap?.classList.add('active');
      this.stepPanelHero?.classList.add('hidden');
      this.stepPanelMap?.classList.remove('hidden');
      this.renderMaps();
    }
  }

  initEventListeners() {
    // Main Menu Buttons: JUGAR EN SOLITARIO leads to choosing hero and map
    document.getElementById('btn-play-solo')?.addEventListener('click', () => {
      this.showScreen(this.screenCharacter);
      this.setSetupStep('hero');
    });

    document.getElementById('btn-multiplayer')?.addEventListener('click', () => {
      this.showScreen(this.screenLobby);
      this.callbacks.onOpenLobby();
    });

    document.getElementById('btn-character-select')?.addEventListener('click', () => {
      this.showScreen(this.screenCharacter);
      this.setSetupStep('hero');
    });

    document.getElementById('btn-upgrades-meta')?.addEventListener('click', () => {
      this.showScreen(this.screenSanctuary);
      this.renderSanctuary();
    });

    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      const isEnabled = this.callbacks.onToggleSound();
      const soundText = document.getElementById('sound-icon');
      const btn = document.getElementById('btn-sound-toggle');
      if (soundText && btn) {
        btn.innerHTML = `<span id="sound-icon">${isEnabled ? '🔊' : '🔇'}</span> SONIDO: ${isEnabled ? 'ACTIVADO' : 'MUTED'}`;
      }
    });

    // Expedition Stepper Navigation
    this.stepTabHero?.addEventListener('click', () => this.setSetupStep('hero'));
    this.stepTabMap?.addEventListener('click', () => this.setSetupStep('map'));

    // Step 1 Actions
    document.getElementById('btn-char-back')?.addEventListener('click', () => {
      this.showScreen(this.screenMenu);
    });
    document.getElementById('btn-char-to-map')?.addEventListener('click', () => {
      saveData.data.selectedCharacter = this.selectedCharId;
      saveData.save();
      this.setSetupStep('map');
    });

    // Step 2 Actions
    document.getElementById('btn-map-back-to-hero')?.addEventListener('click', () => {
      this.setSetupStep('hero');
    });
    document.getElementById('btn-start-expedition')?.addEventListener('click', () => {
      saveData.data.selectedCharacter = this.selectedCharId;
      saveData.data.selectedMap = this.selectedMapId;
      saveData.save();
      this.callbacks.onStartSolo(this.selectedCharId, this.selectedMapId);
    });

    // Lobby Screen Back
    document.getElementById('btn-lobby-back')?.addEventListener('click', () => {
      this.showScreen(this.screenMenu);
    });

    // Sanctuary Screen Back
    document.getElementById('btn-sanctuary-back')?.addEventListener('click', () => {
      this.showScreen(this.screenMenu);
    });

    // End Game Retry / Menu
    document.getElementById('btn-end-retry')?.addEventListener('click', () => {
      this.endGameModal?.classList.add('hidden');
      this.callbacks.onStartSolo(this.selectedCharId, this.selectedMapId);
    });
    document.getElementById('btn-end-menu')?.addEventListener('click', () => {
      this.endGameModal?.classList.add('hidden');
      this.showScreen(this.screenMenu);
    });
  }

  renderRoster() {
    const container = document.getElementById('roster-container');
    if (!container) return;

    let html = '';
    for (const char of Object.values(CHARACTERS)) {
      const isActive = char.id === this.selectedCharId;
      html += `
        <div class="roster-card ${isActive ? 'active' : ''}" data-char="${char.id}">
          <div class="char-icon">${char.icon}</div>
          <div class="char-name">${char.name}</div>
          <div class="char-class">${char.className}</div>
        </div>
      `;
    }
    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('.roster-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.char;
        this.selectedCharId = id;
        this.renderRoster();
        this.renderHeroDetails(CHARACTERS[id]);
        this.renderMaps();
      });
    });

    this.renderHeroDetails(CHARACTERS[this.selectedCharId]);
  }

  renderHeroDetails(char) {
    const details = document.getElementById('hero-details');
    if (!details || !char) return;

    details.innerHTML = `
      <div class="hero-detail-portrait">
        <img src="${char.portrait}" alt="${char.name}">
      </div>
      <div class="hero-detail-info">
        <h3 class="hero-detail-title">${char.name} — ${char.className}</h3>
        <p class="hero-detail-desc">${char.description}</p>
        <p class="hero-detail-desc"><strong>Arma Inicial:</strong> ${char.weaponName} | <strong>Habilidad:</strong> ${char.skillName}</p>
        <div class="hero-stats-row">
          <div class="hero-stat-badge">❤️ HP: ${char.stats.hp}</div>
          <div class="hero-stat-badge">⚔️ ATQ: ${char.stats.attack}</div>
          <div class="hero-stat-badge">🛡️ DEF: ${char.stats.defense}</div>
          <div class="hero-stat-badge">⚡ VEL: ${char.stats.speed}</div>
          <div class="hero-stat-badge">🎯 CRIT: ${Math.round(char.stats.critChance * 100)}%</div>
        </div>
      </div>
    `;

    // Also update HUD avatar
    const hudAvatar = document.getElementById('hud-avatar-img');
    if (hudAvatar) hudAvatar.src = char.portrait;
  }

  renderMaps() {
    const container = this.mapsContainer || document.getElementById('maps-roster-container');
    if (!container) return;

    let html = '';
    for (const map of Object.values(MAPS)) {
      const isActive = map.id === this.selectedMapId;
      html += `
        <div class="map-card ${isActive ? 'active' : ''}" data-map="${map.id}">
          <div class="map-card-banner">
            <img src="${map.previewImg}" alt="${map.name}">
            <div class="map-card-badges">
              <span class="map-badge-act">${map.badge}</span>
              <span class="map-badge-diff" style="background: ${map.difficultyColor}CC;">${map.difficulty}</span>
            </div>
          </div>
          <div class="map-card-body">
            <h3 class="map-card-title">${map.icon} ${map.name}</h3>
            <div class="map-card-subtitle">${map.subtitle}</div>
            <p class="map-card-desc">${map.description}</p>
            <ul class="map-card-features">
              ${map.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <div class="map-select-indicator">
              ${isActive ? '✓ ESCENARIO SELECCIONADO' : 'SELECCIONAR ESCENARIO'}
            </div>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('.map-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.map;
        this.selectedMapId = id;
        saveData.data.selectedMap = id;
        saveData.save();
        this.renderMaps();
      });
    });

    // Update Summary Bar
    const summary = this.mapSummaryBar || document.getElementById('map-summary-bar');
    if (summary) {
      const char = CHARACTERS[this.selectedCharId];
      const map = MAPS[this.selectedMapId];
      summary.innerHTML = `
        <div>🛡️ <strong>Héroe:</strong> ${char ? `${char.name} (${char.className})` : 'Dante'}</div>
        <div>🗺️ <strong>Escenario:</strong> ${map ? `${map.name} [${map.badge}]` : 'El Bosque'}</div>
      `;
    }
  }

  renderSanctuary() {
    const grid = document.getElementById('sanctuary-grid');
    const soulsVal = document.getElementById('sanctuary-souls-val');
    if (soulsVal) soulsVal.textContent = saveData.data.souls;

    if (!grid) return;

    const upgrades = [
      { key: 'health', name: 'Vitalidad Ancestral', desc: '+15 HP Máximo inicial', baseCost: 30 },
      { key: 'attack', name: 'Filo Forjado', desc: '+8% Daño base inicial', baseCost: 40 },
      { key: 'speed', name: 'Zancada Veloz', desc: '+6% Velocidad de movimiento', baseCost: 35 },
      { key: 'magnet', name: 'Atracción de Almas', desc: '+20% Radio de recolección', baseCost: 25 }
    ];

    let html = '';
    for (const u of upgrades) {
      const level = saveData.data.metaUpgrades[u.key] || 0;
      const cost = u.baseCost * (level + 1);
      const isMax = level >= 5;

      html += `
        <div class="lobby-card">
          <h3>${u.name} (Nivel ${level}/5)</h3>
          <p>${u.desc}</p>
          <button class="medieval-btn btn-secondary buy-meta-btn" data-key="${u.key}" data-cost="${cost}" ${isMax || saveData.data.souls < cost ? 'disabled' : ''}>
            ${isMax ? 'MÁXIMO ALCANZADO' : `MEJORAR (${cost} 🪙)`}
          </button>
        </div>
      `;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.buy-meta-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const cost = parseInt(btn.dataset.cost);
        if (saveData.buyUpgrade(key, cost)) {
          this.renderSanctuary();
        }
      });
    });
  }

  showLevelUp(upgrades, onSelect) {
    if (!this.levelUpModal) return;
    const container = document.getElementById('upgrades-container');
    if (!container) return;

    let html = '';
    for (const up of upgrades) {
      html += `
        <div class="upgrade-card rarity-${up.rarity}" data-id="${up.id}">
          <div class="upgrade-icon">
            ${up.iconImg ? `<img src="${up.iconImg}" class="upgrade-icon-img" alt="${up.name}">` : up.icon}
          </div>
          <div class="upgrade-name">${up.name}</div>
          <div class="upgrade-desc">${up.desc}</div>
          <span class="upgrade-rarity-badge">${up.rarity}</span>
        </div>
      `;
    }
    container.innerHTML = html;

    container.querySelectorAll('.upgrade-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const selected = upgrades.find(u => u.id === id);
        this.levelUpModal.classList.add('hidden');
        onSelect(selected);
      });
    });

    this.levelUpModal.classList.remove('hidden');
  }

  showEndGame(isVictory, timeStr, kills, level, souls) {
    if (!this.endGameModal) return;
    const title = document.getElementById('end-game-title');
    const sub = document.getElementById('end-game-subtitle');

    if (title && sub) {
      if (isVictory) {
        title.textContent = '¡VICTORIA ÉPICA!';
        title.className = 'frame-title text-victory';
        sub.textContent = 'El Rey de los Condenados ha sido derrotado.';
      } else {
        title.textContent = 'HAS CAÍDO EN COMBATE';
        title.className = 'frame-title text-defeat';
        sub.textContent = 'El bosque reclama tu alma mortal...';
      }
    }

    document.getElementById('end-stat-time').textContent = timeStr;
    document.getElementById('end-stat-kills').textContent = kills;
    document.getElementById('end-stat-level').textContent = level;
    document.getElementById('end-stat-souls').textContent = `+${souls} 🪙`;

    this.endGameModal.classList.remove('hidden');
  }
}
