/**
 * ============================================================================
 * 📜 LORE SERVICE & BIBLIA NARRATIVA - EL GREMIO DE LA TABERNA (v3.4.0)
 * ============================================================================
 * Diseñado por el Agente 6 (Narrative Designer & Lore Master)
 * Arquitectura por el Agente 2 (Architect) & Backend por el Agente 3
 * ============================================================================
 */

export interface NPCDialogueResponse {
  npcId: string;
  npcName: string;
  role: string;
  avatar: string;
  dialogue: string;
  mood: 'WELCOMING' | 'GRUMPY' | 'MYSTERIOUS' | 'CAUTIONARY' | 'TRIUMPHANT';
}

export interface TavernRumor {
  id: string;
  source: string;
  text: string;
  category: 'BOSS' | 'WEATHER' | 'CLAN' | 'FORGE' | 'LEGEND';
}

// ----------------------------------------------------------------------------
// 1. MOTOR COMBINATORIO DE FLAVOR TEXT PROCEDIMENTAL PARA ÍTEMS
// ----------------------------------------------------------------------------

const LORE_ORIGINS: Record<string, string[]> = {
  WEAPON: [
    'Forjada en las fundiciones abisales de Kal-Drakor antes de la fractura del Éter.',
    'Recuperada de los restos calcinados del campamento de la Guardia de Plata.',
    'Blandida por los centinelas que custodiaron la retirada hacia el Nido de Cuervos.',
    'Tallada a partir de los colmillos petrificados de una sierpe de la Primera Era.',
    'Un vestigio de los duelos clandestinos que consagraron los cimientos de la Taberna.'
  ],
  ARMOR: [
    'Placas templadas con la sangre coagulada de un titán de roca milenaria.',
    'Tejida con hebras de lino lunar bendecidas en el altar del Santuario Olvidado.',
    'Armadura rescatada de las criptas inferiores, donde el tiempo carece de pulso.',
    'Reforzada con escamas que sobrevivieron al aliento devorador de Ignis.',
    'Confeccionada por los antiguos sastres de batalla de la Orden de los Cuervos.'
  ],
  RING: [
    'Engarzado con una lágrima de éter condensada durante el gran cataclismo rúnico.',
    'Un anillo de pacto extraído del cofre de un corsario del Páramo Nublado.',
    'La gema central pulsa al compás de los latidos de las profundidades.',
    'Símbolo de hermandad otorgado a los supervivientes de la Gran Purga de la Niebla.'
  ],
  AMULET: [
    'Colgante que contiene una pizca de ceniza sagrada de las Agujas Primordiales.',
    'Relicario sellado con cera alquímica que emite una leve tibieza en presencia de peligro.',
    'Glifos microscópicos grabados en su reverso susurran oraciones de protección.',
    'Amuleto transmitido de generación en generación entre los exploradores de la taberna.'
  ],
  CONSUMABLE: [
    'Destilado a fuego lento según la receta secreta del sótano del Nido de Cuervos.',
    'Extracto embotellado de musgo luminiscente que brota en las raíces del monolito.',
    'Brebaje acre y espeso que despierta los sentidos hasta del guerrero más extenuado.'
  ]
};

const ELEMENTAL_LORE: Record<string, string[]> = {
  FUEGO: [
    'Aún despide el aroma del azufre y las cenizas calientes del Pico Nevado.',
    'Un fuego inextinguible danza sobre su superficie, ansioso por calcinar al enemigo.',
    'Bañada en la sangre ardiente de dragones que no conocieron el reposo.'
  ],
  VENENO: [
    'Exuda una condensación esmeralda que corroe el aire a su alrededor.',
    'Imbuida en las secreciones ponzoñosas de las Catacumbas de Malakor.',
    'Cualquier rasguño infligido por este objeto inocula la lenta ponzoña del olvido.'
  ],
  TIERRA: [
    'Posee la densidad y el peso inconmovible de las cordilleras ancestrales.',
    'Resuena con la vibración profunda de los pasos de Aurelius el Titán.',
    'La roca viva de su estructura se endurece ante el impacto del acero.'
  ],
  HIELO: [
    'Cubre los dedos de escarcha blanca y emite un vaho gélido constante.',
    'Forjada bajo la mirada inerte de Kaelith en el Glaciar de los Suspiros.',
    'Su tacto adormece el dolor pero congela la compasión en combate.'
  ],
  ARCANO: [
    'Los glifos que la decoran cambian de posición cuando nadie los observa.',
    'Canaliza la energía primordial que desgarró el velo entre las eras.',
    'Una sutil melodía de campanas lejanas acompaña cada movimiento.'
  ],
  GENERAL: [
    'El temple de su hechura revela la maestría de los herreros de antaño.',
    'La pátina de su superficie atestigua incontables batallas y asedios.',
    'Un artefacto digno de escribir su propio cántico en el tablón del Gremio.'
  ]
};

