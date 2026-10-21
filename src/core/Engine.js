// ============================================================================
// DANTE QUEST — Core Game Engine & Simulation Loop (60 FPS Fixed Timestep)
// ============================================================================

import { Camera } from './Camera.js';
import { InputSystem } from './Input.js';
import { sound } from './Audio.js';
import { ProceduralWorld } from '../world/ProceduralWorld.js';
import { ProceduralDungeon } from '../world/Dungeon.js';
import { LightingSystem } from '../world/Lighting.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { CircleBoss } from '../entities/CircleBoss.js';
import { MapEvents } from '../systems/MapEvents.js';
import { MAPS } from '../systems/Maps.js';
import { DropSystem } from '../entities/Drop.js';
import { ParticleSystem } from '../entities/Particle.js';
import { ProjectileSystem } from '../entities/Projectile.js';
import { WeaponSystem } from '../systems/Weapons.js';
import { getRandomUpgrades, applyUpgrade } from '../systems/Upgrades.js';
import { saveData } from '../systems/SaveData.js';
import { enemyHealthMultiplier, bossHealthMultiplier, stageReward } from '../systems/StageRules.js';

export class GameEngine {
  constructor(canvas, hud, menus) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.menus = menus;

    this.camera = new Camera(canvas.width, canvas.height);
    this.input = new InputSystem();
    this.lighting = new LightingSystem();
    this.drops = new DropSystem();
    this.particles = new ParticleSystem();
    this.projectiles = new ProjectileSystem();
    this.weapons = new WeaponSystem();
    this.events = new MapEvents();

    this.world = new ProceduralWorld(Math.floor(Math.random() * 10000));
    this.dungeon = new ProceduralDungeon(Math.floor(Math.random() * 10000));

    this.players = [];
    this.localPlayer = null;
    this.enemies = [];
    this.boss = null;

    this.currentMapId = 'bosque';
    this.isDungeon = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.gameTime = 0; // seconds

    this.spawnTimer = 0;
    this.spawnInterval = 1.0;
    this.maxEnemies = 250;

