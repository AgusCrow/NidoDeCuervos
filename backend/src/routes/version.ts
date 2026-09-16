import { Router, Request, Response } from 'express';

const versionRouter = Router();

export interface VersionInfo {
  currentVersion: string;
  versionCode: number;
  minSupportedVersion: string;
  releaseDate: string;
  appName: string;
  downloads: {
    androidApkUrl: string;
    pcLauncherUrl: string;
    pwaUrl: string;
  };
  changelog: {
    version: string;
    date: string;
    title: string;
    highlights: string[];
    isLatest?: boolean;
  }[];
}

const SYSTEM_VERSION_DATA: VersionInfo = {
  currentVersion: '3.7.2',
  versionCode: 372,
  minSupportedVersion: '1.0.0',
  releaseDate: '2026-09-16',
  appName: 'El Gremio de la Taberna RPG',
  downloads: {
    androidApkUrl: '/downloads/ElGremioRPG.apk',
    pcLauncherUrl: '/downloads/Iniciar_El_Gremio_Desktop.bat',
    pwaUrl: '/'
  },
  changelog: [
    {
      version: '3.7.2',
      date: '2026-09-16',
      title: 'Rediseño UI & Temas Dinámicos',
      highlights: [
        'Rediseño UI completo con 3 estilos seleccionables: Fantasía Gótica, Glassmorphism Premium y Flat E-Sports',
        'Integración de paleta de colores, familias tipográficas y efectos traslúcidos optimizados',
        'Mejora de contraste y velocidad de lectura en dispositivos móviles y de escritorio'
      ],
      isLatest: true
    },
    {
      version: '3.7.1',
      date: '2026-09-16',
      title: 'UI Refactor & Menú Desplegable de Perfil',
      highlights: [
        '👤 Menú Desplegable de Perfil: Consolidación de opciones (Ajustes de Perfil, SFX, Temas, Rankings y Sesión) en el icono del personaje.',
        '🏆 Rankings Unificados a 2 Columnas: Visualización paralela de Jugadores y Clanes con Podio Top 3 y tarjeta fija de Tu Posición Actual.',
        '🛠️ Reestructuración de Barra Táctica: Limpieza de accesos redundantes en el dashboard principal y reubicación del Muro & P2P en Crónicas.'
      ],
      isLatest: false
    },
    {
      version: '3.7.0',
      date: '2026-09-16',
      title: 'Nido de Cuervos: Senda Infinita, Guild Raids Asíncronos & Tug of War 24h',
      highlights: [
        '⚔️ Senda Infinita Procedural: Auto-battler infinito continuo sin tareas/pomodoro, escalado matemático por profundidad y jefes de zona cada 10 oleadas.',
        '🐉 Guild Raids Asíncronos: Desafío de hermandad de 60s DPS check, barra comunal con hitos al 75%, 50%, 25% y 0%, guardia reactiva contra golpes de furia y tienda comunitaria de Fichas de Gremio.',
        '🏰 Guerra de Clanes (Tug of War 24h): Frente horizontal dinámico de empuje del estandarte militar (-100m a +100m) con 4 tácticas de combate y control territorial.',
        '🗡️ Solo Raids de 3 Cámaras: Incursión táctica en solitario con selección de postura, tirada D20 y botín procedural mítico garantizado.',
        '🎒 Mochila & Paper Doll Rúnico: 4 ranuras físicas de equipo, RpgToast flotante de fantasía oscura y comparador rúnico en tiempo real.'
      ],
      isLatest: true
    },
    {
      version: '3.6.0',
      date: '2026-09-09',
      title: 'Las Catacumbas Olvidadas & El Despertar del Héroe',
      highlights: [
        'Dungeon Crawler Ramificado: Expediciones a las Catacumbas con mapa de nodos procedurales (Combate, Élite, Eventos D20, Descanso y Guardián).',
        'Mecánica de Riesgo vs Recompensa: Saco de botín acumulativo con opción de retirada táctica o penalización al caer en combate.',
        'Avatar Paper Doll Visual: Siluetas de clase interactivas con resplandor dinámico de forja (+4 plateado, +7 solar dorado, +10 fuego astral).',
        'Sistema de Logros & Títulos Honoríficos: Desbloqueo de títulos con perks pasivos activos (+HP, +Crítico, +Oro en expediciones, +D20).',
        'Sincronización en tiempo real de títulos equipados en Paper Doll, perfil y Salón de la Fama.'
      ],
      isLatest: false
    },
    {
      version: '3.5.0',
      date: '2026-09-09',
      title: 'Rediseño Táctico del Raid Boss: Estamina, Daño Letal, Guardia y Dificultades',
      isLatest: true,
      highlights: [
        '⚡ Sistema de Estamina & Cooldowns: Fin al spam descontrolado; cada ataque D20, habilidad especial o guardia consume energía recuperable con el tiempo.',
        '❤️ Salud de Combate & Contraataque del Boss: El aventurero ahora recibe daño real por cada embate y furia del jefe, con peligro de quedar Incapacitado (0 HP).',
        '🛡️ Guardia Táctica: Maniobra defensiva para mitigar el 75% del daño del contraataque o la descarga cataclísmica de furia.',
        '🏆 Selector de 3 Dificultades: Normal, Heroico (+50% daño/HP, +60% recompensas) y Mítico (+120% botín y Escudo de Absorción Rúnica).',
        '🍺 Reanimación de Taberna: Paga 10 monedas de oro a Valerius para recibir un trago de hidromiel fuerte y levantarte de inmediato en la batalla.'
      ]
    },
    {
      version: '3.4.0',
      date: '2026-09-08',
      title: 'Expansión Narrativa del Gremio: Lore Master Biblia, Questlines Inmersivas & Flavor Text',
      isLatest: false,
      highlights: [
        '📜 Biblia de Lore y Cosmología: El Cataclismo de la Grieta de Éter y la fundación del refugio Nido de Cuervos.',
        '🗡️ Generador Procedimental de Flavor Text: Cada objeto forjado o generado cuenta con mitología, origen histórico y citas legendarias.',
        '🏰 Micro-arcos Narrativos de Misiones: Rediseño completo de Misiones Diarias y Semanales con inmersión de rol (Reto de la Vanguardia, Mellar la Coraza Rúnica, etc.).',
        '🗣️ NPCs Interactivos de la Taberna: Valerius el Tabernero, Brida la Herrera y Vael el Erudito Ciego con diálogos reactivos a la clase del jugador, clima y estado del Boss.',
        '🐉 Heraldos del Cataclismo con Voz: Biografía y frases épicas de combate al iniciar la batalla, a media vida y al ser derrotados para los 4 Raid Bosses.'
      ]
    },
    {
      version: '3.3.1',
      date: '2026-09-08',
      title: 'Rediseño de Visualización de Inventarios: Modo Cuadrícula RPG, Paper Doll y Comparativa',
      isLatest: false,
      highlights: [
        '🔲 Modo Dual de Inventario: Alternancia entre Cuadrícula de Casillas estilo MMORPG clásico (WoW/Diablo) y Modo Lista Táctica.',
        '🔍 Modal de Inspección Detallada (Item Inspect): Ficha emergente de alta fidelidad con comparativa en tiempo real contra el ítem equipado.',
        '🏷️ Filtros por Ranura & Ordenamiento: Clasificación instantánea por Armas, Armaduras, Accesorios, Pociones y Equipados, ordenados por Rareza, iLvl o Refinamiento.',
        '✨ Halos Temáticos por Rareza: Marcos dinámicos con resplandor glow (Mítico carmesí, Legendario dorado, Épico amatista, Raro zafiro).',
        '🛡️ Paper Doll Interactivo: Ranuras de equipamiento activo con marcos de rareza, badges de temple (+X) y apertura de ficha con un solo clic.'
      ]
    },
    {
      version: '3.3.0',
      date: '2026-09-08',
      title: 'Misiones Diarias y Semanales, La Gran Bóveda, Forja de Refinamiento y Sets de Bosses',
      isLatest: false,
      highlights: [
        '📜 Sistema de Misiones en Tiempo Real: 3 Misiones Diarias con rotación y countdown UTC, 3 Misiones Semanales y Medalla Diaria de Racha.',
        '🏛️ La Gran Bóveda: Recompensa semanal monumental con cofre de oro, gemas y reliquia aleatoria de alto calibre tras completar actividades.',
        '🔨 Yunque de Refinamiento (+1 a +10): Mejora progresiva de armas y armaduras con escalado de oro, probabilidad de éxito y estadísticas de asedio.',
        '♻️ Desguace Arcano (Salvage): Desarmado de piezas en desuso para recuperar oro y obtener Polvo Arcano, Esencias Raras y Fragmentos Míticos.',
        '🛡️ Conjuntos Legendarios de Bosses: Bonificaciones activas de 2 y 4 piezas para los 4 Sets Elementales (Ignis, Malakor, Aurelius, Kaelith).',
        '🔥 Combate Táctico de Asedio: Medidor de Furia (Rage Meter 0-100%) con contragolpes de área y Vulnerabilidad elemental detonada por Magos.'
      ]
    },
    {
      version: '3.2.0',
      date: '2026-09-08',
      title: 'Motor de Generación Procedural de Ítems ARPG, Despojo de Bosses y Cofre Misterioso',
      isLatest: false,
      highlights: [
        '🎲 Motor Procedural de Ítems: Generación pseudo-infinita de armas, armaduras y joyas con escalado de iLvl, rarezas (Común a Mítico), prefijos, sufijos y poderes legendarios pasivos reactivos.',
        '🐉 Drops Procedurales de Bosses: Al derrotar a cualquier Raid Boss, se despoja automáticamente equipamiento temático basado en el elemento del jefe.',
        '🎁 Cofre Misterioso del Gremio: Nueva opción en el Bazar para forjar equipamiento adaptado al nivel del héroe.',
        '🎒 UI RPG Enriquecida: Tooltips detallados con insignias de rareza, iLvl, desglose de estadísticas y poderes legendarios reactivos.'
      ]
    },
    {
      version: '3.1.0',
      date: '2026-09-07',
      title: 'Árboles de Talentos por Clase, Raid Boss D20 Multijefe y Rediseño Táctico UI/UX',
      isLatest: false,
      highlights: [
        '🌟 Árboles de Especialización y Talentos únicos para cada Clase (Guerrero, Mago, Pícaro, Bardo) con 3 ramas y 3 tiers.',
        '⚔️ Raid Boss Profundo con escalado de daño según tirada D20 (Pifia, Rozadura, Sólido, Demoledor, Crítico Nat 20) y catálogo de 4 Jefes elementales.',
        '🎨 Rediseño UI/UX integral: Fusión de Héroe + Mochila en panel táctico, pestaña principal de Clan con mapa de territorios, Bazar optimizado y contraste mejorado en todos los temas.'
      ]
    },
    {
      version: '3.0.0',
      date: '2026-09-05',
      title: 'La Guerra de Clanes, Mapa Territorial & Sincronización Offline PWA',
      highlights: [
        '🏰 Fundación de Clanes y Hermandades con tesorería compartida, emblemas y niveles de hermandad.',
        '🗺️ Mapa Territorial Táctico con 4 zonas clave de la Taberna disputadas mediante tiradas de dados D20.',
        '📶 Modo Offline Sync PWA / APK con SQLite y localStorage para jugar sin conexión y resincronizar automáticamente.',
        '🖥️ Soporte Multiplataforma Total: Web SPA, PC Windows Launcher (.bat) y APK Android Nativo.'
      ]
    },
    {
      version: '2.5.0',
      date: '2026-09-05',
      title: 'Compañeros Místicos & Dados de Mentiroso',
      highlights: [
        '🐾 Sistema de Mascotas (Lobo Sombra, Fénix Enano, Duende Avaro) con bonificaciones pasivas permanentes.',
        '🎲 Minijuego interactivo "Dados de Mentiroso" apostando oro contra el Tabernero en tiempo real.',
        '✨ Animaciones y efectos sonoros dedicados para victorias y fumbles en las mesas de juego.'
      ]
    },
    {
      version: '2.2.0',
      date: '2026-09-05',
      title: 'El Árbol de Talentos & La Forja de Runas',
      highlights: [
        '⚡ Árbol de Talentos con 3 Ramas (Ofensiva, Defensiva y Fortuna) con puntos desbloqueables por nivel.',
        '🔨 Yunque Sagrado: Forja de Runas para imbuir equipamiento con Fuego, Escudo o Fortuna por 25 de oro.',
        '🛡️ Mejoras en el cálculo de daño de combate basadas en talentos activos.'
      ]
    },
    {
      version: '2.0.0',
      date: '2026-09-05',
      title: 'El Asedio Cooperativo - Raid Boss en TV',
      highlights: [
        '🐉 Gran Batalla grupal contra Ignis el Dragón de Obsidiana (5,000 HP) sincronizada en vivo con la Pantalla TV.',
        '⚔️ Ataques tácticos simultáneos desde móviles y PC con críticos naturales (20) y podio de daño.',
        '📺 HUD en vivo de barra de vida del Boss y ticker de eventos en TV Mode.'
      ]
    },
    {
      version: '1.5.0',
      date: '2026-09-05',
      title: 'El Muro de la Taberna & Mercado P2P',
      highlights: [
        '📜 El Muro de la Taberna: Publicación de gritos comunitarios con auras de clase y títulos en tiempo real.',
        '⚖️ Mercado de Intercambio P2P: Compra y venta libre de objetos de inventario entre jugadores por oro.',
        '🔔 Notificaciones en vivo vía Server-Sent Events cuando hay ventas o nuevos anuncios.'
      ]
    },
    {
      version: '1.4.0',
      date: '2026-09-05',
      title: 'El Grimorio Táctico, Auras de Clase & Efectos de Audio SFX',
      highlights: [
        '🔊 Motor de Audio SFX procedural (Web Audio API) para tiradas D20, compras, equipamiento y subidas de nivel sin descargas pesadas.',
        '✨ Auras de Clase dinámicas y efectos visuales de partículas según la clase (Guerrero, Mago, Pícaro, Bardo).',
        '📖 Nuevo Grimorio Táctico con 4 pestañas fluidas en el Dashboard (Héroe, Mochila, Arena y Crónicas).',
        '📳 Soporte de respuesta háptica táctil para teléfonos móviles Android / PWA.'
      ]
    },
    {
      version: '1.3.0',
      date: '2026-09-05',
      title: 'La Arena de Campeones D20 & El Salón de la Fama',
      highlights: [
        '🎲 Nueva Arena de Duelos D20 interactiva con dados 3D, animación de impacto y críticos naturales (20).',
        '🏆 Salón de la Fama en vivo con Podio de Aventureros por Nivel, Fortuna (Oro) y Duelos ganados.',
        '⚡ Nueva función "Comprar y Equipar" en 1 toque directo desde la Tienda de Objetos.',
        '📱 Experiencia táctil optimizada para Celulares (APK/PWA) y atajos de teclado para PC Launcher.'
      ]
    },
    {
      version: '1.2.0',
      date: '2026-09-05',
      title: 'Pergamino de Novedades & Sistema de Versionado Dinámico',
      highlights: [
        '✨ Nuevo sistema de versionado dinámico con comprobación de actualizaciones en tiempo real.',
        '📜 Modal "Pergamino de Novedades" que muestra los cambios de cada parche al ingresar a la Taberna.',
        '⚡ Rediseño visual del centro de Descargas con indicador de versión actual vs remota.',
        '📱 Sincronización del instalador Android APK con la versión oficial v1.2.0.'
      ]
    },
    {
      version: '1.1.0',
      date: '2026-08-28',
      title: 'Duelos PvP en Tiempo Real & 50 Títulos Legendarios',
      highlights: [
        '⚔️ Sistema de Retos PvP en vivo con apuestas de oro entre aventureros.',
        '👑 50 Nuevos Títulos Legendarios desbloqueables con estadísticas y efectos visuales.',
        '🤖 Integración con Bot de Telegram para avisos instantáneos de duelos y compras.',
        '🎨 Selector de Temas Visuales (Medieval, Arcano, Élfico, Carmesí).'
      ]
    },
    {
      version: '1.0.0',
      date: '2026-08-15',
      title: 'Lanzamiento Oficial de la Taberna',
      highlights: [
        '🛡️ Creación de aventureros con clases secretas y autenticación NFC / Password.',
        '🪙 Tienda de objetos, inventario de armas y grimorio de misiones.',
        '📺 Modo TV interactivo proyectable para la pantalla de la taberna.',
        '📲 Soporte para Progressive Web App (PWA) e instalador nativo para Android.'
      ]
    }
  ]
};

// GET /api/v1/version - Retorna información de versión actual y changelog
versionRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: SYSTEM_VERSION_DATA
  });
});

// GET /api/v1/version/check?clientVersion=1.1.0 - Verifica si el cliente necesita actualizar
versionRouter.get('/check', (req: Request, res: Response) => {
  const clientVersion = (req.query.clientVersion as string) || '1.0.0';
  const hasUpdate = clientVersion !== SYSTEM_VERSION_DATA.currentVersion;
  
  res.json({
    success: true,
    clientVersion,
    latestVersion: SYSTEM_VERSION_DATA.currentVersion,
    hasUpdate,
    releaseDate: SYSTEM_VERSION_DATA.releaseDate,
    downloads: SYSTEM_VERSION_DATA.downloads,
    latestChanges: SYSTEM_VERSION_DATA.changelog[0]
  });
});

export default versionRouter;