const EPIC_QUOTES: string[] = [
  '«El hierro que probó la sangre de un tirano jamás vuelve a obedecer al miedo.»',
  '«No busques gloria en la fosa; busca volver con la cabeza erguida a la Taberna.» — Valerius',
  '«El fuego purifica, el hielo preserva, pero solo la voluntad prevalece.»',
  '«Cada mella en el filo es una promesa cumplida a los camaradas caídos.» — Brida',
  '«Quien teme a las sombras de la cripta nunca contemplará el amanecer de la victoria.»',
  '«Las runas no mienten: la roca recuerda lo que los hombres prefieren olvidar.»',
  '«Bebed del cáliz o desenvainad el acero, pero no vaciléis en el umbral del destino.»'
];

/**
 * Genera un texto narrativo de ambientación (Flavor Text) coherente con la pieza.
 */
export function generateItemLoreDescription(params: {
  slot: string;
  rarity: string;
  elementalTheme?: string;
  baseName: string;
  baseDesc?: string;
}): string {
  const { slot, rarity, elementalTheme, baseName, baseDesc } = params;

  const originPool = LORE_ORIGINS[slot] || LORE_ORIGINS.WEAPON;
  const origin = originPool[Math.floor(Math.random() * originPool.length)];

  const themeKey = elementalTheme && ELEMENTAL_LORE[elementalTheme] ? elementalTheme : 'GENERAL';
  const elementPool = ELEMENTAL_LORE[themeKey];
  const elementDetail = elementPool[Math.floor(Math.random() * elementPool.length)];

  if (rarity === 'MYTHIC' || rarity === 'LEGENDARY') {
    const quote = EPIC_QUOTES[Math.floor(Math.random() * EPIC_QUOTES.length)];
    return `${origin} ${elementDetail} ${quote}`;
  }

  if (rarity === 'EPIC' || rarity === 'RARE') {
    return `${origin} ${elementDetail}`;
  }

  // Common / Uncommon: síntesis breve
  return `${baseDesc || origin} ${elementDetail}`;
}

// ----------------------------------------------------------------------------
// 2. SISTEMA DE DIÁLOGOS DE NPCS DE LA TABERNA
// ----------------------------------------------------------------------------

export interface NPCProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  dialogues: {
    welcome: string[];
    classReaction: Record<string, string>;
    weatherReaction: Record<string, string>;
    bossDefeated: string;
    bossActive: string;
  };
}

