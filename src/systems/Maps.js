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
  }
};
