// ============================================================================
// DANTE QUEST — Level-Up Upgrades & Card Generator (Vampire Survivors Style)
// ============================================================================

export const ALL_UPGRADES = [
  // --- WEAPONS ---
  {
    id: 'espadon',
    name: 'Espadón Devastador',
    type: 'weapon',
    icon: '⚔️',
    iconImg: '/assets/greatsword-blade-with-steel-glow-icon-da-cmvbmtz6.png',
    rarity: 'rara',
    desc: 'Mejora el espadón: +30% daño de barrido y mayor alcance de corte.'
  },
  {
    id: 'cuchillas',
    name: 'Cuchillas Orbitantes',
    type: 'weapon',
    icon: '🗡️',
    iconImg: '/assets/three-spinning-curved-throwing-daggers-w-cmvbmu71.png',
    rarity: 'rara',
    desc: 'Añade una cuchilla de acero giratoria que descuartiza a los enemigos cercanos.'
  },
  {
    id: 'bola_fuego',
    name: 'Bola de Fuego',
    type: 'weapon',
    icon: '🔥',
    iconImg: '/assets/blazing-magical-fireball-with-orange-fla-cmvbmufg.png',
    rarity: 'epica',
    desc: 'Lanza esferas ígneas que explotan al impactar contra grupos de monstruos.'
  },
  {
    id: 'rayos',
    name: 'Rayos Encadenados',
    type: 'weapon',
    icon: '⚡',
    iconImg: '/assets/crackling-blue-electric-lightning-storm-cmvbmumm.png',
    rarity: 'epica',
    desc: 'Descargas eléctricas arcanas que saltan entre múltiples enemigos.'
  },
  {
    id: 'arco_largo',
    name: 'Arco Largo',
    type: 'weapon',
    icon: '🏹',
    iconImg: '/assets/elven-recurve-bow-with-glowing-arrow-not-cmvbmutz.png',
    rarity: 'comun',
    desc: 'Dispara flechas perforantes en ráfagas frontales rápidas que aumentan con nivel.'
  },
  {
    id: 'bomba_magica',
    name: 'Bombas Arcanas',
    type: 'weapon',
    icon: '🔮',
    iconImg: '/assets/sprites/vfx/magic_bomb_sheet.png',
    rarity: 'epica',
    desc: 'Lanza orbes mágicos que detonan en devastadoras explosiones de área rúnicas.'
  },
  {
    id: 'magia_misil',
    name: 'Misiles Arcanos',
    type: 'weapon',
    icon: '✨',
    iconImg: '/assets/sprites/vfx/arcane_missile_sheet.png',
    rarity: 'rara',
    desc: 'Conjura ráfagas de proyectiles mágicos teledirigidos que persiguen a los enemigos.'
  },

  // --- PASSIVES ---
  {
    id: 'fuerza_bruta',
    name: 'Fuerza de Titán',
    type: 'passive',
    icon: '💪',
    rarity: 'comun',
    desc: '+20% Daño en todas las armas y habilidades.'
  },
  {
    id: 'vitalidad',
    name: 'Corazón de Hierro',
    type: 'passive',
    icon: '❤️',
    rarity: 'comun',
    desc: '+35 Vida Máxima y cura 35 HP inmediatamente.'
  },
  {
    id: 'celeridad',
    name: 'Zancada Ágil',
    type: 'passive',
    icon: '👢',
    rarity: 'comun',
    desc: '+12% Velocidad de movimiento del héroe.'
  },
  {
    id: 'ojo_halcon',
    name: 'Ojo de Halcón',
    type: 'passive',
    icon: '🎯',
    rarity: 'rara',
    desc: '+8% Probabilidad de asestar Golpes Críticos (x2 daño).'
  },
  {
    id: 'iman_almas',
    name: 'Magnetismo Arcano',
    type: 'passive',
    icon: '🧲',
    rarity: 'comun',
    desc: '+40% Radio de atracción de cristales de experiencia.'
  },
  {
    id: 'armadura_placas',
    name: 'Blindaje de Acero',
    type: 'passive',
    icon: '🛡️',
    rarity: 'rara',
    desc: '+8 Defensa: reduce notablemente el daño recibido.'
  },
  {
    id: 'bendicion_divina',
    name: 'Bendición Divina',
    type: 'passive',
    icon: '✨',
    rarity: 'legendaria',
    desc: 'Cura el 100% de la vida y concede invulnerabilidad temporal.'
  }
];

export function getRandomUpgrades(count = 3, player) {
  // Shuffle array and pick 3
  const pool = [...ALL_UPGRADES];
  const selected = [];

  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const candidate = pool.splice(idx, 1)[0];
    selected.push(candidate);
  }

  return selected;
}

export function applyUpgrade(player, upgrade) {
  if (upgrade.type === 'weapon') {
    const existing = player.weapons.find(w => w.id === upgrade.id);
    if (existing) {
      existing.level += 1;
    } else {
      player.weapons.push({ id: upgrade.id, level: 1, timer: 0 });
    }
  } else if (upgrade.type === 'passive') {
    player.passives[upgrade.id] = (player.passives[upgrade.id] || 0) + 1;

    if (upgrade.id === 'fuerza_bruta') {
      player.stats.attack = Math.round(player.stats.attack * 1.2);
    } else if (upgrade.id === 'vitalidad') {
      player.maxHp += 35;
      player.hp = Math.min(player.maxHp, player.hp + 35);
    } else if (upgrade.id === 'celeridad') {
      player.stats.speed = Math.round(player.stats.speed * 1.12);
    } else if (upgrade.id === 'ojo_halcon') {
      player.stats.critChance += 0.08;
    } else if (upgrade.id === 'iman_almas') {
      player.stats.pickupRadius = Math.round(player.stats.pickupRadius * 1.4);
    } else if (upgrade.id === 'armadura_placas') {
      player.stats.defense += 8;
    } else if (upgrade.id === 'bendicion_divina') {
      player.hp = player.maxHp;
    }
  }
}