export const TAVERN_NPCS: Record<string, NPCProfile> = {
  valerius: {
    id: 'valerius',
    name: 'Valerius "Ojo de Cuervo"',
    role: 'Tabernero Mayor & Juez del Gremio',
    avatar: '🍺',
    dialogues: {
      welcome: [
        'Arrímate al hogar, camarada. La hidromiel está fría pero la madera de pino arde bien.',
        '¿Buscas contratos o vienes a sacudirte el polvo del camino? El tablón tiene faena para quien tenga agallas.',
        'Cierra bien la puerta. La niebla del exterior arrastra susurros que ningún hombre cuerdo debería escuchar.'
      ],
      classReaction: {
        WARRIOR: 'Tu coraza hace crujir las vigas al pasar, guerrero. Justo la clase de músculo que necesitamos si los titanes bajan de la cima.',
        MAGE: 'Cuidado con esas chispas en las mangas, hechicero. Ya quemamos dos mesas el invierno pasado con un conjuro descuidado.',
        ROGUE: 'Mantén las manos a la vista, sombra. Mientras no toques la caja del mesón, tu oro vale tanto como el de cualquier caballero.',
        BARD: 'Toca algo que ahuyente los malos augurios, juglar. La soldadesca necesita recordar por qué pelea.'
      },
      weatherReaction: {
        TORMENTA: 'Menuda tempestad ruge en las almenas. Dicen que son los truenos de Aurelius golpeando el yunque del mundo.',
        NIEBLA: 'Mala noche para vagar por el páramo. Los no-muertos de Malakor se confunden con el humo.',
        DESPEJADO: 'El cielo se ha despejado sobre el pico nevado. Buen presagio para una cacería de monstruos.'
      },
      bossActive: 'El rugido de la bestia sacude las jarras de la alacena. No tardéis en organizar el asedio o no quedará muralla en pie.',
      bossDefeated: '¡Brindemos por la caída del coloso! Los barriles corren por cuenta del Gremio esta noche.'
    }
  },
  brida: {
    id: 'brida',
    name: 'Brida la Herrera de Runas',
    role: 'Maestra del Yunque y el Temple',
    avatar: '🔨',
    dialogues: {
      welcome: [
        'Trae ese hierro al fuego. Si no está afilado para cercenar escamas, solo es un adorno caro.',
        '¿Refinado o forja nueva? Habla rápido, el fuelle no se mantiene encendido con charlas vanas.',
        'El metal tiene memoria, zagal. Si lo tratas con desprecio, se partirá en el peor momento del duelo.'
      ],
      classReaction: {
        WARRIOR: 'Me gusta tu estilo. Poco floripondio y mucho acero pesado. Vamos a sacarle más filo a esa hoja.',
        MAGE: '¿Canalizadores de éter? Puedo engarzarlos, pero no me pidas que entienda vuestras jerigonzas arcanas.',
        ROGUE: 'Dagas equilibradas al gramo. Un golpe ligero y certero en la carótida ahorra muchas fuerzas.',
        BARD: 'Cuerdas de mithril reforzadas... Nunca creí que afilaría un laúd, pero la guerra hace extraños milagros.'
      },
      weatherReaction: {
        TORMENTA: 'La humedad ablanda el carbón. Habrá que atizar el fuelle con doble fuerza hoy.',
        NIEBLA: 'El rocío oxida el acero descuidado. Aceita bien las ranuras de tu cota de malla.',
        DESPEJADO: 'Día seco y limpio. El fuego arde con tono azul, ideal para templar armas míticas.'
      },
      bossActive: 'Las vibraciones del boss hacen tintinear las tenazas en la pared. ¡Apresúrate con ese equipo!',
      bossDefeated: 'He recogido fragmentos de las escamas del coloso caído. Hay material de sobra para armaduras de élite.'
    }
  },
  vael: {
    id: 'vael',
    name: 'Vael el Erudito Ciego',
    role: 'Custodio del Grimorio y Arcanos',
    avatar: '📜',
    dialogues: {
      welcome: [
        'Puedo escuchar el peso de tu destino en cada uno de tus pasos, aventurero.',
        'Los Antiguos escribieron la historia en piedra, pero vosotros la reescribís con cada gota de sangre derramada.',
        'Acércate... deja que palpe los glifos de tu equipamiento. Tal vez revelen secretos que aún ignoras.'
      ],
      classReaction: {
        WARRIOR: 'La fuerza muscular es un escudo admirable, pero recuerda que el acero sin mente es solo roca afilada.',
        MAGE: 'Percibo las corrientes de maná arremolinándose en tus sienes, hermano del Círculo. No te dejes consumir por la sed de poder.',
        ROGUE: 'Te mueves con el sigilo del viento sobre el hielo. Pocos entienden que la paciencia es la mayor de las magias.',
        BARD: 'Tus cánticos resuenan con los ecos de la Gran Canción que dio forma a las montañas. Nunca dejes de cantar.'
      },
      weatherReaction: {
        TORMENTA: 'El velo entre los planos se adelgaza con los rayos. Las almas de los caídos buscan asilo.',
        NIEBLA: 'La niebla no es vapor, es el aliento condensado de los Titanes que aún sueñan bajo la tierra.',
        DESPEJADO: 'Las constelaciones se alinean con la estrella del Cuervo. Es momento propicio para la magia pura.'
      },
      bossActive: 'Las corrientes etéreas están desbocadas. El Heraldo amenaza con quebrar el último sello de protección.',
      bossDefeated: 'La calma regresa a las líneas ley. El Gremio ha ganado otro día de luz bajo el firmamento.'
    }
  }
};

