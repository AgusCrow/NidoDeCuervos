# 📜 GUÍA MAESTRA Y MANUAL ENCICLOPÉDICO
## RPG "EL GREMIO DE LA TABERNA" & EXPANSIÓN "NIDO DE CUERVOS"
### Sistema Gamificado Web: PWA Móvil, Modo TV y Servidor 24/7

---

## 🧭 1. VISIÓN DEL MUNDO Y CONCEPTO DEL JUEGO

**El Gremio de la Taberna** es un ecosistema de juego de rol (RPG) digital en tiempo real. Cuenta con una Progressive Web App (PWA) de alta fidelidad, un Modo TV público para proyecciones comunitarias 24/7 y aplicaciones accesibles tanto para dispositivos móviles como de escritorio.

Los aventureros ingresan mediante sus cuentas de usuario para gestionar su inventario, participar en duelos PvP en la arena, conquistar fortalezas en guerras de clanes de 24 horas y emprender expediciones en la Senda Infinita.

---

## 🏛️ 2. ARQUITECTURA TÉCNICA DEL ECOSISTEMA

```mermaid
graph TD
    subgraph Servicios Externos
        TelegramBot[Bot Oficial de Telegram] -->|Alertas en Vivo| Backend
    end

    subgraph Servidor de Producción (:8083 / :3000)
        Broker[Broker MQTT :1883] -->|Sincronización en Tiempo Real| Backend[Node.js Express + TypeScript :3000]
        Backend -->|Persistencia Atómica| DB[(Almacén JSON / Store de Datos)]
        Backend -->|Canal SSE /public/events| Frontend
        Nginx[Nginx Reverse Proxy :8083] -->|Proxy API & Static| Backend
    end

    subgraph Clientes de Jugador
        Frontend[React 18 + Vite + TailwindCSS] --> PWA[PWA Móvil / Android APK]
        Frontend --> TV[Modo TV Pantalla Pública 24/7]
        Frontend --> Desktop[Lanzador de Escritorio PC]
    end
```

---

## 🖥️ 3. DESGLOSE EXHAUSTIVO DE MÓDULOS Y FUNCIONES ACTUALES

A continuación se detalla la función, reglas mecánicas y propósito de cada una de las pestañas principales y botones tácticos visibles en el tablero de control del aventurero:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [🛡️ Héroe & Mochila]    [👑 Clan & Territorios]    [⚔️ Arena PvP]    [📜 Crónicas]  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ [⚔️ Senda Infinita]   [🏆 Logros & Perks]   [⚡ Talentos & Forja]   [🐾 Mascotas]   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1. PESTAÑAS PRINCIPALES DE NAVEGACIÓN

#### 🛡️ 1. Héroe & Mochila
Es la central operativa del personaje. Integra:
- **Ficha de Atributos del Héroe**: Muestra Clase Secreta (*Guerrero, Mago, Pícaro, Bardo*), Nivel, barra de Experiencia (XP), Oro en bolsa, Título Activo con su aura visual y estadísticas base (Fuerza, Destreza, Inteligencia, Constitución).
- **Paper Doll Rúnico Interactivo**: Silueta visual del aventurero con 4 ranuras físicas equipables (*Arma Principal, Armadura de Pecho, Joya/Accesorio, Consumible/Amuleto*). Al hacer clic en cualquier ranura se abre el comparador rúnico con el inventario.
- **Mochila con Doble Modo de Visualización**:
  - *Modo Cuadrícula RPG (MMO Style)*: Cuadrícula de casillas con marcos temáticos de color por rareza (Común, Poco Común, Raro, Épico, Legendario, Mítico), insignias de nivel de refinamiento (+X) y efectos glow.
  - *Modo Lista Táctica*: Visualización densa con daño exacto, defensa, valor de venta y atributos.
- **Filtros por Ranura & Ordenamiento Instantáneo**:
  - Filtro por categoría: *Todos, Armas, Armaduras, Accesorios, Consumibles, Equipados*.
  - Ordenamiento multicriterio: *Rareza, Nivel de Objeto (iLvl), Refinamiento (+X), Valor en Oro, Nombre Alfabético*.
- **Modal de Inspección Detallada (Item Inspect)**: Ficha de alta fidelidad que muestra el lore del objeto, daño mínimo/máximo, índice de armadura, prefijos y sufijos mágicos, y comparativa lado a lado contra el objeto actualmente equipado.

