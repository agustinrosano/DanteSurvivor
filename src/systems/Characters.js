// ============================================================================
// DANTE QUEST — Character Roster Definitions & Stats
// ============================================================================

export const CHARACTERS = {
  dante: {
    id: 'dante',
    name: 'Dante',
    className: 'Guerrero',
    icon: '⚔️',
    portrait: '/assets/dante-warrior-knight-in-shining-silver-p-cmvbmtru.png',
    unlocked: true,
    cost: 0,
    weapon: 'espadon',
    weaponName: 'Espada larga',
    description: 'Guerrero poderoso y resistente, maestro del combate cuerpo a cuerpo y barridos masivos de espada larga.',
    stats: {
      hp: 150,
      attack: 20,
      defense: 15,
      speed: 160,
      critChance: 0.05,
      pickupRadius: 75
    },
    skillName: 'Furia del Guerrero',
    skillDesc: 'Aumenta temporalmente el daño (+50%) y la velocidad de ataque durante 6 segundos.'
  },

  lyra: {
    id: 'lyra',
    name: 'Lyra',
    className: 'Hechicera',
    icon: '🔮',
    portrait: '/assets/lyra-dark-fantasy-medieval-sorceress-wit-cmvbm7k3.png',
    unlocked: true,
    cost: 50,
    weapon: 'bola_fuego',
    weaponName: 'Bastón de Fuego Arcano',
    description: 'Hechicera destructiva especializada en daño mágico en área, meteoritos y fuego devastador.',
    stats: {
      hp: 95,
      attack: 32,
      defense: 6,
      speed: 170,
      critChance: 0.12,
      pickupRadius: 90
    },
    skillName: 'Tormenta Ígnea',
    skillDesc: 'Desata una lluvia de meteoritos que calcina a todos los enemigos en pantalla.'
  },

  kael: {
    id: 'kael',
    name: 'Kael',
    className: 'Arquero',
    icon: '🏹',
    portrait: '/assets/kael-dark-fantasy-elven-ranger-archer-in-cmvbm7qq.png',
    unlocked: true,
    cost: 100,
    weapon: 'arco_largo',
    weaponName: 'Arco Largo Élfico',
    description: 'Cazador ágil con gran velocidad de movimiento y flechas múltiples perforantes.',
    stats: {
      hp: 110,
      attack: 24,
      defense: 8,
      speed: 200,
      critChance: 0.18,
      pickupRadius: 80
    },
    skillName: 'Lluvia de Flechas',
    skillDesc: 'Dispara una andanada de 16 flechas perforantes en todas direcciones.'
  },

  morgana: {
    id: 'morgana',
    name: 'Morgana',
    className: 'Nigromante',
    icon: '💀',
    portrait: '/assets/morgana-gothic-dark-fantasy-necromancer-cmvbm7y4.png',
    unlocked: true,
    cost: 150,
    weapon: 'rayos',
    weaponName: 'Báculo de las Sombras',
    description: 'Sacerdotisa oscura que canaliza maleficios, robo de vida y relámpagos arcanos.',
    stats: {
      hp: 105,
      attack: 26,
      defense: 10,
      speed: 165,
      critChance: 0.08,
      pickupRadius: 85
    },
    skillName: 'Drenaje de Almas',
    skillDesc: 'Drena la vida de los enemigos cercanos, curando un 30% de la vida máxima.'
  },

  thorin: {
    id: 'thorin',
    name: 'Thorin',
    className: 'Paladín',
    icon: '🛡️',
    portrait: '/assets/thorin-medieval-dwarf-paladin-in-golden-cmvbm852.png',
    unlocked: true,
    cost: 200,
    weapon: 'cuchillas',
    weaponName: 'Mazo y Escudo Sagrado',
    description: 'Tanque impenetrable con armadura dorada bendecida, escudos giratorios y daño sagrado.',
    stats: {
      hp: 180,
      attack: 18,
      defense: 22,
      speed: 145,
      critChance: 0.05,
      pickupRadius: 70
    },
    skillName: 'Consagración Divina',
    skillDesc: 'Genera un santuario sagrado que repele a los monstruos y vuelve invulnerable al paladín por 4s.'
  }
};
