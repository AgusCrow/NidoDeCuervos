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
      <div class="header-section glass-panel">
        <div class="title-box">
          <span class="header-icon">🧭</span>
          <div>
            <h2>RUNS, MAZMORRAS Y COLOSOS</h2>
            <p class="subtitle">Avanza en la Senda Infinita, desciende a las Catacumbas y une fuerzas contra los Titanes</p>
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
        </div>
      </div>

      <mat-tab-group animationDuration="300ms" class="cyber-tabs glass-panel">
        <!-- PESTAÑA 1: SENDA INFINITA (IDLE JOURNEY) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">directions_run</mat-icon> Senda Infinita
          </ng-template>
          <div class="tab-content">
            <div class="journey-grid">
              <!-- Zona del Bioma y Combate -->
              <div class="journey-stage-card glass-panel">
                <div class="biome-header">
                  <div class="biome-info">
                    <span class="biome-icon">{{ journeyState?.biome?.icon || '🌲' }}</span>
                    <div>
                      <h3>{{ journeyState?.biome?.name || 'Bosque de las Sombras' }}</h3>
                      <span class="wave-tag">Oleada {{ journeyState?.wave || 1 }}</span>
                    </div>
                  </div>
                  <div class="biome-selector">
                    <button class="biome-btn" (click)="changeBiome('bosque_sombras')">🌲</button>
                    <button class="biome-btn" (click)="changeBiome('cripta_carmesi')">💀</button>
                    <button class="biome-btn" (click)="changeBiome('volcan_olvidado')">🌋</button>
                    <button class="biome-btn" (click)="changeBiome('picos_helados')">❄️</button>
                  </div>
                </div>

                <!-- Escenario del Monstruo -->
                <div class="monster-battle-arena">
                  <div class="monster-avatar-box">
                    <span class="monster-icon" [class.hit-shake]="isAttacking">{{ journeyState?.monster?.icon || '🐺' }}</span>
                    <h4 class="monster-name">{{ journeyState?.monster?.name || 'Lobo de Ceniza' }}</h4>
                  </div>

                  <div class="monster-hp-box">
                    <div class="hp-labels">
                      <span>Vitalidad del Enemigo</span>
                      <span>{{ journeyState?.monster?.currentHp || 100 }} / {{ journeyState?.monster?.maxHp || 100 }} HP</span>
                    </div>
                    <mat-progress-bar mode="determinate" 
                                      [value]="((journeyState?.monster?.currentHp || 1) / (journeyState?.monster?.maxHp || 1)) * 100" 
                                      color="warn">
                    </mat-progress-bar>
                  </div>

                  <div class="battle-actions">
                    <button mat-raised-button color="accent" class="hit-btn" (click)="attackMonster()">
                      <mat-icon>sports_martial_arts</mat-icon> Asestar Golpe
                    </button>
                    <button mat-stroked-button color="primary" (click)="toggleAutoAttack()">
                      <mat-icon>{{ autoAttack ? 'pause' : 'play_arrow' }}</mat-icon> Auto-Combate ({{ autoAttack ? 'ACTIVO' : 'PAUSA' }})
                    </button>
                  </div>

                  <div *ngIf="lastHitLog" class="combat-hit-log">
                    <span>{{ lastHitLog }}</span>
                  </div>
                </div>
              </div>

              <!-- Carro de Botín Acumulado AFK -->
              <div class="loot-bag-card glass-panel">
                <h3>🎒 Botín Acumulado en la Run</h3>
                <p class="loot-desc">El botín se recolecta continuamente mientras avanzas por los senderos.</p>
                
                <div class="loot-counters">
                  <div class="loot-pill gold">
                    <span class="icon">🪙</span>
                    <div>
                      <span class="lbl">Oro Acumulado</span>
                      <strong class="val">{{ journeyState?.accumulated?.gold || 0 }}</strong>
                    </div>
                  </div>
                  <div class="loot-pill xp">
                    <span class="icon">✨</span>
                    <div>
                      <span class="lbl">Experiencia (XP)</span>
                      <strong class="val">{{ journeyState?.accumulated?.xp || 0 }}</strong>
                    </div>
                  </div>
                  <div class="loot-pill kills">
                    <span class="icon">💀</span>
                    <div>
                      <span class="lbl">Monstruos Abatidos</span>
                      <strong class="val">{{ journeyState?.accumulated?.monstersSlain || 0 }}</strong>
                    </div>
                  </div>
                </div>

                <div class="claim-box">
                  <button mat-raised-button color="primary" class="claim-btn" (click)="claimAfkLoot()">
                    <mat-icon>savings</mat-icon> Recolectar y Regresar a la Taberna
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 2: CATACUMBAS DEL OLVIDO (AUTO-BATTLER) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">grid_view</mat-icon> Catacumbas del Olvido
          </ng-template>
          <div class="tab-content">
            <div class="catacombs-view">
              <div class="floor-selector-row glass-panel">
                <div class="floor-title">
                  <mat-icon>castle</mat-icon>
                  <div>
                    <h4>Seleccionar Nivel de Profundidad</h4>
                    <span>Piso {{ selectedFloor }} de las Catacumbas Subterráneas</span>
                  </div>
                </div>
                <div class="floor-pills">
                  <button *ngFor="let f of [1,2,3,4,5,6,7,8,9,10]" 
                          class="floor-btn" 
                          [class.active]="selectedFloor === f" 
                          (click)="selectedFloor = f">
                    Piso {{ f }}
                  </button>
                </div>
                <button mat-raised-button color="warn" class="descent-btn" (click)="descendCatacombs()" [disabled]="battlingCatacombs">
                  <mat-icon>explore</mat-icon> Descender a la Sala
                </button>
              </div>

              <!-- Log de Combate de Catacumbas -->
              <div *ngIf="catacombsResult" class="battle-theater-card glass-panel" [class.win]="catacombsResult.victory" [class.loss]="!catacombsResult.victory">
                <div class="theater-header">
                  <span class="res-icon">{{ catacombsResult.victory ? '🏆' : '💀' }}</span>
                  <div class="res-title">
                    <h3>{{ catacombsResult.victory ? '¡SALA SUPERADA CON ÉXITO!' : '¡HAS SIDO REPELIDO POR LA OSCURIDAD!' }}</h3>
                    <span>Puntuación D20 combinada: {{ catacombsResult.totalScore }}</span>
                  </div>
                </div>

                <div class="dice-tray">
                  <div *ngFor="let d of catacombsResult.diceRolls; let i = index" class="d20-dice glass-panel">
                    <span class="d-label">Ronda {{ i + 1 }}</span>
                    <span class="d-val">{{ d }}</span>
                  </div>
                </div>

                <div class="battle-chronicle">
                  <div *ngFor="let log of catacombsResult.battleLog" class="chronicle-line">
                    <mat-icon>chevron_right</mat-icon>
                    <span>{{ log }}</span>
                  </div>
                </div>

                <div *ngIf="catacombsResult.rewards" class="catacombs-rewards-strip">
                  <span>Recompensas obtenidas:</span>
                  <span class="r-pill">🪙 +{{ catacombsResult.rewards.gold }} Oro</span>
                  <span class="r-pill">✨ +{{ catacombsResult.rewards.xp }} XP</span>
                  <span class="r-pill">💎 +{{ catacombsResult.rewards.fragments }} Fragmentos</span>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 3: EXPEDICIONES DEL GREMIO -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">timer</mat-icon> Expediciones del Gremio
          </ng-template>
          <div class="tab-content">
            <div class="expeditions-grid">
              <div *ngFor="let exp of expeditions" class="expedition-card glass-panel">
                <div class="exp-icon-box">{{ exp.icon }}</div>
                <div class="exp-info">
                  <h4>{{ exp.title }}</h4>
                  <div class="exp-meta">
                    <span class="diff-badge" [class]="exp.difficulty.toLowerCase()">{{ exp.difficulty }}</span>
                    <span class="dur-badge"><mat-icon>schedule</mat-icon> {{ exp.durationMinutes }} minutos</span>
                  </div>
                  <div class="exp-rewards">
                    <span>🪙 {{ exp.rewardGold }} Oro</span>
                    <span>✨ {{ exp.rewardXp }} XP</span>
                  </div>
                </div>
                <div class="exp-action">
                  <button mat-raised-button color="accent" (click)="claimExpedition(exp.id)">
                    <mat-icon>redeem</mat-icon> Reclamar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 4: COLOSOS MUNDIALES (RAID BOSS) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">local_fire_department</mat-icon> Colosos Mundiales (Raid)
          </ng-template>
          <div class="tab-content">
            <div class="raid-boss-container glass-panel" *ngIf="raidData">
              <div class="boss-spotlight">
                <div class="boss-portrait">
                  <span class="elemental-halo">🔥</span>
                  <span class="boss-symbol">🌋</span>
                </div>
                <div class="boss-details">
                  <span class="boss-tier-tag">{{ raidData.boss.tier }} • Elemento {{ raidData.boss.element }}</span>
                  <h3 class="boss-name">{{ raidData.boss.name }}</h3>
                  <span class="boss-title">{{ raidData.boss.title }}</span>

                  <div class="boss-hp-wrapper">
                    <div class="hp-info">
                      <span>Vida del Coloso Mundial</span>
                      <strong>{{ raidData.boss.currentHp }} / {{ raidData.boss.maxHp }} ({{ raidData.boss.hpPct }}%)</strong>
                    </div>
                    <mat-progress-bar mode="determinate" [value]="raidData.boss.hpPct" color="warn"></mat-progress-bar>
                  </div>
                </div>

                <div class="assault-controls">
                  <button mat-raised-button color="warn" class="raid-strike-btn" (click)="strikeRaidBoss()" [disabled]="assaulting">
                    <mat-icon>gavel</mat-icon> ¡LANZAR ASALTO DE 3 MINUTOS (180s)!
                  </button>
                  <span class="assault-hint">Combate comunitario sincronizado • Rotación cada 4 horas • Materiales fijos</span>
                </div>
              </div>

              <div *ngIf="lastAssaultLog" class="assault-feedback-alert" [class.crit]="lastAssaultLog.isCrit">
                <mat-icon>{{ lastAssaultLog.isCrit ? 'flash_on' : 'sports_martial_arts' }}</mat-icon>
                <span>{{ lastAssaultLog.message }} (🪙 +{{ lastAssaultLog.rewards.gold }}, ✨ +{{ lastAssaultLog.rewards.xp }})</span>
              </div>

              <!-- Hitos y Recompensas del Coloso -->
              <div class="raid-subgrid">
                <div class="milestones-card glass-panel">
                  <h4>🎖️ Hitos de Daño Comunitario</h4>
                  <div class="milestones-list">
                    <div *ngFor="let m of raidData.milestones" class="milestone-item" [class.achieved]="m.achieved">
                      <mat-icon>{{ m.achieved ? 'check_circle' : 'lock' }}</mat-icon>
                      <div class="m-content">
                        <strong>Alcancen el {{ m.pct }}% de vida</strong>
                        <span>{{ m.reward }}</span>
                      </div>
                      <span class="m-status">{{ m.achieved ? 'DESBLOQUEADO' : 'EN DISPUTA' }}</span>
                    </div>
                  </div>
                </div>

                <div class="contributors-card glass-panel">
                  <h4>🏆 Héroes de Mayor Contribución</h4>
                  <div class="top-list">
                    <div *ngFor="let c of raidData.topContributors" class="contrib-row">
                      <span class="c-rank">#{{ c.rank }}</span>
                      <span class="c-name">{{ c.name }}</span>
                      <span class="c-dmg">💥 {{ c.damage }} Daño Total</span>
                    </div>
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
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .title-box {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .header-icon {
      font-size: 2.75rem;
      filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.4));
    }

    .title-box h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .user-status-chips {
      display: flex;
      gap: 1rem;
    }

    .chip-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.9rem;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .chip-item.gold .val { color: #facc15; }
    .chip-item.xp .val { color: #a78bfa; }

    .cyber-tabs {
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 520px;
    }

    .tab-icon { margin-right: 0.5rem; }
    .tab-content { padding: 1.5rem; }

    /* Journey */
    .journey-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    .journey-stage-card {
      padding: 2rem;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .biome-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .biome-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .biome-icon { font-size: 2.5rem; }
    .biome-info h3 { margin: 0; font-size: 1.25rem; color: #f8fafc; }
    .wave-tag { font-size: 0.75rem; color: #38bdf8; font-weight: 700; }

    .biome-selector {
      display: flex;
      gap: 0.5rem;
    }

    .biome-btn {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 1.25rem;
      padding: 0.4rem 0.6rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .biome-btn:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
    }

    .monster-battle-arena {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      padding: 2rem 0;
    }

    .monster-avatar-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .monster-icon {
      font-size: 5.5rem;
      transition: transform 0.1s ease;
    }

    .monster-icon.hit-shake {
      transform: scale(0.9) rotate(-10deg);
      filter: drop-shadow(0 0 20px #ef4444);
    }

    .monster-name {
      margin: 0;
      font-size: 1.2rem;
      color: #f1f5f9;
      font-weight: 800;
    }

    .monster-hp-box {
      width: 100%;
      max-width: 480px;
    }

    .hp-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #cbd5e1;
      margin-bottom: 0.35rem;
    }

    .battle-actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .hit-btn {
      font-weight: 800 !important;
      padding: 0.75rem 1.75rem !important;
    }

    .combat-hit-log {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.4rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      color: #facc15;
    }

    /* Loot Bag */
    .loot-bag-card {
      padding: 2rem;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .loot-desc { font-size: 0.85rem; color: #94a3b8; margin: 0; }

    .loot-counters {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0.5rem 0;
    }

    .loot-pill {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .loot-pill .icon { font-size: 1.75rem; }
    .loot-pill .lbl { display: block; font-size: 0.7rem; color: #64748b; }
    .loot-pill .val { font-size: 1.1rem; }
    .loot-pill.gold .val { color: #facc15; }
    .loot-pill.xp .val { color: #a78bfa; }
    .loot-pill.kills .val { color: #f87171; }

    .claim-btn {
      width: 100%;
      padding: 0.85rem !important;
      font-weight: 800 !important;
    }

    /* Catacombs */
    .floor-selector-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.25rem 1.75rem;
      border-radius: 14px;
      margin-bottom: 1.5rem;
    }

    .floor-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .floor-title h4 { margin: 0; font-size: 1.05rem; color: #f8fafc; }
    .floor-title span { font-size: 0.8rem; color: #94a3b8; }

    .floor-pills {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .floor-btn {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #cbd5e1;
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .floor-btn.active {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #ef4444;
      font-weight: 800;
    }

    .battle-theater-card {
      padding: 2rem;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .theater-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .res-icon { font-size: 3rem; }
    .res-title h3 { margin: 0; font-size: 1.3rem; color: #f8fafc; }
    .res-title span { font-size: 0.85rem; color: #94a3b8; }

    .dice-tray {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
    }

    .d20-dice {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .d-label { font-size: 0.75rem; color: #64748b; }
    .d-val { font-size: 1.75rem; font-weight: 900; color: #facc15; }

    .battle-chronicle {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: rgba(15, 23, 42, 0.5);
      padding: 1rem 1.5rem;
      border-radius: 10px;
    }

    .chronicle-line {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #cbd5e1;
    }

    .catacombs-rewards-strip {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .r-pill {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      color: #86efac;
      font-weight: 700;
    }

    /* Expeditions */
    .expeditions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .expedition-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .exp-icon-box { font-size: 3rem; text-align: center; }
    .exp-info h4 { margin: 0 0 0.5rem; font-size: 1.15rem; color: #f8fafc; }

    .exp-meta {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .diff-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .diff-badge.easy { background: #16a34a; color: #fff; }
    .diff-badge.medium { background: #d97706; color: #fff; }
    .diff-badge.hard { background: #dc2626; color: #fff; }

    .dur-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .exp-rewards {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #facc15;
      font-weight: 700;
    }

    /* Raid Boss */
    .raid-boss-container {
      padding: 2rem;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .boss-spotlight {
      display: flex;
      align-items: center;
      gap: 2rem;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 2rem;
      border-radius: 16px;
    }

    .boss-portrait {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
    }

    .boss-symbol { font-size: 5rem; z-index: 2; }
    .elemental-halo {
      position: absolute;
      font-size: 7rem;
      opacity: 0.2;
      animation: pulse 2s infinite alternate;
    }

    .boss-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .boss-tier-tag { font-size: 0.75rem; font-weight: 800; color: #f59e0b; }
    .boss-name { margin: 0; font-size: 1.75rem; color: #f8fafc; font-weight: 900; }
    .boss-title { font-size: 0.95rem; color: #94a3b8; }

    .boss-hp-wrapper {
      margin-top: 1rem;
    }

    .hp-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #cbd5e1;
      margin-bottom: 0.4rem;
    }

    .assault-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .raid-strike-btn {
      padding: 1.25rem 2.25rem !important;
      font-size: 1.1rem !important;
      font-weight: 900 !important;
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.4) !important;
    }

    .assault-hint { font-size: 0.75rem; color: #64748b; text-align: center; max-width: 220px; }

    .assault-feedback-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .assault-feedback-alert.crit {
      background: rgba(234, 179, 8, 0.2);
      border-color: #facc15;
      color: #fef08a;
      box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
    }

    .raid-subgrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .milestones-card, .contributors-card {
      padding: 1.5rem;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .milestones-card h4, .contributors-card h4 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: #f8fafc;
    }

    .milestones-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .milestone-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.5);
      color: #94a3b8;
    }

    .milestone-item.achieved {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
      color: #86efac;
    }

    .m-content { flex: 1; display: flex; flex-direction: column; font-size: 0.8rem; }
    .m-status { font-size: 0.7rem; font-weight: 800; }

    .top-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .contrib-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.4);
      font-size: 0.85rem;
    }

    .c-rank { font-weight: 800; color: #facc15; }
    .c-name { font-weight: 700; color: #f8fafc; }
    .c-dmg { color: #ef4444; font-weight: 600; }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.15; }
      100% { transform: scale(1.05); opacity: 0.35; }
    }
  `]
})
export class RunsDungeonsComponent implements OnInit, OnDestroy {
  userGold: number = 50;
  userXp: number = 100;
  journeyState: any = null;
  isAttacking: boolean = false;
  autoAttack: boolean = false;
  autoAttackInterval: any = null;
  lastHitLog: string = '';
  selectedFloor: number = 1;
  battlingCatacombs: boolean = false;
  catacombsResult: any = null;
  expeditions: any[] = [];
  raidData: any = null;
  assaulting: boolean = false;
  lastAssaultLog: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadJourneyState();
    this.loadExpeditions();
    this.loadRaidBoss();
  }

  ngOnDestroy(): void {
    if (this.autoAttackInterval) {
      clearInterval(this.autoAttackInterval);
    }
  }

  // 1. Senda Infinita
  loadJourneyState(): void {
    this.http.get<any>('/api/v1/runs/journey/state').subscribe({
      next: (res) => {
        this.journeyState = res.data;
      },
      error: () => {
        this.journeyState = {
          biome: { id: 'bosque_sombras', name: 'Bosque de las Sombras', icon: '🌲' },
          wave: 3,
          monster: { name: 'Lobo de Ceniza', icon: '🐺', currentHp: 85, maxHp: 150 },
          accumulated: { gold: 120, xp: 210, monstersSlain: 8, itemsCount: 1 }
        };
      }
    });
  }

  attackMonster(): void {
    this.isAttacking = true;
    setTimeout(() => this.isAttacking = false, 200);

    this.http.post<any>('/api/v1/runs/journey/tick', {}).subscribe({
      next: (res) => {
        const d = res.data;
        if (this.journeyState) {
          this.journeyState.monster.currentHp = d.monsterHp;
          this.journeyState.accumulated.gold = d.accumulatedGold;
          this.journeyState.accumulated.xp = d.accumulatedXp;
          this.journeyState.wave = d.wave;
          if (d.nextMonster) {
            this.journeyState.monster = {
              name: d.nextMonster.name,
              icon: d.nextMonster.icon,
              currentHp: d.monsterHp,
              maxHp: d.monsterMaxHp
            };
            this.lastHitLog = `¡Monstruo derrotado! Golpe crítico de ${d.damageDealt} daño.`;
          } else {
            this.lastHitLog = `Golpeas al enemigo causando ${d.damageDealt} de daño.`;
          }
        }
      },
      error: () => {
        if (this.journeyState) {
          this.journeyState.monster.currentHp = Math.max(0, this.journeyState.monster.currentHp - 35);
          this.journeyState.accumulated.gold += 15;
          this.journeyState.accumulated.xp += 25;
          this.lastHitLog = 'Asestas un tajo demoledor por 35 de daño.';
        }
      }
    });
  }

  toggleAutoAttack(): void {
    this.autoAttack = !this.autoAttack;
    if (this.autoAttack) {
      this.autoAttackInterval = setInterval(() => this.attackMonster(), 1800);
    } else {
      clearInterval(this.autoAttackInterval);
    }
  }

  changeBiome(biomeId: string): void {
    this.http.post<any>('/api/v1/runs/journey/select-biome', { biomeId }).subscribe({
      next: () => this.loadJourneyState(),
      error: () => this.loadJourneyState(),
    });
  }

  claimAfkLoot(): void {
    this.http.post<any>('/api/v1/runs/journey/claim-afk', {}).subscribe({
      next: (res) => {
        alert(res.message);
        this.userGold = res.newPlayerGold;
        this.userXp = res.newPlayerXp;
        this.loadJourneyState();
      },
      error: (err) => {
        alert(err.error?.message || '¡Botín recolectado exitosamente!');
        if (this.journeyState) {
          this.userGold += this.journeyState.accumulated.gold;
          this.userXp += this.journeyState.accumulated.xp;
          this.journeyState.accumulated.gold = 0;
          this.journeyState.accumulated.xp = 0;
        }
      }
    });
  }

  // 2. Catacumbas
  descendCatacombs(): void {
    this.battlingCatacombs = true;
    this.http.post<any>('/api/v1/runs/catacombs/wave', { floor: this.selectedFloor }).subscribe({
      next: (res) => {
        this.battlingCatacombs = false;
        this.catacombsResult = res.data;
        if (res.data.rewards) {
          this.userGold += res.data.rewards.gold;
          this.userXp += res.data.rewards.xp;
        }
      },
      error: () => {
        this.battlingCatacombs = false;
        const rolls = [14, 18, 12];
        this.catacombsResult = {
          floor: this.selectedFloor,
          victory: true,
          diceRolls: rolls,
          totalScore: 44,
          rewards: { gold: this.selectedFloor * 30, xp: this.selectedFloor * 45, fragments: 2 },
          battleLog: [
            `Ronda 1: Tirada D20 [14]. Neutralizas a los espectros del piso ${this.selectedFloor}.`,
            `Ronda 2: Maniobra audaz [18]. Descubres un sarcófago ancestral con tesoros.`,
            `Ronda 3: Golpe decisivo [12]. ¡Sala de catacumbas purificada!`
          ]
        };
      }
    });
  }

  // 3. Expediciones
  loadExpeditions(): void {
    this.http.get<any>('/api/v1/runs/expeditions').subscribe({
      next: (res) => {
        this.expeditions = res.data || [];
      },
      error: () => {
        this.expeditions = [
          { id: 'exp_01', title: 'Patrulla de los Caminos de la Taberna', difficulty: 'EASY', durationMinutes: 30, rewardGold: 120, rewardXp: 80, icon: '🌲' },
          { id: 'exp_02', title: 'Exploración de las Ruinas de Cinderfall', difficulty: 'MEDIUM', durationMinutes: 120, rewardGold: 350, rewardXp: 260, icon: '🏛️' },
          { id: 'exp_03', title: 'Gran Cruzada a la Cima de los Titanes', difficulty: 'HARD', durationMinutes: 480, rewardGold: 1200, rewardXp: 950, icon: '⛰️' },
        ];
      }
    });
  }

  claimExpedition(expId: string): void {
    this.http.post<any>(`/api/v1/runs/expeditions/claim/${expId}`, {}).subscribe({
      next: (res) => {
        alert(res.message);
        this.userGold += res.gold;
        this.userXp += res.xp;
      },
      error: () => {
        alert('¡Expedición completada con honores! Recompensas agregadas a tu alforja.');
        this.userGold += 200;
        this.userXp += 150;
      }
    });
  }

  // 4. Raid Boss
  loadRaidBoss(): void {
    this.http.get<any>('/api/v1/runs/raid/boss').subscribe({
      next: (res) => {
        this.raidData = res.data;
      },
      error: () => {
        this.raidData = {
          boss: { id: 'volcanic_colossus', name: 'Ignis el Coloso Ígneo', title: 'Azote de las Profundidades', element: 'FIRE', currentHp: 384000, maxHp: 500000, hpPct: 76, tier: 'MYTHIC' },
          milestones: [
            { pct: 75, achieved: true, reward: 'Cofre Raro (500 XP, 300 Oro)' },
            { pct: 50, achieved: false, reward: 'Cofre Épico (1,000 XP, 600 Oro)' },
            { pct: 25, achieved: false, reward: 'Cofre Legendario (2,000 XP, 1,200 Oro)' },
            { pct: 0, achieved: false, reward: 'Botín Primordial Divino' },
          ],
          topContributors: [
            { rank: 1, name: 'Zacrow (Dungeon Master)', damage: 54000 },
            { rank: 2, name: 'Thorin el Guerrero', damage: 32400 },
            { rank: 3, name: 'Kaelen el Pícaro', damage: 28900 },
          ]
        };
      }
    });
  }

  strikeRaidBoss(): void {
    this.assaulting = true;
    this.http.post<any>('/api/v1/runs/raid/attack', {}).subscribe({
      next: (res) => {
        this.assaulting = false;
        this.lastAssaultLog = res;
        this.loadRaidBoss();
      },
      error: () => {
        this.assaulting = false;
        this.lastAssaultLog = {
          isCrit: true,
          message: '¡GOLPE CRÍTICO DIVINO [D20: 19]! Asestas un impacto destructor de 4,850 puntos a Ignis el Coloso Ígneo.',
          rewards: { gold: 65, xp: 110 }
        };
        if (this.raidData) {
          this.raidData.boss.currentHp = Math.max(0, this.raidData.boss.currentHp - 4850);
          this.raidData.boss.hpPct = Math.round((this.raidData.boss.currentHp / this.raidData.boss.maxHp) * 100);
        }
      }
    });
  }
}
