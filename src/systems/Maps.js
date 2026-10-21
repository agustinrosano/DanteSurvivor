// ============================================================================
// DANTE QUEST — Map & Stage Definitions
// ============================================================================

export const MAPS = {
  bosque: {
    id: 'bosque',
    name: 'El Bosque de los Condenados',
    shortName: 'El Bosque',
    subtitle: 'Nivel 1 • Criptas olvidadas y muertos vivientes',
    difficulty: 'Normal',
    difficultyColor: '#22c55e',
    badge: 'ACTO I',
    icon: '🌲',
    previewImg: '/assets/stage-forest.png',
    description: 'Un denso bosque ancestral sumido en la putrefacción y la niebla. Hordas de zombis y bestias hambrientas emergen entre tumbas profanadas. Contiene la Cripta Maldita subterránea.',
    features: [
      '🌲 Terreno amplio con árboles oscuros y lápidas',
      '🧟 Enemigos: Zombis, Lobos rabiosos, Esqueletos',
      '⚡ Entrada a la Cripta Subterránea con cofres de oro',
      '🔥 Altar ceremonial del Rey de los Condenados'
    ],
    enemyMultiplier: 1.0,
    soulsMultiplier: 1.0,
    hudName: 'Bosque de los Condenados',
    atmosphere: {
      ambientDarkness: 0.85,
      fogColor: 'rgba(7, 5, 11, 0.85)',
      torchGlow: 'rgba(245, 158, 11, 0.28)',
      altarTitle: '🔥 ALTAR DEL REY CONDENADO 🔥',
      altarPrompt: '[ ACÉRCATE PARA DESPERTAR ]',
      altarBossActive: '☠️ EL REY HA DESPERTADO ☠️',
      portalTitle: '⚡ CRIPTA MALDITA ⚡',
      portalAction: '[ ENTRAR ]',
      dungeonReturnTitle: '⚡ VOLVER A SUPERFICIE ⚡'
    }
  },

  limbo: {
    id: 'limbo',
    name: 'El Limbo de las Ánimas',
    shortName: 'El Limbo',
    subtitle: 'Nivel 2 • Umbral espectral entre los mundos',
    difficulty: 'Pesadilla',
    difficultyColor: '#a855f7',
    badge: 'ACTO II',
    icon: '🌌',
    previewImg: '/assets/stage-limbo.png',
    description: 'El plano etéreo donde vagan las almas errantes que no pertenecen ni al cielo ni al infierno. Monolitos rúnicos flotan sobre losas astrales y fuegos fatuos iluminan la densa niebla cósmica.',
    features: [
      '🌌 Suelo de obsidiana astral y niebla púrpura',
      '👻 Enemigos: Mayor frecuencia de Wraiths y Caballeros',
      '🪙 +25% Ganancia de Almas y Orbes de Experiencia',
      '🔮 Vórtice Abisal hacia la Cripta Espectral'
    ],
    enemyMultiplier: 1.25,
    soulsMultiplier: 1.25,
    hudName: 'El Limbo de las Ánimas',
    atmosphere: {
      ambientDarkness: 0.88,
      fogColor: 'rgba(10, 6, 22, 0.88)',
      torchGlow: 'rgba(168, 85, 247, 0.35)',
      altarTitle: '🔥 TRONO DEL ARCONTE DE LAS ÁNIMAS 🔥',
      altarPrompt: '[ ACÉRCATE PARA DESPERTAR EL ARCONTE ]',
      altarBossActive: '☠️ EL ARCONTE HA DESPERTADO ☠️',
      portalTitle: '🌌 VÓRTICE ABISAL 🌌',
      portalAction: '[ CRUZAR UMBRAL ]',
      dungeonReturnTitle: '🌌 REGRESAR AL LIMBO 🌌'
    }
  },

  lujuria: {
    id: 'lujuria',
    name: 'Segundo Círculo: Lujuria',
    shortName: 'Lujuria',
    subtitle: 'Círculo II • Las almas de la tempestad',
    difficulty: 'Tormento', difficultyColor: '#be5677', badge: 'ACTO III', icon: '🌪️',
    previewImg: '/assets/circles/lujuria-second-circle-of-dante-haunted-m-cmvhh8e7.png',
    description: 'Ruinas de mármol rosado bajo una tempestad perpetua. Las almas dominadas por el deseo vagan entre ráfagas y pétalos desgarrados.',
    features: ['🌪️ Ráfagas señalizadas: buscá un camino seguro', '👻 Almas veloces y sirenas que atacan a distancia', '🪙 +50% Almas y experiencia', '⚔️ Altar del Señor de la Tempestad'],
    enemyMultiplier: 1.5, soulsMultiplier: 1.5, hudName: 'Segundo Círculo: Lujuria',
    dungeonName: 'Cripta de los Suspiros',
    dungeonNames: ['Cripta de los Suspiros', 'Galería del Deseo', 'Santuario de los Ecos', 'Sepulcro de las Rosas'],
    boss: { kind: 'tempest', name: 'Señor de la Tempestad', sprite: '/assets/circles/single-lord-of-the-tempest-boss-sprite-f-cmvhh8b3.png' },
    terrain: {
      floors: ['#402832', '#50313d', '#62404b'], details: ['#523341', '#69414e', '#7b515b'],
      wall: '#281b24', brick: '#49303b', accent: '#f0a2b6', glow: 'rgba(225, 116, 150, 0.30)',
      fog: 'rgba(30, 15, 24, 0.68)', dungeonFog: 'rgba(25, 12, 21, 0.87)',
      floorTint: 'rgba(86, 34, 55, 0.40)', prop: '#805664'
    },
    atmosphere: {
      altarTitle: '🌪️ ALTAR DE LA TEMPESTAD 🌪️', altarPrompt: '[ ACÉRCATE PARA DESPERTAR ]',
      altarBossActive: '☠ EL SEÑOR DE LA TEMPESTAD HA DESPERTADO ☠', dungeonReturnTitle: 'VOLVER A LUJURIA'
    }
  },

  gula: {
    id: 'gula', name: 'Tercer Círculo: Gula', shortName: 'Gula',
    subtitle: 'Círculo III • Hambre bajo la lluvia helada',
    difficulty: 'Voracidad', difficultyColor: '#748e70', badge: 'ACTO IV', icon: '🌧️',
    previewImg: '/assets/circles/gula-third-circle-of-dante-muddy-medieva-cmvhh8h6.png',
    description: 'Un lodazal de restos y sepulcros bajo una lluvia sucia y helada. Los glotones acechan entre charcos mientras Cerbero custodia el altar.',
    features: ['🌧️ Lluvia helada y charcos que ralentizan', '🦴 Glotones resistentes y bestias del lodazal', '🪙 +80% Almas y experiencia', '🐺 Cerbero: tres cabezas, tres fases'],
    enemyMultiplier: 1.8, soulsMultiplier: 1.8, hudName: 'Tercer Círculo: Gula',
    dungeonName: 'Cripta del Hambre',
    dungeonNames: ['Cripta del Hambre', 'Fosa de los Glotones', 'Osario Helado', 'Sepulcro de la Voracidad'],
    boss: { kind: 'cerberus', name: 'Cerbero, Guardián de la Gula', sprite: '/assets/circles/single-cerberus-three-headed-dog-boss-sp-cmvhh803.png' },
    terrain: {
      floors: ['#29362f', '#354239', '#46514a'], details: ['#3c4c42', '#4c5c50', '#5c6c62'],
      wall: '#17231e', brick: '#304039', accent: '#b6d9be', glow: 'rgba(151, 190, 162, 0.26)',
      fog: 'rgba(15, 28, 23, 0.68)', dungeonFog: 'rgba(10, 24, 19, 0.87)',
      floorTint: 'rgba(29, 66, 46, 0.42)', prop: '#6b7c70'
    },
    atmosphere: {
      altarTitle: '🦴 ALTAR DE CERBERO 🦴', altarPrompt: '[ ACÉRCATE PARA DESPERTAR ]',
      altarBossActive: '☠ CERBERO HA DESPERTADO ☠', dungeonReturnTitle: 'VOLVER A GULA'
    }
  }
};