---

#### 👑 2. Clan & Territorios
El centro de geopolítica y guerras de clanes de la taberna. Contiene 6 subsistemas:
- **Mi Hermandad (Gestión de Clan)**:
  - Consulta de nivel del clan, experiencia comunitaria y tesorería de oro compartida.
  - Nómina de miembros con rangos militares jerárquicos: *Líder, Oficial, Veterano, Miembro*.
  - Donaciones de oro: Los miembros aportan oro personal al banco comunitario para subir el clan de nivel y financiar asedios.
  - Fundación de Clanes: Cualquier aventurero sin clan puede fundar una nueva hermandad definiendo Nombre, Tag (máximo 8 letras) y Emblema.
- **Mapa Territorial (Los 4 Bastiones del Reino)**:
  - 👑 **El Trono de la Gran Barra**: Otorga **+180 Oro/día** y pasiva de **+10% Daño Crítico**.
  - 🍷 **La Cripta de la Bodega Secreta**: Otorga **+150 Oro/día** y pasiva de **+15% Resistencia a Hechizos**.
  - ⚔️ **El Bastión del Patio de Armas**: Otorga **+140 Oro/día** y pasiva de **+10% Bono de Escudo**.
  - 🕯️ **El Santuario de los Arcanistas**: Otorga **+160 Oro/día** y pasiva de **+20% Velocidad de Senda**.
  - Cada territorio indica su clan controlador, estado de paz o asedio, y permite al clan regente **Reclamar la Renta Diaria**.
- **Carrera de Asedios Semanales a 1,000 Puntos**:
  - Los clanes declaran asedio a un territorio enemigo. Cada miembro realiza acciones de asedio (*Ariete Pesado, Lluvia de Fuego, Asalto a la Brecha*) aportando puntos de 75 a 125 mediante tiradas D20. El primer clan en alcanzar los 1,000 puntos toma posesión absoluta de la fortaleza.
- **Guerra de Clanes (Tug of War 24h)**:
  - Batalla horizontal de estandartes en una cuerda táctica de **-100m a +100m** entre dos hermandades enfrentadas por una bolsa comunal de oro (ej. 5,000 monedas).
  - Los jugadores tiran con tiradas D20 aplicando modificadores de fuerza para desplazar la marca hacia su trinchera antes de que expire el contador de 24 horas.
- **Facciones Gens (Orden Imperial vs Rebelión Libre)**:
  - **Familia Duprian** (Nobleza, Honor y Sangre Imperial).
  - **Caballeros de Vanert** (Libertad, Fuerza y Hermandad Libre).
  - Juramento de fidelidad, rangos de estatus militar (desde *Recluta* hasta *Comandante Supremo*) y puntos de contribución ganados en combates y duelos.
- **Solo Raids de Hermandad**: Mazmorras tácticas en solitario para miembros del clan donde se eligen posturas de combate en 3 cámaras consecutivas para acumular trofeos para el gremio.

---

#### ⚔️ 3. Arena PvP
La zona de duelos y apuestas de honor entre aventureros:
- **Duelos al Mejor de 3 Tiradas (Bo3)**:
  - Sistema de combate en 3 rondas simultáneas donde cada aventurero tira un dado de 20 caras ($1d20$).
  - **Fórmula de Combate**:
    $$\text{Puntaje} = 1d20 + \lfloor \frac{\text{Nivel}}{5} \rfloor + \text{Modificador de Atributo} + \text{Pasiva de Clase}$$
  - **Regla de Compensación**: Cada 5 niveles otorgan solo $+1$ plano al dado. Un Nivel 20 tiene $+4$ frente a un Nivel 1, asegurando que la estrategia, el azar y las pasivas de clase mantengan los duelos impredecibles.
- **Pasivas de Clase en Duelos**:
  - 🛡️ **Guerrero**: En caso de empate numérico en una ronda, gana automáticamente la ronda por desempate de armadura pesada.
  - 🗡️ **Pícaro**: Una tirada de dado natural $\ge 18$ inflige un **K.O. Instantáneo** (computa 2 victorias de ronda de inmediato).
  - 🔮 **Mago**: Si pierde la 1ª ronda, entra en *Sobrecarga Arcana* sumando $+4$ automático a la 2ª ronda.
  - 🎼 **Bardo**: Al ganar el duelo, roba un $+50\%$ de oro adicional sobre la apuesta pactada.