    this.lastTime = performance.now();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    // Use CSS pixels rather than devicePixelRatio: high-density phones should
    // not pay for a full physical-resolution lighting buffer each frame.
    this.canvas.width = Math.round(window.visualViewport?.width || window.innerWidth);
    this.canvas.height = Math.round(window.visualViewport?.height || window.innerHeight);
    this.camera.resize(this.canvas.width, this.canvas.height);
    this.lighting.resize(this.canvas.width, this.canvas.height);
    if (this.isPlaying) this.render();
  }

  startSession(charId = 'dante', mapId = 'bosque') {
    this.input.reset();
    this.lastTime = performance.now();
    sound.resume();
    sound.init();
    sound.playMusic();

    mapId = MAPS[mapId] ? mapId : 'bosque';
    this.currentMapId = mapId;
    this.events = new MapEvents(mapId);
    this.isDungeon = false;
    this.gameTime = 0;
    this.enemies = [];
    this.boss = null;
    this.drops.drops = [];
    this.spawnTimer = 0;
    this.particles.particles = [];
    this.particles.floatingTexts = [];
    this.particles.slashes = [];
    this.projectiles.projectiles = [];

    // Re-seed world with selected map
    this.world = new ProceduralWorld(Math.floor(Math.random() * 10000), mapId);
    this.dungeon = new ProceduralDungeon(Math.floor(Math.random() * 10000), mapId);

    // Create Local Player
    this.localPlayer = new Player('local', charId, 0, 0, true);

    // Apply Meta Upgrades
    const meta = saveData.data.metaUpgrades;
    if (meta.health) this.localPlayer.maxHp += meta.health * 15;
    this.localPlayer.hp = this.localPlayer.maxHp;
    if (meta.attack) this.localPlayer.stats.attack = Math.round(this.localPlayer.stats.attack * (1 + meta.attack * 0.08));
    if (meta.speed) this.localPlayer.stats.speed = Math.round(this.localPlayer.stats.speed * (1 + meta.speed * 0.06));
    if (meta.magnet) this.localPlayer.stats.pickupRadius = Math.round(this.localPlayer.stats.pickupRadius * (1 + meta.magnet * 0.20));

    this.players = [this.localPlayer];
    this.isPlaying = true;
    this.isPaused = false;

    this.menus.showHUD();
  }

  update(currentTime) {
    if (!this.isPlaying) return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Allow toggling pause with keyboard (P / Escape)
    if (this.input.consumePause()) {
      this.togglePause();
      return;
    }

    if (this.isPaused) return;

    this.gameTime += dt;
    const player = this.localPlayer;
    let activeWorld = this.isDungeon ? this.dungeon : this.world;

    // 1. Process Local Player Input
    const moveVector = this.input.getMovementVector();

    if (this.input.consumeDodge()) {
      if (player.triggerDodge(moveVector)) {
        sound.playDodge();
      }
    }

    if (this.input.consumeSkill()) {
      if (player.triggerSkill()) {
        player.triggerAttackAnim(0.45);
        sound.playBossRoar();
        this.particles.addFloatingText(player.x, player.y - 30, `¡${player.charData.skillName.toUpperCase()}!`, '#f59e0b', 18, true);
        this.camera.shake(8, 0.2);
      }
    }

    // 2. Update Players
    this.events.update(dt, {
      time: this.gameTime, players: this.players, world: activeWorld,
      bossActive: Boolean(this.boss), isDungeon: this.isDungeon
    });
    for (const p of this.players) {
      p.update(dt, p === player ? moveVector : { x: 0, y: 0 }, activeWorld);
    }
    if (!this.isDungeon) this.events.applyForces(this.players, activeWorld, dt);

    // Co-op Revival Logic: Living player standing in fallen teammate's ring
    if (this.players.length > 1) {
      for (const downed of this.players) {
        if (!downed.isDowned) continue;
        for (const rescuer of this.players) {
          if (!rescuer.isAlive || rescuer.isDowned) continue;
          if (Math.hypot(rescuer.x - downed.x, rescuer.y - downed.y) < 40) {
            downed.reviveProgress += dt * 0.45; // ~2.2s to revive
            if (downed.reviveProgress >= 1.0) {
              downed.isDowned = false;
              downed.hp = Math.round(downed.maxHp * 0.5);
              downed.reviveProgress = 0;
              this.particles.addFloatingText(downed.x, downed.y - 20, '¡REVIVIDO!', '#22c55e', 18, true);
              sound.playLevelUp();
            }
          }
        }
      }
    }

    // Check Party Wipe (Game Over)
    const allDowned = this.players.every(p => !p.isAlive || p.isDowned);
    if (allDowned) {
      this.handleGameOver(false);
      return;
    }

    // 3. Update Camera to smoothly track player
    this.camera.setTarget(player.x, player.y);
    this.camera.update(dt);

    // 4. Update Procedural World Chunks
    if (!this.isDungeon) {
      this.world.update(player.x, player.y);

      // Check Crypt Entrance Portal collision (Multiple Dungeons)
      for (const entrance of (this.world.dungeonEntrances || [this.world.cryptEntrance])) {
        const dCrypt = Math.hypot(player.x - entrance.x, player.y - entrance.y);
        if (dCrypt < entrance.radius && !this.boss) {
          this.enterDungeon(entrance);
          break;
        }
      }

      // Check Surface Rare Chests
      if (this.world.surfaceChests) {
        for (const chest of this.world.surfaceChests) {
          if (!chest.opened && Math.hypot(player.x - chest.x, player.y - chest.y) < chest.radius + player.radius) {
            chest.opened = true;
            sound.playLevelUp();
            this.drops.spawnHealthPotion(chest.x, chest.y);
            this.drops.spawnXpGem(chest.x + 10, chest.y, 60);
            const soulReward = chest.lootValue || 35;
            player.souls += soulReward;
            this.particles.addFloatingText(chest.x, chest.y - 25, `¡COFRE ANCESTRAL! +${soulReward} 🪙`, '#f59e0b', 18, true);
            this.camera.shake(5, 0.18);
          }
        }
      }

      // Check Altar Boss Awakening
      const dAltar = Math.hypot(player.x - this.world.altar.x, player.y - this.world.altar.y);
      if (dAltar < this.world.altar.radius && !this.world.altar.activated && !this.boss) {
        this.world.altar.activated = true;
        this.spawnBoss(this.world.altar.x, this.world.altar.y - 120);
      }
    } else {
      // Dungeon Exit Portal
      const dExit = Math.hypot(player.x - this.dungeon.exitPortal.x, player.y - this.dungeon.exitPortal.y);
      if (dExit < this.dungeon.exitPortal.radius) {
        this.exitDungeon();
      }

      // Dungeon Chests
      for (const chest of this.dungeon.chests) {
        if (!chest.opened && Math.hypot(player.x - chest.x, player.y - chest.y) < chest.radius + player.radius) {
          chest.opened = true;
          sound.playLevelUp();
          this.drops.spawnHealthPotion(chest.x, chest.y);
          this.drops.spawnXpGem(chest.x + 10, chest.y, 50);
          player.souls += 20;
          this.particles.addFloatingText(chest.x, chest.y - 20, '¡TESORO! +20 🪙', '#e6b849', 16, true);
        }
      }
    }

    // 5. Horde Spawning Loop
    activeWorld = this.isDungeon ? this.dungeon : this.world;
    this.updateHordeSpawning(dt, player);

    // 6. Update Weapons & Auto-Attacks
    this.weapons.update(dt, this.players, this.enemies, this.boss, this.projectiles, this.particles, sound, this.camera);

    // 7. Update Projectiles
    this.projectiles.update(dt, this.enemies, this.players, this.boss, this.particles, sound, this.camera);

    // 8. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.isAlive) {
        if (e.type === 'mireling' && !this.isDungeon && !this.boss) {
          this.events.addZone('puddle', e.x, e.y, { radius: 38, duration: 20, source: 'creature' });
        }
        // Drop XP and Souls (with bonus in Limbo)
        const xpAmount = stageReward(this.currentMapId, e.xpValue);
        const soulsAmount = stageReward(this.currentMapId, e.isElite ? 5 : 1);
        this.drops.spawnXpGem(e.x, e.y, xpAmount);
        player.kills += 1;
        player.souls += soulsAmount;

        if (Math.random() < 0.25) {
          sound.playZombie();
        }

        // Chance of potion
        if (Math.random() < 0.08) {
          this.drops.spawnHealthPotion(e.x, e.y);
        }

        this.enemies.splice(i, 1);
        continue;
      }
      e.update(dt, this.players, activeWorld, this.enemies, this.projectiles);
    }

    // 9. Update Boss
    if (this.boss) {
      if (!this.boss.isAlive) {
        this.handleBossVictory();
        return;
      } else {
        this.boss.update(
          dt,
          this.players,
          this.particles,
          sound,
          this.camera,
          (bx, by, count) => this.spawnMinionsAround(bx, by, count),
          (px, py, vx, vy, spd, dmg, type) => this.projectiles.spawn(px, py, vx, vy, spd, dmg, type, 1, true),
          { events: this.events, world: activeWorld }
        );
      }
    }

    // 10. Update Drops (Magnetic collection & Level Ups)
    this.drops.update(
      dt,
      this.players,
      (collector, amount) => {
        sound.playGem();
        if (collector.addXp(amount)) {
          this.triggerLevelUp(collector);
        }
      },
      (collector, amount) => {
        sound.playHit();
        collector.heal(amount);
        this.particles.addFloatingText(collector.x, collector.y - 20, `+${amount} HP`, '#22c55e', 14);
      }
    );

    // 11. Update Particles & Floating Text
    this.particles.update(dt);

    // 12. Update HUD
    this.hud.update(player, this.gameTime, this.boss, this.isDungeon, this.world, this.players, this.currentMapId, this.isDungeon ? '' : this.events.status);
  }

  updateHordeSpawning(dt, player) {
    if (this.enemies.length >= this.maxEnemies) return;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      // Scale spawn rate with time survived
      this.spawnInterval = this.currentMapId !== 'bosque'
        ? Math.max(0.18, 1.0 - (this.gameTime / 150))
        : Math.max(0.2, 1.2 - (this.gameTime / 180));
      this.spawnTimer = this.spawnInterval;

      // Determine batch count
      const batch = 2 + Math.floor(this.gameTime / 60);

      for (let i = 0; i < batch && this.enemies.length < this.maxEnemies; i++) {
        const spawnDist = 420 + Math.random() * 80;
        const angle = Math.random() * Math.PI * 2;
        const sx = player.x + Math.cos(angle) * spawnDist;
        const sy = player.y + Math.sin(angle) * spawnDist;

        // Choose enemy type based on survival time and stage
        let type = 'zombie';
        const rand = Math.random();

        if (this.currentMapId === 'lujuria') {
          type = rand < 0.42 ? 'tempest_soul' : rand < 0.7 ? 'siren' : this.gameTime > 90 && rand < 0.85 ? 'knight' : 'wraith';
        } else if (this.currentMapId === 'gula') {
          type = rand < 0.42 ? 'glutton' : rand < 0.78 ? 'mireling' : this.gameTime > 90 ? 'knight' : 'zombie';
        } else if (this.currentMapId === 'limbo') {
          if (this.gameTime > 120 && rand < 0.20) {
            type = 'vampire';
          } else if (this.gameTime > 75 && rand < 0.40) {
            type = 'demon';
          } else if (this.gameTime > 45 && rand < 0.60) {
            type = 'wraith';
          } else if (rand < 0.50) {
            type = 'knight';
          } else {
            type = 'slime';
          }
        } else {
          // Bosque de los Condenados
          if (this.gameTime > 150 && rand < 0.18) {
            type = 'vampire';
          } else if (this.gameTime > 100 && rand < 0.32) {
            type = 'demon';
          } else if (this.gameTime > 70 && rand < 0.48) {
            type = 'knight';
          } else if (this.gameTime > 40 && rand < 0.62) {
            type = 'plant';
          } else if (this.gameTime > 20 && rand < 0.74) {
            type = 'skeleton';
          } else if (rand < 0.45) {
            type = 'slime';
          } else {
            type = rand < 0.75 ? 'zombie' : 'wolf';
          }
        }

        const isElite = Math.random() < 0.08;
        this.spawnEnemy(type, sx, sy, isElite);
      }
    }
  }

  spawnBoss(x, y) {
    const isLimbo = this.currentMapId === 'limbo';
    const definition = MAPS[this.currentMapId].boss;
    const bossName = definition?.name || (isLimbo ? 'El Arconte de las Ánimas' : 'El Rey de los Condenados');
    this.boss = definition ? new CircleBoss(x, y, definition, this.players.length) : new Boss(x, y, this.players.length, bossName);
    this.events.clear();
    this.boss.maxHp = Math.ceil(this.boss.maxHp * bossHealthMultiplier(this.currentMapId, this.gameTime, this.encounterLevel()));
    this.boss.hp = this.boss.maxHp;
    sound.playBossRoar();
    this.camera.shake(16, 0.6);
    const announcement = definition ? (definition.kind === 'tempest' ? '¡LA TEMPESTAD DESPIERTA!' : '¡CERBERO DESPIERTA!') : `¡HA SURGIDO ${bossName.toUpperCase()}!`;
    this.particles.addFloatingText(x, y - 50, announcement, MAPS[this.currentMapId].terrain?.accent || '#c084fc', 20, true);
  }

  encounterLevel() {
    return Math.max(1, ...this.players.filter(p => p.isAlive && !p.isDowned).map(p => p.level));
  }

  spawnEnemy(type, x, y, isElite = false) {
    if (this.enemies.length >= this.maxEnemies) return;
    const multiplier = enemyHealthMultiplier(this.currentMapId, this.gameTime, this.encounterLevel());
    this.enemies.push(new Enemy(type, x, y, isElite, multiplier));
  }

  spawnMinionsAround(x, y, count = 6) {
    for (let i = 0; i < count && this.enemies.length < this.maxEnemies; i++) {
      const a = (Math.PI * 2 / count) * i;
      const ex = x + Math.cos(a) * 90;
      const ey = y + Math.sin(a) * 90;
      this.spawnEnemy('zombie', ex, ey);
    }
  }

  enterDungeon(entrance = null) {
    this.events.clear();
    this.projectiles.projectiles = [];
    this.currentEntrance = entrance || (this.world.dungeonEntrances && this.world.dungeonEntrances[0]) || this.world.cryptEntrance;
    this.isDungeon = true;
    const seed = this.currentEntrance.seed || Math.floor(Math.random() * 10000);
    this.dungeon = new ProceduralDungeon(seed, this.currentMapId);
    this.localPlayer.x = this.dungeon.spawnPoint.x;
    this.localPlayer.y = this.dungeon.spawnPoint.y;
    this.enemies = [];
    this.camera.shake(6, 0.2);
    sound.playBossRoar();
    const title = this.currentEntrance.name ? `⚡ ${this.currentEntrance.name.toUpperCase()} ⚡` : '⚡ DESCENDIENDO A LA CRIPTA ⚡';
    this.particles.addFloatingText(this.localPlayer.x, this.localPlayer.y - 30, title, '#a855f7', 18, true);
  }

  exitDungeon() {
    this.events.clear();
    this.projectiles.projectiles = [];
    this.isDungeon = false;
    const returnPt = this.currentEntrance || this.world.cryptEntrance;
    this.localPlayer.x = returnPt.x + 50;
    this.localPlayer.y = returnPt.y;
    this.enemies = [];
    this.particles.addFloatingText(this.localPlayer.x, this.localPlayer.y - 30, '⚡ REGRESO A LA SUPERFICIE ⚡', '#38bdf8', 18);
  }

  togglePause() {
    if (!this.isPlaying) return;
    if (this.menus.levelUpModal && !this.menus.levelUpModal.classList.contains('hidden')) return;
    if (this.menus.endGameModal && !this.menus.endGameModal.classList.contains('hidden')) return;

    this.isPaused = !this.isPaused;
    this.input.reset();
    if (this.isPaused) {
      sound.suspend();
      this.menus.showPause(
        () => {
          this.isPaused = false;
          this.lastTime = performance.now();
          this.menus.hidePause();
          this.input.reset();
          sound.resume();
        },
        () => {
          this.isPaused = false;
          this.menus.hidePause();
          this.isPlaying = false;
          this.input.reset();
          sound.stopMusic();
          this.menus.showScreen(this.menus.screenMenu);
        },
        () => {
          return sound.toggleSound();
        }
      );
    } else {
      sound.resume();
      this.lastTime = performance.now();
      this.menus.hidePause();
    }
  }

  triggerLevelUp(player) {
    sound.playLevelUp();
    this.particles.addFloatingText(player.x, player.y - 40, '¡SUBIDA DE NIVEL!', '#38bdf8', 20, true);
    this.particles.addSpark(player.x, player.y, '#38bdf8', 25);

    if (player.isLocal) {
      this.input.reset();
      this.isPaused = true;
      const choices = getRandomUpgrades(3, player);
      this.menus.showLevelUp(choices, (selectedUpgrade) => {
        applyUpgrade(player, selectedUpgrade);
        this.isPaused = false;
        sound.resume();
        this.input.reset();
        this.lastTime = performance.now();
      });
    }
  }

  handleBossVictory() {
    this.boss = null;
    sound.playLevelUp();
    this.camera.shake(20, 0.8);

    const p = this.localPlayer;
    p.souls += stageReward(this.currentMapId, 100);
    this.events.clear();
    this.handleGameOver(true);
  }

  handleGameOver(isVictory) {
    this.isPlaying = false;
    const p = this.localPlayer;
    saveData.addSouls(p.souls);
    saveData.recordRun(p.kills, p.level, Math.floor(this.gameTime), isVictory);

    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.menus.showEndGame(isVictory, timeStr, p.kills, p.level, p.souls);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.isPlaying) return;

    // Apply Camera translation & zoom
    this.camera.applyTransform(ctx);

    // 1. World or Dungeon Tiles & Obstacles
    if (this.isDungeon) {
      this.dungeon.render(ctx, this.camera);
    } else {
      this.world.render(ctx, this.camera);
    }

    // 2. Drops (XP Gems & Potions)
    if (!this.isDungeon) this.events.render(ctx, this.camera);
    this.drops.render(ctx, this.camera);

    // 3. Enemies
    for (const enemy of this.enemies) {
      enemy.render(ctx, this.camera);
    }

    // 4. Boss
    if (this.boss && this.boss.isAlive) {
      this.boss.render(ctx, this.camera);
    }

    // 5. Players
    for (const p of this.players) {
      p.render(ctx, this.camera);
    }

    // 6. Projectiles
    this.projectiles.render(ctx, this.camera);

    // 7. Orbiting Weapons & Slashes
    this.weapons.render(ctx, this.camera, this.players);
    this.particles.render(ctx, this.camera);

    // Restore Camera
    this.camera.restoreTransform(ctx);

    // 8. Dynamic Lighting & Fog of War Mask (Rendered in screen space)
    const torches = this.isDungeon ? this.dungeon.torches : this.world.torches;
    this.lighting.render(ctx, this.camera, this.localPlayer, torches, this.isDungeon, this.projectiles.projectiles, this.particles.particles, this.currentMapId);
    if (!this.isDungeon) this.events.renderWeather(ctx, this.canvas.width, this.canvas.height);
  }
}