/**
 * Obtiene un diálogo contextual dinámico para un NPC según el perfil del jugador.
 */
export function getNPCDialogue(npcId: string, context?: {
  playerClass?: string;
  weatherCondition?: string;
  isBossActive?: boolean;
  hasBossDefeated?: boolean;
}): NPCDialogueResponse {
  const npc = TAVERN_NPCS[npcId] || TAVERN_NPCS.valerius;
  
  // Prioridad 1: Reacción a estado de Boss
  if (context?.isBossActive && Math.random() < 0.35) {
    return {
      npcId: npc.id,
      npcName: npc.name,
      role: npc.role,
      avatar: npc.avatar,
      dialogue: npc.dialogues.bossActive,
      mood: 'CAUTIONARY'
    };
  }

  // Prioridad 2: Reacción a clase de jugador
  if (context?.playerClass && npc.dialogues.classReaction[context.playerClass] && Math.random() < 0.45) {
    return {
      npcId: npc.id,
      npcName: npc.name,
      role: npc.role,
      avatar: npc.avatar,
      dialogue: npc.dialogues.classReaction[context.playerClass],
      mood: 'WELCOMING'
    };
  }

  // Prioridad 3: Reacción al clima
  const weatherKey = (context?.weatherCondition || '').toUpperCase().includes('TORMENTA') ? 'TORMENTA'
    : (context?.weatherCondition || '').toUpperCase().includes('NIEBLA') ? 'NIEBLA'
    : 'DESPEJADO';
  if (npc.dialogues.weatherReaction[weatherKey] && Math.random() < 0.3) {
    return {
      npcId: npc.id,
      npcName: npc.name,
      role: npc.role,
      avatar: npc.avatar,
      dialogue: npc.dialogues.weatherReaction[weatherKey],
      mood: 'MYSTERIOUS'
    };
  }

  // Default: Bienvenida aleatoria
  const welcomePool = npc.dialogues.welcome;
  const chosenDialogue = welcomePool[Math.floor(Math.random() * welcomePool.length)];

  return {
    npcId: npc.id,
    npcName: npc.name,
    role: npc.role,
    avatar: npc.avatar,
    dialogue: chosenDialogue,
    mood: 'WELCOMING'
  };
}

// ----------------------------------------------------------------------------
// 3. GENERADOR DE CRÓNICAS Y RUMORES DE TABERNA
// ----------------------------------------------------------------------------

export function getRandomTavernRumors(): TavernRumor[] {
  return [
    {
      id: 'rumor_1',
      source: 'Valerius',
      text: 'Los cazadores aseguran que Ignis brama más furioso cuando los aventureros atacan con hielo sagrado.',
      category: 'BOSS'
    },
    {
      id: 'rumor_2',
      source: 'Brida',
      text: 'Un ítem con refine +5 no solo corta más hondo; su brillo amedrenta a los monstruos menores en las catacumbas.',
      category: 'FORGE'
    },
    {
      id: 'rumor_3',
      source: 'Vael',
      text: 'La niebla de las noches oculta runas que solo se hacen visibles para aquellos con un D20 bendecido.',
      category: 'LEGEND'
    },
    {
      id: 'rumor_4',
      source: 'Guardia del Muro',
      text: 'Los clanes que controlan el Bastión Norte acumulan una renta diaria en oro que llena arcas enteras.',
      category: 'CLAN'
    }
  ];
}