- **Apuestas de Oro**: Duelos amistosos (0 oro) o duelos con bolsa de 10 a 500 monedas de oro.
- **Historial de Duelos**: Registro de victorias, derrotas y revanchas pendientes.

---

#### 📜 4. Crónicas
El registro histórico, social y económico vivo de la taberna:
- **El Muro de la Taberna (Tavern Wall)**:
  - Tablón comunitario donde los aventureros publican proclamas, gritos de guerra y mensajes con auras de clase y su título activo.
  - Difusión instantánea mediante Server-Sent Events (SSE) a todas las pantallas, incluido el Modo TV.
- **Mercado Libre P2P (Bazar de Aventureros)**:
  - Comercio directo entre jugadores sin intermediarios.
  - Publicación de ítems del inventario propio fijando el precio deseado en oro.
  - Compraventa con retención fiscal gremial del 5% y transferencia atómica de ítems.
- **Feed de Eventos en Tiempo Real**: Registro de caídas de Raid Bosses, transmutaciones legendarias, conquistas territoriales y ascensos en el ranking.

---

### 3.2. BOTONERA DE MÓDULOS DE "NIDO DE CUERVOS"

#### ⚔️ Senda Infinita (CORE - Aventura Procedural)
*El núcleo de progresión continua y combate de expedición.*
- **Combate Continuo en Tiempo Real**: Un auto-battler procedural que avanza sin pausas artificiales ni temporizadores rígidos.
- **Catálogo de Biomas Procedurales**:
  - 🌲 **Bosque de las Sombras**: Criaturas bestiales (*Lobos de Ceniza, Dríades Corruptas, Osos Rabiosos*).
  - 💀 **Cripta Carmesí**: No-muertos y horrores (*Guardianes Esqueléticos, Necrófagos, Señores Vampíricos*).
  - 🌋 **Volcán Olvidado**: Entidades de fuego (*Elementales de Magma, Salamandras Ígneas, Gólems de Lava*).
  - ❄️ **Picos Helados de Ymir**: Bestias boreales (*Huargos Polares, Yetis de las Nieves*).
- **Progresión de Oleadas y Jefes de Zona**: Cada oleada incrementa la vitalidad y el daño del monstruo. Cada 10 oleadas aparece un Guardián de Zona con botín aumentado.
- **Carro de Botín Acumulado**: Monedas de oro, experiencia y fragmentos se acumulan en la alforja de viaje en memoria y base de datos.
- **Retorno Seguro a la Taberna**: Al presionar *"Recolectar Botín y Descansar"*, todas las ganancias se acreditan atómicamente al personaje.

---

#### 🏆 Logros (Títulos & Perks)
*El Salón de Honores y personalización pasiva del aventurero.*
- **Catálogo de más de 50 Títulos Honoríficos**:
  - *Novicio Sediento, Sombra de la Barra, Campeón de la Tormenta, Segadora de Almas, Ojo de Halcón, Titán de las Brasas, Conquistador de Fortalezas, Heraldo del Cataclismo, etc.*
- **Perks Pasivos Asociados**: Al equipar un título en el perfil, se activan bonificaciones pasivas reales:
  - Bonificadores de atributos ($+1$ a $+5$ en Fuerza, Destreza, Inteligencia o Constitución).
  - Aumento porcentual de oro en expediciones ($+10\%$ a $+25\%$).
  - Modificador de tirada en duelos D20 ($+1$ al dado).
  - Reducción de daño en asedios.
- **Sincronización Total**: El título equipado se muestra en el avatar, en el Muro de la Taberna, en el Modo TV y en los duelos PvP.

---

#### ⚡ Talentos (Árbol & Forja de Refinamiento)
*El taller de especialización y mejora de equipamiento.*
- **Árbol de Talentos por Clase**:
  - Especializaciones con 3 ramas y 3 niveles (Tiers) desbloqueables mediante puntos de talento obtenidos al subir de nivel:
    - Rama Ofensiva (*Fuerza de Coloso, Crítico Devastador, Impacto Rúnico*).
    - Rama Defensiva (*Coraza Pétrea, Evasión Espectral, Guardia Férrea*).
    - Rama Fortuna & Magia (*Ojo del Avaro, Sabiduría Ancestral, Viento Veloz*).
