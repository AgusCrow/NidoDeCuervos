import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-runs-dungeons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <div class="runs-dungeons-container">
      <!-- HEADER CON RESUMEN DE RECURSOS -->
      <div class="header-section glass-panel">
        <div class="title-box">
          <span class="header-icon">🧭</span>
          <div>
            <h2>RUNS, EXPEDICIONES & COLOSOS MUNDIALES</h2>
            <p class="subtitle">Senda Infinita por zonas, Incursiones de Gremio y Asedio a Colosos estilo Chaos Castle</p>
          </div>
        </div>
        <div class="user-status-chips">
          <div class="chip-item gold">
            <span class="icon">🪙</span>
            <span class="val">{{ userGold }} Oro</span>
          </div>
          <div class="chip-item xp">
            <span class="icon">✨</span>
            <span class="val">{{ userXp }} XP</span>
          </div>
          <div class="chip-item level">
            <span class="icon">🎖️</span>
            <span class="val">Nv. {{ playerLevel }}</span>
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="300ms" class="cyber-tabs glass-panel">
        <!-- ===================================================================
             PESTAÑA 1: SENDA INFINITA UNIFICADA (ZONAS Y DIFICULTADES)
             =================================================================== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">explore</mat-icon> Senda Infinita
          </ng-template>
          <div class="tab-content">
            <!-- Banner de Auto-combate Silencioso de Fondo -->
            <div class="ambient-banner glass-panel">
              <div class="ambient-left">
                <span class="ambient-icon">⚔️</span>
                <div>
                  <h4>Combate Continuo en Segundo Plano (Siempre Activo)</h4>
                  <p>Tu héroe combate incansablemente en la penumbra. El botín se acumula sin pausa mientras exploras.</p>
                </div>
              </div>
              <div class="ambient-right">
                <div class="afk-loot-box">
                  <span>🪙 {{ sendaState?.passiveLoot?.gold || 0 }} Oro | ✨ {{ sendaState?.passiveLoot?.xp || 0 }} XP</span>
                  <button mat-raised-button color="accent" class="claim-afk-btn" (click)="claimAfkLoot()" [disabled]="(sendaState?.passiveLoot?.gold || 0) === 0">
                    <mat-icon>archive</mat-icon> Recoger Botín Pasivo
                  </button>
                </div>
              </div>
            </div>

            <!-- EXPEDICIÓN ACTIVA EN TIEMPO REAL (SI EXISTE) -->
            <div *ngIf="sendaState?.activeRun" class="active-mission-card glass-panel" [class.completed]="sendaState?.activeRun?.isCompleted">
              <div class="mission-header">
                <div class="m-title-cluster">
                  <span class="m-icon">{{ sendaState?.activeRun?.zoneIcon }}</span>
                  <div>
                    <h3>{{ sendaState?.activeRun?.zoneName }}</h3>
                    <span class="diff-badge" [ngClass]="sendaState?.activeRun?.difficultyId.toLowerCase()">
                      Dificultad: {{ sendaState?.activeRun?.difficultyName }}
                    </span>
                  </div>
                </div>
                <div class="m-timer-cluster">
                  <span class="timer-label">{{ sendaState?.activeRun?.isCompleted ? '¡EXPEDICIÓN CONCLUIDA!' : 'TIEMPO RESTANTE' }}</span>
                  <div class="timer-digits">
                    <mat-icon>alarm</mat-icon>
                    <span>{{ formatTime(sendaState?.activeRun?.remainingSeconds || 0) }}</span>
                  </div>
                </div>
              </div>

              <!-- Barra de progreso -->
              <mat-progress-bar mode="determinate" 
                                [value]="getSendaProgressPct()" 
                                [color]="sendaState?.activeRun?.isCompleted ? 'accent' : 'primary'">
              </mat-progress-bar>

              <div class="mission-footer">
                <div class="rewards-preview">
                  <span>Recompensa esperada:</span>
                  <strong>🪙 +{{ sendaState?.activeRun?.rewardGold }} Oro</strong>
                  <strong>✨ +{{ sendaState?.activeRun?.rewardXp }} XP</strong>
                  <strong *ngIf="sendaState?.activeRun?.rewardMaterials > 0">💎 +{{ sendaState?.activeRun?.rewardMaterials }} Mat.</strong>
                </div>
                <button mat-raised-button color="primary" class="action-claim-btn"
                        [disabled]="!sendaState?.activeRun?.canClaim"
                        (click)="claimSendaRun()">
                  <mat-icon>{{ sendaState?.activeRun?.isCompleted ? 'military_tech' : 'hourglass_top' }}</mat-icon>
                  {{ sendaState?.activeRun?.isCompleted ? 'Reclamar Botín de la Senda' : 'En Curso (Solo 1 a la vez)' }}
                </button>
              </div>
            </div>

            <!-- SELECTOR DE ZONAS Y DIFICULTADES (SI NO HAY RUN ACTIVA) -->
            <div *ngIf="!sendaState?.activeRun" class="setup-run-container">
              <h3 class="section-title">🗺️ Selecciona Zona y Nivel de Dificultad (Solo 1 Expedición Activa a la Vez)</h3>
              
              <!-- Grilla de Zonas -->
              <div class="zones-grid">
                <div *ngFor="let z of sendaState?.zones" 
                     class="zone-card glass-panel" 
                     [class.selected]="selectedZoneId === z.id"
                     [class.locked]="!z.isUnlocked"
                     (click)="z.isUnlocked ? selectedZoneId = z.id : null">
                  <div class="z-header">
                    <span class="z-icon">{{ z.icon }}</span>
                    <span class="z-level-req">Nv. {{ z.minLevel }}+</span>
                  </div>
                  <h4>{{ z.name }}</h4>
                  <p class="z-desc">{{ z.desc }}</p>
                  <div class="z-rewards-base">
                    <span>Base: 🪙 {{ z.baseGold }} | ✨ {{ z.baseXp }}</span>
                  </div>
                </div>
              </div>

              <!-- Selector de Dificultad -->
              <div class="difficulties-strip glass-panel">
                <span class="strip-label">Nivel de Desafío:</span>
                <div class="diff-buttons">
                  <button *ngFor="let d of sendaState?.difficulties" 
                          class="diff-btn" 
                          [class.selected]="selectedDiffId === d.id"
                          (click)="selectedDiffId = d.id">
                    <span class="d-name">{{ d.name }}</span>
                    <span class="d-time">{{ d.durationMinutes }} min</span>
                    <span class="d-mult">Oro x{{ d.multiplierGold }} | XP x{{ d.multiplierXp }}</span>
                  </button>
                </div>
              </div>

              <div class="start-action-bar">
                <button mat-raised-button color="accent" class="start-journey-btn" (click)="startSendaRun()">
                  <mat-icon>directions_run</mat-icon> Emprender Expedición de Senda
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- ===================================================================
             PESTAÑA 2: EXPEDICIONES DE GREMIO (12h, 24h, 48h - COOPERATIVAS)
             =================================================================== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">shield</mat-icon> Expediciones del Gremio
          </ng-template>
          <div class="tab-content">
            <!-- Aviso si no tiene clan -->
            <div *ngIf="!guildState?.inClan" class="no-clan-warning glass-panel">
              <span class="warn-icon">⚠️</span>
              <div>
                <h3>¡Debes pertenecer a una Hermandad!</h3>
                <p>Las expediciones de gremio requieren coordinar esfuerzos con tus camaradas de clan.</p>
              </div>
            </div>

            <!-- Si pertenece a un clan -->
            <div *ngIf="guildState?.inClan" class="guild-exp-wrapper">
              <div class="guild-banner glass-panel">
                <div class="g-info">
                  <span class="g-flag">🛡️</span>
                  <div>
                    <h3>Hermandad: {{ guildState?.clan?.clan_name }} [{{ guildState?.clan?.clan_tag }}]</h3>
                    <p>Las incursiones de larga duración fortalecen la tesorería del clan y otorgan botines heroicos.</p>
                  </div>
                </div>
              </div>

              <!-- Expedición Activa en Curso -->
              <div *ngIf="guildState?.activeExpedition" class="active-mission-card guild glass-panel" [class.completed]="guildState?.activeExpedition?.isCompleted">
                <div class="mission-header">
                  <div class="m-title-cluster">
                    <span class="m-icon">{{ guildState?.activeExpedition?.icon }}</span>
                    <div>
                      <h3>{{ guildState?.activeExpedition?.title }}</h3>
                      <span class="diff-badge guild">Incursión de Gremio Activa</span>
                    </div>
                  </div>
                  <div class="m-timer-cluster">
                    <span class="timer-label">{{ guildState?.activeExpedition?.isCompleted ? '¡INCURSIÓN CONCLUIDA!' : 'TIEMPO RESTANTE' }}</span>
                    <div class="timer-digits">
                      <mat-icon>timer</mat-icon>
                      <span>{{ formatTime(guildState?.activeExpedition?.remainingSeconds || 0) }}</span>
                    </div>
                  </div>
                </div>

                <mat-progress-bar mode="determinate" 
                                  [value]="getGuildProgressPct()" 
                                  color="warn">
                </mat-progress-bar>

                <div class="mission-footer">
                  <div class="rewards-preview">
                    <span>Recompensas:</span>
                    <strong>🪙 +{{ guildState?.activeExpedition?.rewardGold }} Oro personal</strong>
                    <strong>🏛️ +{{ guildState?.activeExpedition?.clanGold }} Oro para el Clan</strong>
                    <strong>✨ +{{ guildState?.activeExpedition?.rewardXp }} XP</strong>
                    <strong>💎 +{{ guildState?.activeExpedition?.rewardMaterials }} Mat. Legendarios</strong>
                  </div>
                  <button mat-raised-button color="warn" class="action-claim-btn"
                          [disabled]="!guildState?.activeExpedition?.canClaim"
                          (click)="claimGuildExpedition()">
                    <mat-icon>military_tech</mat-icon>
                    {{ guildState?.activeExpedition?.isCompleted ? 'Reclamar Botín de la Incursión' : 'Marchando (Solo 1 a la vez)' }}
                  </button>
                </div>
              </div>

              <!-- Lista de Expediciones si no hay activa -->
              <div *ngIf="!guildState?.activeExpedition" class="guild-list-container">
                <h3 class="section-title">⚔️ Elige una Incursión Comunitaria (Solo 1 Activa a la Vez)</h3>
                <div class="guild-cards-grid">
                  <div *ngFor="let g of guildState?.expeditions" class="guild-card glass-panel">
                    <div class="g-card-top">
                      <span class="g-card-icon">{{ g.icon }}</span>
                      <div class="g-card-meta">
                        <h4>{{ g.title }}</h4>
                        <span class="g-card-duration">⏳ {{ g.durationHours }} Horas ({{ g.durationHours / 24 >= 1 ? (g.durationHours / 24) + ' día(s)' : '' }})</span>
                      </div>
                    </div>
                    <p class="g-card-desc">{{ g.desc }}</p>
                    <div class="g-card-rewards">
                      <div><span>Personal:</span> <strong>🪙 +{{ g.rewardGold }} | ✨ +{{ g.rewardXp }}</strong></div>
                      <div><span>Tesorería Clan:</span> <strong>🏛️ +{{ g.clanGold }} Oro</strong></div>
                      <div><span>Materiales:</span> <strong>💎 +{{ g.rewardMaterials }}</strong></div>
                    </div>
                    <button mat-raised-button color="primary" class="start-guild-btn" (click)="startGuildExpedition(g.id)">
                      <mat-icon>flag</mat-icon> Iniciar Marcha Militar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- ===================================================================
             PESTAÑA 3: COLOSOS MUNDIALES (CHAOS CASTLE: 5 SALAS, MÁX 100)
             =================================================================== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">sports_martial_arts</mat-icon> Colosos (Chaos Castle)
          </ng-template>
          <div class="tab-content">
            <!-- Selector de las 5 Salas de Nivel -->
            <div class="cc-rooms-strip glass-panel">
              <div class="cc-strip-header">
                <h3>🏰 Salas de Asedio de Colosos (División por Nivel de Ingreso - Máx 100 Jugadores)</h3>
                <span class="player-lvl-tag">Tu Nivel: <strong>{{ raidState?.playerLevel || 1 }}</strong></span>
              </div>
              
              <div class="rooms-nav-list">
                <div *ngFor="let r of raidState?.rooms" 
                     class="room-chip"
                     [class.active]="selectedRoomId === r.id"
                     [class.eligible]="r.isEligible"
                     [class.full]="r.isFull"
                     (click)="selectRaidRoom(r.id)">
                  <div class="r-info-top">
                    <span class="r-badge-tier">Tier {{ r.id.replace('cc_room_', '') }}</span>
                    <span class="r-cap-pill" [class.danger]="r.isFull">👥 {{ r.registeredCount }} / 100</span>
                  </div>
                  <strong class="r-name">{{ r.name }}</strong>
                  <span class="r-range">Nivel {{ r.minLevel }} - {{ r.maxLevel >= 999 ? '99+' : r.maxLevel }}</span>
                  <span *ngIf="r.isEligible" class="eligible-badge">⭐ Tu Categoría</span>
                  <span *ngIf="r.isJoined" class="joined-badge">✅ Inscrito</span>
                </div>
              </div>
            </div>

            <!-- ARENA DEL COLOSO DE LA SALA SELECCIONADA -->
            <div *ngIf="currentRoomData" class="cc-arena-panel glass-panel">
              <div class="boss-overview-row">
                <div class="boss-info-cluster">
                  <span class="boss-avatar-icon">🐉</span>
                  <div>
                    <h2>{{ currentRoomData.name }}</h2>
                    <p class="boss-sub">Coloso Titánico | Ventana de Asalto: 3 minutos | Ciclo rotativo cada 4 horas</p>
                  </div>
                </div>

                <div class="boss-join-action">
                  <!-- Botón Unirse si no está inscrito -->
                  <button *ngIf="!currentRoomData.isJoined" 
                          mat-raised-button color="accent" 
                          class="join-raid-btn"
                          [disabled]="!currentRoomData.isEligible || currentRoomData.isFull"
                          (click)="joinRaidRoom(currentRoomData.id)">
                    <mat-icon>how_to_reg</mat-icon> 
                    {{ currentRoomData.isFull ? 'SALA LLENA (100/100)' : (currentRoomData.isEligible ? 'Unirse al Asalto (Inscribirse)' : 'Nivel no Admitido') }}
                  </button>

                  <!-- Badge si ya está inscrito -->
                  <div *ngIf="currentRoomData.isJoined" class="joined-status-pill">
                    <mat-icon>check_circle</mat-icon>
                    <span>Inscrito en esta Sala</span>
                  </div>
                </div>
              </div>

              <!-- BARRA DE VIDA DEL COLOSO -->
              <div class="boss-hp-section">
                <div class="hp-meta-row">
                  <span>Vitalidad del Coloso</span>
                  <strong class="hp-nums">{{ currentRoomData.currentHp }} / {{ currentRoomData.maxHp }} HP ({{ currentRoomData.hpPct }}%)</strong>
                </div>
                <mat-progress-bar mode="determinate" 
                                  [value]="currentRoomData.hpPct" 
                                  [color]="currentRoomData.isDefeated ? 'accent' : 'warn'">
                </mat-progress-bar>
              </div>

              <!-- ACCIONES DE COMBATE O RECLAMO -->
              <div class="arena-controls-box">
                <!-- Si el coloso sigue vivo y está inscrito -->
                <div *ngIf="currentRoomData.isJoined && !currentRoomData.isDefeated" class="attack-controls">
                  <button mat-raised-button color="warn" class="attack-boss-btn" (click)="attackRaidBoss(currentRoomData.id)">
                    <mat-icon>sports_martial_arts</mat-icon> Asestar Asalto de 3 Minutos
                  </button>
                  <span class="user-contrib-stat">Tu daño acumulado: <strong>{{ raidState?.playerStats?.damageDealt || 0 }} pts</strong> | Rango actual: <strong>#{{ raidState?.playerStats?.rank || '-' }}</strong></span>
                </div>

                <!-- Si el coloso fue derrotado (HP = 0) -->
                <div *ngIf="currentRoomData.isDefeated" class="victory-rewards-banner">
                  <div class="vic-text">
                    <span class="vic-icon">🏆</span>
                    <div>
                      <h3>¡EL COLOSO HA SIDO ANIQUILADO!</h3>
                      <p>Se distribuyen botines legendarios según tu posición en el ranking de daño.</p>
                    </div>
                  </div>
                  <button *ngIf="currentRoomData.isJoined && !raidState?.playerStats?.isClaimed" 
                          mat-raised-button color="accent" 
                          class="claim-vic-btn"
                          (click)="claimRaidReward(currentRoomData.id)">
                    <mat-icon>military_tech</mat-icon> Reclamar Recompensa de Ranking
                  </button>
                  <span *ngIf="raidState?.playerStats?.isClaimed" class="already-claimed-tag">
                    ✅ Ya has recibido tu recompensa de este Coloso
                  </span>
                </div>
              </div>

              <!-- LEADERBOARD DE LA SALA -->
              <div class="room-leaderboard-section">
                <h4>🏅 Tabla de Honor de la Sala (Top Contribuidores de Daño)</h4>
                <div class="leaderboard-table-box">
                  <div *ngFor="let item of raidState?.leaderboard; let idx = index" class="lb-row" [class.highlight]="item.player_id === 'usr_kaelen'">
                    <span class="lb-rank">#{{ idx + 1 }}</span>
                    <span class="lb-name">{{ item.player_name }} (Nv. {{ item.player_level }})</span>
                    <span class="lb-damage">{{ item.damage_dealt }} pts de daño</span>
                    <span class="lb-assaults">{{ item.assaults_count }} asaltos</span>
                  </div>
                  <div *ngIf="!raidState?.leaderboard || raidState?.leaderboard.length === 0" class="empty-lb">
                    <span>Aún no se han registrado asaltos en esta sala. ¡Sé el primero en golpear!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .runs-dungeons-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1300px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-radius: 16px;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-box {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      .header-icon { font-size: 2.8rem; }
      h2 { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 1px; color: #fff; }
      .subtitle { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-secondary); }
    }

    .user-status-chips {
      display: flex;
      gap: 0.75rem;
      .chip-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.9rem;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        &.gold { color: var(--accent-gold); border-color: rgba(245, 158, 11, 0.4); }
        &.xp { color: #818cf8; border-color: rgba(129, 140, 248, 0.4); }
        &.level { color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.4); }
      }
    }

    .tab-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* BANNER AMBIENTAL (AUTO-COMBATE SILENCIOSO) */
    .ambient-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 1.8rem;
      border-radius: 12px;
      border-left: 4px solid var(--accent-cyan);
      flex-wrap: wrap;
      gap: 1rem;
      .ambient-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        .ambient-icon { font-size: 2.2rem; }
        h4 { margin: 0 0 0.2rem; font-size: 1.05rem; color: #fff; }
        p { margin: 0; font-size: 0.825rem; color: var(--text-secondary); }
      }
      .afk-loot-box {
        display: flex;
        align-items: center;
        gap: 1rem;
        span { font-weight: 700; font-size: 0.95rem; color: var(--accent-gold); }
      }
    }

    /* TARJETA DE MISIÓN ACTIVA */
    .active-mission-card {
      padding: 1.8rem;
      border-radius: 14px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      &.completed { border-color: #10b981; box-shadow: 0 0 24px rgba(16, 185, 129, 0.2); }
      &.guild { border-color: #f59e0b; }
      .mission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .m-title-cluster {
        display: flex;
        align-items: center;
        gap: 1rem;
        .m-icon { font-size: 2.5rem; }
        h3 { margin: 0 0 0.3rem; font-size: 1.3rem; color: #fff; }
      }
      .diff-badge {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.1);
        &.normal { color: #4ade80; }
        &.hard { color: #facc15; }
        &.nightmare { color: #f87171; }
        &.abyssal { color: #c084fc; }
        &.guild { color: #fbbf24; background: rgba(245, 158, 11, 0.2); }
      }
      .m-timer-cluster {
        text-align: right;
        .timer-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; display: block; }
        .timer-digits {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 1.8rem;
          font-family: var(--font-code);
          font-weight: 800;
          color: var(--accent-cyan);
          mat-icon { font-size: 1.6rem; }
        }
      }
      .mission-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        .rewards-preview {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.9rem;
          span { color: var(--text-secondary); }
          strong { color: #fff; }
        }
        .action-claim-btn {
          font-weight: 700;
          padding: 0.6rem 1.6rem;
        }
      }
    }

    /* CONFIGURADOR DE SENDA */
    .section-title {
      font-size: 1.15rem;
      color: #f1f5f9;
      margin-bottom: 0.5rem;
    }

    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .zone-card {
      padding: 1.2rem;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.2s ease;
      &:hover:not(.locked) {
        border-color: var(--accent-cyan);
        transform: translateY(-2px);
      }
      &.selected {
        border-color: var(--accent-cyan);
        background: rgba(6, 182, 212, 0.12);
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
      }
      &.locked {
        opacity: 0.45;
        cursor: not-allowed;
        filter: grayscale(0.8);
      }
      .z-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .z-icon { font-size: 2rem; }
        .z-level-req { font-size: 0.75rem; font-weight: 700; color: var(--accent-gold); }
      }
      h4 { margin: 0; font-size: 1.05rem; color: #fff; }
      .z-desc { margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.3; }
      .z-rewards-base { font-size: 0.75rem; color: #94a3b8; margin-top: auto; padding-top: 0.4rem; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    }

    .difficulties-strip {
      padding: 1rem 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      .strip-label { font-weight: 700; font-size: 0.95rem; color: #fff; }
      .diff-buttons {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .diff-btn {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        color: #cbd5e1;
        transition: all 0.2s ease;
        &.selected {
          border-color: var(--accent-gold);
          background: rgba(245, 158, 11, 0.15);
          color: #fff;
        }
        .d-name { font-weight: 700; font-size: 0.85rem; }
        .d-time { font-size: 0.7rem; color: var(--accent-cyan); }
        .d-mult { font-size: 0.65rem; color: #94a3b8; }
      }
    }

    .start-action-bar {
      display: flex;
      justify-content: flex-end;
      .start-journey-btn {
        font-weight: 700;
        padding: 0.7rem 2rem;
        font-size: 1rem;
      }
    }

    /* EXPEDICIONES DE GREMIO */
    .guild-banner {
      padding: 1.2rem 1.8rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      border-left: 4px solid var(--accent-gold);
      .g-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        .g-flag { font-size: 2.2rem; }
        h3 { margin: 0 0 0.2rem; font-size: 1.2rem; color: #fff; }
        p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
      }
    }

    .guild-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.2rem;
    }

    .guild-card {
      padding: 1.5rem;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      .g-card-top {
        display: flex;
        align-items: center;
        gap: 1rem;
        .g-card-icon { font-size: 2.5rem; }
        h4 { margin: 0 0 0.2rem; font-size: 1.1rem; color: #fff; }
        .g-card-duration { font-size: 0.8rem; color: var(--accent-gold); font-weight: 700; }
      }
      .g-card-desc { margin: 0; font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4; }
      .g-card-rewards {
        background: rgba(0, 0, 0, 0.3);
        padding: 0.8rem;
        border-radius: 8px;
        font-size: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        span { color: #94a3b8; }
        strong { color: #fff; }
      }
      .start-guild-btn {
        margin-top: auto;
        font-weight: 700;
      }
    }

    /* COLOSOS MUNDIALES (CHAOS CASTLE) */
    .cc-rooms-strip {
      padding: 1.2rem 1.6rem;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      .cc-strip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        h3 { margin: 0; font-size: 1.15rem; color: #fff; }
        .player-lvl-tag { font-size: 0.9rem; color: var(--accent-cyan); }
      }
      .rooms-nav-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.8rem;
      }
      .room-chip {
        padding: 0.9rem;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        transition: all 0.2s ease;
        &:hover { border-color: var(--accent-cyan); }
        &.active { border-color: var(--accent-gold); background: rgba(245, 158, 11, 0.12); }
        &.eligible { border-left: 3px solid #10b981; }
        .r-info-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 700;
          .r-badge-tier { color: #94a3b8; }
          .r-cap-pill { color: var(--accent-cyan); font-family: var(--font-code); &.danger { color: #ef4444; } }
        }
        .r-name { font-size: 0.9rem; color: #fff; line-height: 1.2; }
        .r-range { font-size: 0.75rem; color: #cbd5e1; }
        .eligible-badge { font-size: 0.65rem; color: #4ade80; font-weight: 700; }
        .joined-badge { font-size: 0.65rem; color: #38bdf8; font-weight: 700; }
      }
    }

    .cc-arena-panel {
      padding: 1.8rem;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .boss-overview-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      .boss-info-cluster {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        .boss-avatar-icon { font-size: 3.5rem; }
        h2 { margin: 0 0 0.3rem; font-size: 1.5rem; color: #fff; }
        .boss-sub { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
      }
      .join-raid-btn {
        font-weight: 800;
        padding: 0.8rem 1.8rem;
        font-size: 0.95rem;
      }
      .joined-status-pill {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        background: rgba(6, 182, 212, 0.2);
        color: var(--accent-cyan);
        font-weight: 700;
        border: 1px solid var(--accent-cyan);
      }
    }

    .boss-hp-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      .hp-meta-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        span { color: var(--text-secondary); }
        .hp-nums { color: #f87171; font-family: var(--font-code); }
      }
    }

    .arena-controls-box {
      padding: 1.2rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.3);
      .attack-controls {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        .attack-boss-btn {
          font-weight: 800;
          padding: 0.75rem 2rem;
          font-size: 1rem;
        }
        .user-contrib-stat {
          font-size: 0.9rem;
          color: #e2e8f0;
          strong { color: var(--accent-gold); }
        }
      }
      .victory-rewards-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        .vic-text {
          display: flex;
          align-items: center;
          gap: 1rem;
          .vic-icon { font-size: 2.5rem; }
          h3 { margin: 0 0 0.2rem; font-size: 1.25rem; color: #4ade80; }
          p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
        }
        .claim-vic-btn { font-weight: 800; padding: 0.75rem 1.8rem; }
        .already-claimed-tag { font-weight: 700; color: #10b981; }
      }
    }

    .room-leaderboard-section {
      h4 { margin: 0 0 0.8rem; font-size: 1rem; color: #fff; }
      .leaderboard-table-box {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        .lb-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          font-size: 0.85rem;
          &.highlight { background: rgba(6, 182, 212, 0.15); border: 1px solid var(--accent-cyan); }
          .lb-rank { font-weight: 800; width: 35px; color: var(--accent-gold); }
          .lb-name { flex: 1; color: #f8fafc; font-weight: 600; }
          .lb-damage { color: #f87171; font-family: var(--font-code); font-weight: 700; margin-right: 1.5rem; }
          .lb-assaults { color: #94a3b8; font-size: 0.75rem; }
        }
        .empty-lb { padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
      }
    }
  `]
})
export class RunsDungeonsComponent implements OnInit, OnDestroy {
  userGold = 520;
  userXp = 2473;
  playerLevel = 10;

  // Senda Infinita State
  sendaState: any = null;
  selectedZoneId = 'bosque_sombras';
  selectedDiffId = 'NORMAL';

  // Expediciones de Gremio State
  guildState: any = null;

  // Colosos Mundiales (Chaos Castle) State
  raidState: any = null;
  selectedRoomId = 'cc_room_1';

  private timerInterval?: any;

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit(): void {
    this.fetchAllData();
    this.timerInterval = setInterval(() => {
      this.tickTimers();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  fetchAllData(): void {
    this.fetchSendaState();
    this.fetchGuildState();
    this.fetchRaidState();
  }

  // =========================================================================
  // 1. SENDA INFINITA
  // =========================================================================
  fetchSendaState(): void {
    this.http.get<any>('/api/v1/runs/journey/state').subscribe({
      next: (res) => {
        if (res && res.data) {
          this.sendaState = res.data;
          this.playerLevel = res.data.playerLevel || this.playerLevel;
        }
      },
      error: () => {}
    });
  }

  startSendaRun(): void {
    this.http.post<any>('/api/v1/runs/journey/start', {
      zoneId: this.selectedZoneId,
      difficultyId: this.selectedDiffId,
    }).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.fetchSendaState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo iniciar la expedición.';
        this.toast.warn(msg);
      }
    });
  }

  claimSendaRun(): void {
    this.http.post<any>('/api/v1/runs/journey/claim', {}).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.userGold = res.newPlayerGold;
        this.userXp = res.newPlayerXp;
        this.fetchSendaState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo reclamar el botín.';
        this.toast.warn(msg);
      }
    });
  }

  claimAfkLoot(): void {
    this.http.post<any>('/api/v1/runs/journey/claim-afk', {}).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.userGold = res.newPlayerGold;
        this.userXp = res.newPlayerXp;
        this.fetchSendaState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No hay botín para recoger.';
        this.toast.info(msg);
      }
    });
  }

  getSendaProgressPct(): number {
    if (!this.sendaState?.activeRun) return 0;
    if (this.sendaState.activeRun.isCompleted) return 100;
    const rem = this.sendaState.activeRun.remainingSeconds || 0;
    const diff = this.sendaState.difficulties?.find((d: any) => d.id === this.sendaState.activeRun.difficultyId);
    const totalSecs = (diff?.durationMinutes || 15) * 60;
    const elapsed = Math.max(0, totalSecs - rem);
    return Math.min(100, Math.round((elapsed / totalSecs) * 100));
  }

  // =========================================================================
  // 2. EXPEDICIONES DE GREMIO
  // =========================================================================
  fetchGuildState(): void {
    this.http.get<any>('/api/v1/runs/guild-expeditions').subscribe({
      next: (res) => {
        if (res && res.data) {
          this.guildState = res.data;
        }
      },
      error: () => {}
    });
  }

  startGuildExpedition(expId: string): void {
    this.http.post<any>('/api/v1/runs/guild-expeditions/start', { expeditionId: expId }).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.fetchGuildState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo iniciar la expedición de gremio.';
        this.toast.warn(msg);
      }
    });
  }

  claimGuildExpedition(): void {
    this.http.post<any>('/api/v1/runs/guild-expeditions/claim', {}).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.userGold += res.claimedGold;
        this.userXp += res.claimedXp;
        this.fetchGuildState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo reclamar el tributo.';
        this.toast.warn(msg);
      }
    });
  }

  getGuildProgressPct(): number {
    if (!this.guildState?.activeExpedition) return 0;
    if (this.guildState.activeExpedition.isCompleted) return 100;
    const rem = this.guildState.activeExpedition.remainingSeconds || 0;
    const template = this.guildState.expeditions?.find((e: any) => e.id === this.guildState.activeExpedition.id);
    const totalSecs = (template?.durationMinutes || 720) * 60;
    const elapsed = Math.max(0, totalSecs - rem);
    return Math.min(100, Math.round((elapsed / totalSecs) * 100));
  }

  // =========================================================================
  // 3. COLOSOS MUNDIALES (CHAOS CASTLE)
  // =========================================================================
  fetchRaidState(): void {
    this.http.get<any>('/api/v1/runs/raid/rooms').subscribe({
      next: (res) => {
        if (res && res.data) {
          this.raidState = res.data;
          this.selectedRoomId = res.data.joinedRoomId || res.data.eligibleRoomId || this.selectedRoomId;
        }
      },
      error: () => {}
    });
  }

  selectRaidRoom(roomId: string): void {
    this.selectedRoomId = roomId;
  }

  get currentRoomData(): any {
    if (!this.raidState?.rooms) return null;
    return this.raidState.rooms.find((r: any) => r.id === this.selectedRoomId) || this.raidState.rooms[0];
  }

  joinRaidRoom(roomId: string): void {
    this.http.post<any>('/api/v1/runs/raid/join', { roomId }).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.fetchRaidState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo unir a la sala.';
        this.toast.warn(msg);
      }
    });
  }

  attackRaidBoss(roomId: string): void {
    this.http.post<any>('/api/v1/runs/raid/attack', { roomId }).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.fetchRaidState();
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al asaltar al Coloso.';
        this.toast.warn(msg);
      }
    });
  }

  claimRaidReward(roomId: string): void {
    this.http.post<any>('/api/v1/runs/raid/claim', { roomId }).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.userGold += res.rewardGold;
        this.userXp += res.rewardXp;
        this.fetchRaidState();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo reclamar la recompensa de ranking.';
        this.toast.warn(msg);
      }
    });
  }

  // =========================================================================
  // TEMPORIZADORES EN TIEMPO REAL
  // =========================================================================
  private tickTimers(): void {
    // Senda
    if (this.sendaState?.activeRun && this.sendaState.activeRun.remainingSeconds > 0) {
      this.sendaState.activeRun.remainingSeconds--;
      if (this.sendaState.activeRun.remainingSeconds === 0) {
        this.sendaState.activeRun.isCompleted = true;
        this.sendaState.activeRun.canClaim = true;
        this.toast.success('¡Tu héroe ha concluido la expedición en la Senda! Reclama tu botín.');
      }
    }

    // Gremio
    if (this.guildState?.activeExpedition && this.guildState.activeExpedition.remainingSeconds > 0) {
      this.guildState.activeExpedition.remainingSeconds--;
      if (this.guildState.activeExpedition.remainingSeconds === 0) {
        this.guildState.activeExpedition.isCompleted = true;
        this.guildState.activeExpedition.canClaim = true;
        this.toast.success('¡La expedición de gremio ha regresado victoriosa! Reclama tu recompensa.');
      }
    }
  }

  formatTime(totalSeconds: number): string {
    if (totalSeconds <= 0) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      if (days > 0) {
        return `${days}d ${remHours}h ${minutes}m`;
      }
      return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}
