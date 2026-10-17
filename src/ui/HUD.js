// ============================================================================
// DANTE QUEST — HUD & In-Game Interface (Bars, Minimap, Boss Meter)
// ============================================================================

export class HUDSystem {
  constructor() {
    this.hpBarFill = document.getElementById('hp-bar-fill');
    this.hpText = document.getElementById('hp-text');
    this.xpBarFill = document.getElementById('xp-bar-fill');
    this.xpText = document.getElementById('xp-text');
    this.levelBadge = document.getElementById('hud-level-badge');
    this.timerDisplay = document.getElementById('hud-timer');
    this.killsDisplay = document.getElementById('hud-kills');
    this.soulsDisplay = document.getElementById('hud-souls');
    this.weaponsBar = document.getElementById('hud-weapons-bar');
    this.partyContainer = document.getElementById('party-hud-container');
    this.bossBarContainer = document.getElementById('boss-bar-container');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossPhaseBadge = document.getElementById('boss-phase-badge');

    // Minimap
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }

  update(player, gameTime, boss, isDungeon, world, party = []) {
    // 1. Player HP Bar
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    if (this.hpBarFill) this.hpBarFill.style.width = `${hpPct}%`;
    if (this.hpText) this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp} HP`;

    // 2. Player XP Bar
    const xpPct = Math.max(0, Math.min(100, (player.xp / player.xpToNext) * 100));
    if (this.xpBarFill) this.xpBarFill.style.width = `${xpPct}%`;
    if (this.xpText) this.xpText.textContent = `${player.xp} / ${player.xpToNext} XP`;
    if (this.levelBadge) this.levelBadge.textContent = `LV ${player.level}`;

    // 3. Timer
    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 4. Kills & Souls
    if (this.killsDisplay) this.killsDisplay.textContent = player.kills;
    if (this.soulsDisplay) this.soulsDisplay.textContent = player.souls;

    // 5. Boss Bar
    if (boss && boss.isAlive) {
      if (this.bossBarContainer) this.bossBarContainer.classList.remove('hidden');
      const bPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      if (this.bossHpFill) this.bossHpFill.style.width = `${bPct}%`;
      if (this.bossPhaseBadge) this.bossPhaseBadge.textContent = `FASE ${boss.phase}`;
    } else {
      if (this.bossBarContainer) this.bossBarContainer.classList.add('hidden');
    }

    // 6. Weapons Bar
    this.renderWeaponsBar(player);

    // 7. Minimap
    this.renderMinimap(player, boss, isDungeon, world);
  }

  renderWeaponsBar(player) {
    if (!this.weaponsBar) return;
    const iconImages = {
      espadon: '/assets/greatsword-blade-with-steel-glow-icon-da-cmvbmtz6.png',
      cuchillas: '/assets/three-spinning-curved-throwing-daggers-w-cmvbmu71.png',
      bola_fuego: '/assets/blazing-magical-fireball-with-orange-fla-cmvbmufg.png',
      rayos: '/assets/crackling-blue-electric-lightning-storm-cmvbmumm.png',
      arco_largo: '/assets/elven-recurve-bow-with-glowing-arrow-not-cmvbmutz.png'
    };

    let html = '';
    for (const w of player.weapons) {
      const imgSrc = iconImages[w.id];
      html += `
        <div class="weapon-slot">
          ${imgSrc ? `<img src="${imgSrc}" class="weapon-slot-img" alt="${w.id}">` : '<span>⚔️</span>'}
          <span class="slot-level">L${w.level}</span>
        </div>
      `;
    }
    this.weaponsBar.innerHTML = html;
  }

  renderMinimap(player, boss, isDungeon, world) {
    if (!this.minimapCtx) return;
    const mCtx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    // Background
    mCtx.fillStyle = '#08060c';
    mCtx.fillRect(0, 0, w, h);

    const scale = 0.055; // World to minimap scale
    const cx = w / 2;
    const cy = h / 2;

    if (!isDungeon && world) {
      // Draw Crypt Entrance
      const cryptX = cx + (world.cryptEntrance.x - player.x) * scale;
      const cryptY = cy + (world.cryptEntrance.y - player.y) * scale;
      if (cryptX >= 0 && cryptX <= w && cryptY >= 0 && cryptY <= h) {
        mCtx.fillStyle = '#38bdf8';
        mCtx.beginPath();
        mCtx.arc(cryptX, cryptY, 4, 0, Math.PI * 2);
        mCtx.fill();
      }

      // Draw Altar
      const altarX = cx + (world.altar.x - player.x) * scale;
      const altarY = cy + (world.altar.y - player.y) * scale;
      if (altarX >= 0 && altarX <= w && altarY >= 0 && altarY <= h) {
        mCtx.fillStyle = '#e6b849';
        mCtx.beginPath();
        mCtx.arc(altarX, altarY, 4, 0, Math.PI * 2);
        mCtx.fill();
      }
    }

    // Draw Boss on Minimap
    if (boss && boss.isAlive) {
      const bX = cx + (boss.x - player.x) * scale;
      const bY = cy + (boss.y - player.y) * scale;
      if (bX >= 0 && bX <= w && bY >= 0 && bY <= h) {
        mCtx.fillStyle = '#ef4444';
        mCtx.beginPath();
        mCtx.arc(bX, bY, 5, 0, Math.PI * 2);
        mCtx.fill();
      }
    }

    // Player position (Center)
    mCtx.fillStyle = '#22c55e';
    mCtx.beginPath();
    mCtx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    mCtx.fill();
  }
}