- **Yunque Sagrado de Refinamiento (+1 al +15)**:
  - Sube de nivel cualquier arma o armadura multiplicando sus estadísticas base.
  - **Escalado de Éxito**:
    - Niveles $+1$ a $+6$: Probabilidad del $100\%$ al $70\%$ (seguro, no destruye).
    - Niveles $+7$ a $+9$: Probabilidad del $60\%$ al $40\%$ (fallo reduce nivel).
    - Niveles $+10$ a $+15$: Probabilidad del $30\%$ al $5\%$ con riesgo de destrucción del objeto.
- **Desguace Arcano (Salvage)**:
  - Desarma piezas de equipo obsoletas para recuperar un porcentaje de su valor en oro y cosechar *Polvo Arcano, Esencias Raras y Fragmentos Míticos* para la forja.

---

#### 🐾 Mascotas & Minijuegos
*Compañeros de viaje y ocio de taberna.*
- **Mascotas Místicas**:
  - Criaturas que acompañan al aventurero: *Lobo de las Sombras, Fénix Enano, Duende Avaro, Lechuza de la Sabiduría*.
  - Las mascotas suben de nivel alimentándose de esencias y otorgan bonos pasivos permanentes de ataque, defensa o hallazgo mágico.
- **Minijuego "Dados de Mentiroso" (Liar's Dice)**:
  - Juego clásico de dados de farol y engaño de taberna jugado contra Valerius el Tabernero u otros camaradas.
  - Apuestas de oro en rondas de declaración de dados ocultos en cubilete con acusaciones de mentira o desafío.

---

### 3.3. OTROS GRANDES SISTEMAS INTEGRADOS

#### 🐉 Colosos Mundiales (Raid Boss Cooperativo)
- **Batallas Masivas Comunitarias**:
  - **Ignis el Coloso Ígneo**: 500,000 HP • Elemento Fuego.
  - **Ymir el Titán de Escarcha**: 850,000 HP • Elemento Hielo.
- **Asalto Táctico de 60 Segundos**: Al iniciar el asalto, el jugador dispone de una ventana de combate donde cada tirada D20 asesta daño proporcional a sus atributos, con tiradas críticas (Nat 20) que desatan golpes multiplicados.
- **Hitos Colectivos de Daño**: Toda la taberna comparte la barra de vida del jefe. Al quebrar los umbrales del **75%, 50%, 25% y 0% (Derrota)**, se liberan cofres de botín comunitario con oro, gemas y equipo mítico para todos los participantes.
- **Medidor de Furia & Guardia Táctica**: El Coloso acumula furia; los jugadores deben activar la guardia para no quedar incapacitados ante contragolpes letales.

---

#### 💀 Catacumbas del Olvido
- **Dungeon Crawler Roguelike**: Selector de profundidad de 10 pisos subterráneos.
- **Resolución por Rondas D20**: El aventurero combate oleadas de no-muertos resolviendo 3 rondas tácticas (Ataque, Evasión y Golpe de Gracia) con log en tiempo real y recompensas de fragmentos rúnicos.

---

#### 🏛️ Misiones del Gremio & La Gran Bóveda
- **Contratos Diarios**: 3 misiones renovadas cada 24 horas (ej. realizar 3 duelos, vencer a 10 monstruos en la Senda, donar 50 de oro).
- **Contratos Semanales**: Objetivos mayores de exploración y asedios territoriales.
- **La Gran Bóveda Semanal**: Tras completar los hitos semanales, se desbloquea la Gran Bóveda el día de descanso, garantizando una reliquia de alto nivel y oro del tesoro real.

---

#### 📺 Modo TV Pantalla Pública 24/7
- Interfaz Full-HD diseñada para proyectores o televisores de la taberna.
- Fondos de taberna con animaciones atmosféricas y efectos visuales medievales.
- Podio animado de los 3 mejores aventureros y ticker en vivo de eventos mediante Server-Sent Events (SSE).

---

## 📜 4. HISTORIAL COMPLETO DE VERSIONES Y NOTAS DE PARCHE

### [v3.7.2] - 2026-09-16
- **Rediseño UI Completo**: Implementación de 3 estilos seleccionables desde el menú de ajustes:
  1. *Fantasía Gótica*: Acentos dorados, fondos obsidiana y marcos ornamentados.
  2. *Glassmorphism*: Fondos traslúcidos con desenfoque de fondo (*backdrop-blur*) y bordes cian de neón.
  3. *Flat E-Sports*: Paneles minimalistas de alto contraste con tipografía sans-serif moderna.
- **Optimización Tipográfica**: Carga refinada de Google Fonts (*Cinzel, Outfit, Inter*).

### [v3.7.1] - 2026-09-16
- **Menú Desplegable de Perfil**: Centralización de Ajustes, SFX de Audio, Temas Visuales y Cierre de Sesión en el avatar del navbar.
- **Rankings a Doble Columna**: Pestaña dedicada con vista paralela de aventureros individuales y clanes, podio de medallas (Oro, Plata, Bronce) y tarjeta flotante con la posición actual del jugador.

### [v3.7.0] - 2026-09-16
- **Nido de Cuervos: Senda Infinita Procedural**: Lanzamiento del auto-battler continuo sin pomodoro con escalado por biomas.
- **Guild Raids Asíncronos**: Incursiones de 60s contra Colosos mundiales con barra de vida compartida e hitos comunitarios.
- **Guerra de Clanes (Tug of War 24h)**: Campo de batalla horizontal con soga táctica de 100m.
- **Solo Raids de 3 Cámaras**: Incursiones tácticas en solitario para miembros de clanes.
- **RpgToast Flotante**: Sistema de notificaciones no intrusivas con efectos sonoros de fantasía.

### [v3.6.0] - 2026-09-09
- **Las Catacumbas Olvidadas**: Dungeon crawler procedural ramificado con nodos de combate, descanso y élite.
- **Mecánica de Riesgo vs Recompensa**: Saco de botín acumulativo con penalización por derrota o escape seguro.
- **Avatar Paper Doll Visual**: Siluetas de clase interactivas con resplandor glow de forja (+4 plateado, +7 solar, +10 fuego astral).
- **Logros & Títulos Honoríficos**: Primer catálogo de 50 títulos con perks pasivos activos.

### [v3.5.0] - 2026-09-09
- **Rediseño Táctico del Raid Boss**: Incorporación de estamina, contraataque del jefe, daño letal y maniobra de Guardia Táctica.
- **Selector de 3 Dificultades**: Normal, Heroico (+50% HP/daño) y Mítico (+120% botín y escudos rúnicos).
- **Reanimación de Taberna**: Pago de 10 monedas de oro a Valerius para recibir un trago de hidromiel y continuar en combate.

### [v3.4.0] - 2026-09-08
- **Biblia de Lore & Expansión Narrativa**: Worldbuilding completo sobre el Cataclismo de la Grieta de Éter y el Nido de Cuervos.
- **Generador Procedural de Flavor Text**: Mitología, citas épicas y origen histórico añadido a cada objeto generado.
- **NPCs Interactivos con Diálogos Reactivos**: Valerius el Tabernero, Brida la Herrera y Vael el Erudito Ciego.
- **Voces y Frases de Combate para Colosos**: Diálogos al iniciar, a media vida y al ser derrotados.

### [v3.3.1] - 2026-09-08
- **Modo Cuadrícula MMORPG**: Doble visualización de inventario en casillas estilo WoW/Diablo vs lista táctica.
- **Modal de Inspección Detallada (Item Inspect)**: Ficha de alta resolución con comparativa contra el ítem equipado.
- **Filtros por Ranura & Ordenamiento Instantáneo**: Clasificación por slot y orden por rareza, iLvl o temple.

### [v3.3.0] - 2026-09-08
- **Misiones Diarias y Semanales**: Tablón con rotación automática UTC y contador regresivo.
- **La Gran Bóveda**: Recompensa monumental semanal por acumulación de actividades gremiales.
- **Yunque de Refinamiento (+1 a +10)**: Mejora progresiva de equipo con costes escalonados y Desguace Arcano (Salvage).
- **Conjuntos Legendarios de Bosses**: Bonificaciones activas de 2 y 4 piezas para los sets de Ignis, Malakor, Aurelius y Kaelith.

### [v3.2.0] - 2026-09-08
- **Motor Procedural de Ítems ARPG**: Generación de armas y armaduras con prefijos, sufijos y poderes legendarios reactivos.
- **Cofre Misterioso del Bazar**: Forja de equipo adaptado al nivel del aventurero.

### [v3.1.0] - 2026-09-07
- **Árboles de Talentos por Clase**: Especializaciones únicas para Guerrero, Mago, Pícaro y Bardo con 3 ramas y 3 tiers.
- **Raid Boss Multijefe**: Catálogo ampliado de 4 jefes elementales con escalado de daño D20 (Pifia, Rozadura, Sólido, Demoledor, Nat 20).

### [v3.0.0] - 2026-09-05
- **La Guerra de Clanes & Mapa Territorial**: Fundación de hermandades, tesorería compartida y conquista de los 4 territorios.
- **Sincronización Offline PWA**: Soporte de juego sin conexión local con sincronización automática al recuperar red.

### [v2.5.0] - 2026-09-05
- **Compañeros Místicos**: Sistema de mascotas con bonos pasivos permanentes.
- **Minijuego "Dados de Mentiroso"**: Juego de dados interactivo contra el Tabernero apostando oro.

### [v2.2.0] - 2026-09-05
- **Árbol de Talentos Inicial**: Ramas de Ofensiva, Defensiva y Fortuna.
- **Yunque de Runas**: Imbuir equipo con Fuego, Escudo o Fortuna.

### [v2.0.0] - 2026-09-05
- **El Asedio Cooperativo**: Primer Raid Boss contra Ignis (5,000 HP) sincronizado en vivo con el Modo TV.

### [v1.5.0] - 2026-09-05
- **El Muro de la Taberna & Mercado P2P**: Publicación de proclamas comunitarias y comercio libre entre jugadores.

### [v1.4.0] - 2026-09-05
- **Motor de Audio SFX Procedural**: Síntesis sonora mediante Web Audio API sin descargas pesadas de audio.
- **Auras de Clase & Grimorio Táctico**: Efectos de partículas dinámicos según clase.

### [v1.3.0] - 2026-09-05
- **Arena D20 con Dados 3D**: Animaciones de lanzamiento de dado con impactos visuales.
- **Salón de la Fama**: Clasificación comunitaria por nivel, oro y victorias.

### [v1.2.0] - 2026-09-05
- **Pergamino de Novedades**: Modal emergente al iniciar sesión con las notas de parche.

### [v1.1.0] - 2026-08-28
- **Duelos PvP en Tiempo Real**: Desafíos de barra con apuestas de oro.
- **50 Títulos Legendarios**: Primeros títulos con efectos visuales.
- **Integración con Bot de Telegram**: Notificaciones de compras y desafíos.

### [v1.0.0] - 2026-08-15
- **Lanzamiento Oficial de la Taberna**: Autenticación de aventureros con contraseña segura, tienda de objetos, Modo TV interactivo y PWA móvil.

---

## 🧮 5. APÉNDICE: FÓRMULAS MATEMÁTICAS Y REGLAS DE EQUILIBRIO

### 5.1. Fórmula de Duelo PvP (Bo3)
$$\text{Puntaje de Ronda} = 1d20 + \lfloor \frac{\text{Nivel}}{5} \rfloor + \text{Modificador de Atributo} + \text{Pasiva de Clase}$$

### 5.2. Curva de Experiencia por Nivel
$$\text{XP Requerida}(L) = 100 \times L^{1.5}$$

### 5.3. Éxito de Refinamiento en Forja
$$\text{Probabilidad de Éxito}(R) = \begin{cases} 
100\% & \text{si } R \le 2 \\
100 - (R - 2) \times 7\% & \text{si } 3 \le R \le 8 \\
40 - (R - 8) \times 8\% & \text{si } 9 \le R \le 12 \\
10\% & \text{si } R > 12 
\end{cases}$$

### 5.4. Racha Diaria de la Taberna (Daily Streak)
$$\text{Oro Reclamado} = 15 + (\text{Racha en Días} \times 2) \quad (\text{Máximo: } 50\text{ Oro})$$
$$\text{XP Reclamada} = 25 + (\text{Racha en Días} \times 5) \quad (\text{Máximo: } 150\text{ XP})$$

---

*Manual elaborado y actualizado por el Equipo Maestro Hermes para la versión 3.7.2.*
