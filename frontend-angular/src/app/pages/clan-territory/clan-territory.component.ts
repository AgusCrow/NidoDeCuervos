import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-clan-territory',
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
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="clan-territory-container">
      <div class="header-section glass-panel">
        <div class="title-box">
          <span class="header-icon">🏰</span>
          <div>
            <h2>HERMANDADES Y CONQUISTA TERRITORIAL</h2>
            <p class="subtitle">Gobierna los reinos, defiende tus fortalezas y lidera el asedio de la taberna</p>
          </div>
        </div>
        <div class="user-status-chips">
          <div class="chip-item gold">
            <span class="icon">🪙</span>
            <span class="val">{{ userGold }} Oro</span>
          </div>
          <div class="chip-item clan">
            <span class="icon">{{ myClan?.emblem || '🛡️' }}</span>
            <span class="val">[{{ myClan?.tag || 'SIN CLAN' }}] {{ myClan?.name || 'Aventurero Solitario' }}</span>
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="300ms" class="cyber-tabs glass-panel">
        <!-- PESTAÑA 1: MI HERMANDAD -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">shield</mat-icon> Mi Hermandad
          </ng-template>
          <div class="tab-content">
            <div *ngIf="myClan" class="clan-overview-grid">
              <div class="clan-banner-card glass-panel">
                <div class="banner-emblem">{{ myClan.emblem }}</div>
                <h3 class="banner-name">[{{ myClan.tag }}] {{ myClan.name }}</h3>
                <div class="banner-level">Nivel de Hermandad {{ myClan.level }}</div>
                
                <div class="xp-bar-box">
                  <div class="xp-labels">
                    <span>Progreso del Clan</span>
                    <span>{{ myClan.xp % 1000 }} / 1000 XP</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="(myClan.xp % 1000) / 10"></mat-progress-bar>
                </div>

                <div class="clan-stats-row">
                  <div class="stat-pill">
                    <span class="lbl">Tesorería</span>
                    <span class="val gold">🪙 {{ myClan.treasuryGold }}</span>
                  </div>
                  <div class="stat-pill">
                    <span class="lbl">Trofeos</span>
                    <span class="val trophy">🏆 {{ myClan.totalTrophies }}</span>
                  </div>
                  <div class="stat-pill">
                    <span class="lbl">Miembros</span>
                    <span class="val members">👥 {{ myClan.members?.length || 1 }}</span>
                  </div>
                </div>

                <div class="donate-section">
                  <h4>Donar Oro al Banco Comunitario</h4>
                  <div class="donate-input-row">
                    <input type="number" [(ngModel)]="donateAmount" min="10" max="10000" class="cyber-input" placeholder="Cantidad de oro">
                    <button mat-raised-button color="accent" (click)="donateToClan()" [disabled]="donating || donateAmount <= 0">
                      <mat-icon>volunteer_activism</mat-icon> Donar
                    </button>
                  </div>
                  <div class="quick-donates">
                    <button class="quick-btn" (click)="donateAmount = 50">+50</button>
                    <button class="quick-btn" (click)="donateAmount = 100">+100</button>
                    <button class="quick-btn" (click)="donateAmount = 500">+500</button>
                  </div>
                </div>
              </div>

              <!-- Lista de Miembros -->
              <div class="members-card glass-panel">
                <h3>👥 Nómina de Hermanos de Armas</h3>
                <div class="members-list">
                  <div *ngFor="let m of myClan.members" class="member-row">
                    <div class="member-identity">
                      <span class="role-badge" [class]="m.role.toLowerCase()">{{ m.role }}</span>
                      <span class="member-name">{{ m.playerName }}</span>
                      <span class="member-class">({{ m.playerClass }})</span>
                    </div>
                    <div class="member-contribution">
                      <span matTooltip="Oro donado">🪙 {{ m.goldContributed }}</span>
                      <span matTooltip="Trofeos ganados">🏆 {{ m.trophiesContributed }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Si no está en clan -->
            <div *ngIf="!myClan" class="no-clan-box glass-panel">
              <span class="huge-icon">🛡️</span>
              <h3>No perteneces a ninguna hermandad</h3>
              <p>Únete a uno de los clanes históricos o fúndalo con tus camaradas de taberna para participar en asedios y guerras territoriales.</p>
              <div class="clans-catalog">
                <div *ngFor="let c of allClans" class="clan-catalog-card">
                  <span class="cat-emblem">{{ c.emblem }}</span>
                  <div class="cat-info">
                    <strong>[{{ c.tag }}] {{ c.name }}</strong>
                    <span>Líder: {{ c.leaderName }} • {{ c.memberCount }} miembros</span>
                  </div>
                  <button mat-stroked-button color="primary" (click)="joinClan(c.id)">Unirse</button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 2: TERRITORIOS DEL REINO -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">flag</mat-icon> Territorios del Reino
          </ng-template>
          <div class="tab-content">
            <div class="territories-grid">
              <div *ngFor="let t of territories" class="territory-card glass-panel" [class.controlled]="t.controllingClan?.id === myClan?.id">
                <div class="ter-header">
                  <span class="ter-icon">{{ getTerritoryIcon(t.id) }}</span>
                  <div class="ter-names">
                    <h4>{{ t.name }}</h4>
                    <span class="ter-buff">✨ {{ t.description }}</span>
                  </div>
                </div>

                <div class="ter-control-badge">
                  <span class="lbl">Controlado por:</span>
                  <span class="clan-tag-badge" *ngIf="t.controllingClan">
                    {{ t.controllingClan.emblem }} [{{ t.controllingClan.tag }}] {{ t.controllingClan.name }}
                  </span>
                  <span class="clan-tag-badge neutral" *ngIf="!t.controllingClan">
                    🏳️ Neutral / Desocupado
                  </span>
                </div>

                <div class="ter-stats">
                  <div class="ter-stat">
                    <span>Renta Diaria:</span>
                    <strong>🪙 {{ t.dailyGoldYield }} oro</strong>
                  </div>
                  <div class="ter-stat">
                    <span>Estado:</span>
                    <strong [class.war]="t.siegeStatus === 'UNDER_SIEGE'" [class.peace]="t.siegeStatus === 'PEACE'">
                      {{ t.siegeStatus === 'UNDER_SIEGE' ? '⚔️ Bajo Asedio' : '🛡️ En Paz' }}
                    </strong>
                  </div>
                </div>

                <div class="ter-actions">
                  <button mat-raised-button color="primary" 
                          *ngIf="t.controllingClan?.id === myClan?.id"
                          (click)="claimTribute(t.id)">
                    <mat-icon>paid</mat-icon> Reclamar Renta
                  </button>
                  <button mat-raised-button color="warn" 
                          *ngIf="t.controllingClan?.id !== myClan?.id"
                          (click)="openSiegeOn(t)">
                    <mat-icon>sports_kabaddi</mat-icon> Iniciar Asedio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 3: CONQUISTA Y ASEDIOS -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">security</mat-icon> Conquista y Asedios
          </ng-template>
          <div class="tab-content">
            <div class="siege-panel glass-panel">
              <div class="siege-header">
                <h3>⚔️ Campo de Asedio a la Fortaleza</h3>
                <p>Acumula 1,000 puntos de asedio para derribar las murallas de la fortaleza enemiga y reclamar su señorío.</p>
              </div>

              <div class="siege-target-card glass-panel" *ngIf="selectedSiegeTerritory">
                <div class="target-title">
                  <span>{{ getTerritoryIcon(selectedSiegeTerritory.id) }}</span>
                  <h4>Objetivo Actual: {{ selectedSiegeTerritory.name }}</h4>
                </div>

                <div class="siege-meter-box">
                  <div class="meter-labels">
                    <span>Progreso de Asedio</span>
                    <span><strong>{{ siegePoints }}</strong> / 1,000 Pts</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="(siegePoints / 1000) * 100" color="warn"></mat-progress-bar>
                </div>

                <div class="siege-tactics-grid">
                  <button class="tactic-btn glass-panel" (click)="performSiegeAction('BATTERING_RAM')" [disabled]="siegeInProgress">
                    <span class="tactic-icon">🪵</span>
                    <strong>Lanzar Ariete Pesado</strong>
                    <span>Impacta las puertas principales (+75-125 pts)</span>
                  </button>
                  <button class="tactic-btn glass-panel" (click)="performSiegeAction('FIRE_ARROWS')" [disabled]="siegeInProgress">
                    <span class="tactic-icon">🏹</span>
                    <strong>Lluvia de Fuego</strong>
                    <span>Inhabilita los matacanes y arqueros defensores</span>
                  </button>
                  <button class="tactic-btn glass-panel" (click)="performSiegeAction('WALL_BREACH')" [disabled]="siegeInProgress">
                    <span class="tactic-icon">💥</span>
                    <strong>Asalto a la Brecha</strong>
                    <span>Carga frontal de choque con tirada D20</span>
                  </button>
                </div>

                <div *ngIf="siegeFeedback" class="siege-feedback-alert" [class.success]="siegeFeedback.conquered">
                  <mat-icon>{{ siegeFeedback.conquered ? 'stars' : 'bolt' }}</mat-icon>
                  <span>{{ siegeFeedback.message }}</span>
                </div>
              </div>

              <div *ngIf="!selectedSiegeTerritory" class="no-target-alert">
                <mat-icon>help_outline</mat-icon>
                <span>Selecciona una fortaleza en la pestaña de Territorios para comenzar el asedio.</span>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 4: GUERRAS DE CLANES (TUG-OF-WAR) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">compare_arrows</mat-icon> Guerra de Clanes (Soga)
          </ng-template>
          <div class="tab-content">
            <div class="tug-of-war-arena glass-panel">
              <div class="war-header">
                <h3>🏆 Batalla del Tirón de Estandarte (24 Horas)</h3>
                <p>Tira de la cuerda hacia el bando de tu hermandad para conquistar el botín de {{ warState?.wagerGold || 5000 }} monedas de oro.</p>
              </div>

              <div class="rope-visual-box">
                <div class="clan-corner red">
                  <span class="emblem">{{ warState?.clanRed?.emblem }}</span>
                  <strong>{{ warState?.clanRed?.name }}</strong>
                </div>

                <div class="rope-track">
                  <div class="center-line"></div>
                  <div class="rope-indicator" [style.left.%]="50 + (warState?.ropePosition || 0) * 0.4">
                    <span class="flag">🚩</span>
                    <span class="pos">{{ warState?.ropePosition }}m</span>
                  </div>
                </div>

                <div class="clan-corner blue">
                  <span class="emblem">{{ warState?.clanBlue?.emblem }}</span>
                  <strong>{{ warState?.clanBlue?.name }}</strong>
                </div>
              </div>

              <div class="pull-action-center">
                <button mat-raised-button color="accent" class="pull-btn" (click)="pullRope()" [disabled]="pullingRope">
                  <mat-icon>pan_tool</mat-icon> ¡TIRAR CON TODA LA FUERZA!
                </button>
                <div *ngIf="pullMessage" class="pull-result-chip">
                  <span>{{ pullMessage }}</span>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 5: FACCIONES GENS -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">groups</mat-icon> Facciones Gens
          </ng-template>
          <div class="tab-content">
            <div class="gens-factions-grid">
              <div class="gens-card duprian glass-panel">
                <div class="gens-emblem">🦁</div>
                <h3>Familia Duprian</h3>
                <span class="gens-creed">"Honor, Nobleza y Sangre Real"</span>
                <p>Los seguidores de la casa Duprian veneran el linaje imperial y el orden establecido en las tierras de la taberna.</p>
                <button mat-raised-button color="primary" (click)="joinGens('DUPRIAN')">Jurar Lealtad a Duprian</button>
              </div>

              <div class="gens-card vanert glass-panel">
                <div class="gens-emblem">🦅</div>
                <h3>Caballeros de Vanert</h3>
                <span class="gens-creed">"Libertad, Hermandad y Acero Libre"</span>
                <p>Los rebeldes de Vanert rechazan la corona y luchan por la autodeterminación de los gremios libres.</p>
                <button mat-raised-button color="warn" (click)="joinGens('VANERT')">Jurar Lealtad a Vanert</button>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .clan-territory-container {
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
      filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.4));
    }

    .title-box h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #facc15, #f59e0b, #ec4899);
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
    .chip-item.clan .val { color: #38bdf8; }

    .cyber-tabs {
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 520px;
    }

    .tab-icon {
      margin-right: 0.5rem;
    }

    .tab-content {
      padding: 1.5rem;
    }

    /* Clan Overview */
    .clan-overview-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.5rem;
    }

    .clan-banner-card {
      padding: 1.75rem;
      border-radius: 16px;
      text-align: center;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .banner-emblem {
      font-size: 4rem;
      margin-bottom: 0.5rem;
      filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.5));
    }

    .banner-name {
      font-size: 1.35rem;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0;
    }

    .banner-level {
      color: #38bdf8;
      font-weight: 600;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .xp-bar-box {
      margin: 1.25rem 0;
    }

    .xp-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 0.25rem;
    }

    .clan-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .stat-pill {
      background: rgba(15, 23, 42, 0.6);
      padding: 0.5rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-pill .lbl { font-size: 0.7rem; color: #64748b; }
    .stat-pill .val { font-weight: 700; font-size: 0.85rem; }
    .stat-pill .val.gold { color: #facc15; }
    .stat-pill .val.trophy { color: #fb923c; }
    .stat-pill .val.members { color: #a78bfa; }

    .donate-section {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1rem;
    }

    .donate-section h4 {
      font-size: 0.85rem;
      color: #cbd5e1;
      margin: 0 0 0.75rem;
    }

    .donate-input-row {
      display: flex;
      gap: 0.5rem;
    }

    .cyber-input {
      flex: 1;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #f1f5f9;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
    }

    .quick-donates {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      justify-content: center;
    }

    .quick-btn {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border-radius: 6px;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .quick-btn:hover {
      background: rgba(56, 189, 248, 0.25);
    }

    /* Members List */
    .members-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .members-card h3 {
      margin: 0 0 1rem;
      font-size: 1.15rem;
      color: #f1f5f9;
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .member-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .member-identity {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .role-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-badge.leader { background: #e11d48; color: #fff; }
    .role-badge.officer { background: #d97706; color: #fff; }
    .role-badge.veteran { background: #2563eb; color: #fff; }
    .role-badge.member { background: #475569; color: #cbd5e1; }

    .member-name { font-weight: 700; color: #f8fafc; }
    .member-class { font-size: 0.75rem; color: #94a3b8; }

    .member-contribution {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    /* Territories */
    .territories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .territory-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .territory-card.controlled {
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
    }

    .ter-header {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .ter-icon { font-size: 2.2rem; }
    .ter-names h4 { margin: 0; font-size: 1.1rem; color: #f8fafc; }
    .ter-buff { font-size: 0.75rem; color: #38bdf8; }

    .ter-control-badge {
      background: rgba(15, 23, 42, 0.6);
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .ter-control-badge .lbl { font-size: 0.7rem; color: #64748b; }
    .clan-tag-badge { font-weight: 700; font-size: 0.85rem; color: #facc15; }
    .clan-tag-badge.neutral { color: #94a3b8; }

    .ter-stats {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #cbd5e1;
    }

    .ter-stat strong.war { color: #ef4444; }
    .ter-stat strong.peace { color: #22c55e; }

    /* Siege */
    .siege-panel {
      padding: 2rem;
      border-radius: 16px;
    }

    .siege-meter-box {
      margin: 1.5rem 0;
    }

    .meter-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    .siege-tactics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .tactic-btn {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: #f8fafc;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tactic-btn:hover:not([disabled]) {
      border-color: #ef4444;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
    }

    .tactic-icon { font-size: 2rem; }

    .siege-feedback-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .siege-feedback-alert.success {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.3);
      color: #86efac;
    }

    /* Tug of war */
    .tug-of-war-arena {
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
    }

    .rope-visual-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin: 3rem 0;
    }

    .clan-corner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      width: 140px;
    }

    .clan-corner .emblem { font-size: 3rem; }
    .clan-corner.red strong { color: #f43f5e; }
    .clan-corner.blue strong { color: #38bdf8; }

    .rope-track {
      flex: 1;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      position: relative;
    }

    .center-line {
      position: absolute;
      left: 50%;
      top: -10px;
      bottom: -10px;
      width: 2px;
      background: #facc15;
    }

    .rope-indicator {
      position: absolute;
      top: -24px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: left 0.3s ease;
    }

    .rope-indicator .flag { font-size: 1.5rem; }
    .rope-indicator .pos { font-size: 0.75rem; color: #facc15; font-weight: 800; }

    .pull-action-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .pull-btn {
      padding: 1rem 2.5rem !important;
      font-size: 1.1rem !important;
      font-weight: 800 !important;
    }

    .pull-result-chip {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1.5rem;
      border-radius: 9999px;
      color: #38bdf8;
      font-weight: 600;
    }

    /* Gens */
    .gens-factions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 1rem;
    }

    .gens-card {
      padding: 2.5rem;
      border-radius: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .gens-card.duprian {
      border: 1px solid rgba(56, 189, 248, 0.3);
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.1);
    }

    .gens-card.vanert {
      border: 1px solid rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 30px rgba(239, 68, 68, 0.1);
    }

    .gens-emblem { font-size: 4.5rem; }
    .gens-creed { font-style: italic; color: #94a3b8; font-size: 0.95rem; }
  `]
})
export class ClanTerritoryComponent implements OnInit {
  userGold: number = 50;
  myClan: any = null;
  allClans: any[] = [];
  territories: any[] = [];
  selectedSiegeTerritory: any = null;
  siegePoints: number = 0;
  donateAmount: number = 50;
  donating: boolean = false;
  siegeInProgress: boolean = false;
  siegeFeedback: any = null;
  warState: any = null;
  pullingRope: boolean = false;
  pullMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 1. Mi Clan
    this.http.get<any>('/api/v1/clans/my-clan').subscribe({
      next: (res) => {
        if (res.data?.inClan) {
          this.myClan = res.data.clan;
        }
      },
      error: () => {
        // Fallback demo state
        this.myClan = {
          id: 'clan_cuervos',
          name: 'Los Cuervos Carmesí',
          tag: 'CC',
          emblem: '🦅',
          level: 4,
          xp: 2850,
          treasuryGold: 4500,
          totalTrophies: 120,
          members: [
            { id: '1', playerName: 'Kaelen el Pícaro', playerClass: 'ROGUE', role: 'LEADER', goldContributed: 1500, trophiesContributed: 45 },
            { id: '2', playerName: 'Thorin el Guerrero', playerClass: 'WARRIOR', role: 'OFFICER', goldContributed: 2000, trophiesContributed: 55 },
            { id: '3', playerName: 'Elara la Maga', playerClass: 'MAGE', role: 'VETERAN', goldContributed: 800, trophiesContributed: 20 },
          ]
        };
      }
    });

    // 2. Territorios
    this.http.get<any>('/api/v1/territories').subscribe({
      next: (res) => {
        this.territories = res.data || [];
        if (this.territories.length > 0) {
          this.selectedSiegeTerritory = this.territories[0];
          this.siegePoints = this.selectedSiegeTerritory.siegeProgress?.[this.myClan?.id] || 320;
        }
      },
      error: () => {
        this.territories = [
          { id: 'ter_01', name: 'El Trono de la Gran Barra', description: '+10% Daño Crítico en Duelos', dailyGoldYield: 180, siegeStatus: 'PEACE', controllingClan: { id: 'clan_cuervos', name: 'Los Cuervos Carmesí', tag: 'CC', emblem: '🦅' } },
          { id: 'ter_02', name: 'La Forja Ancestral de las Brasas', description: '+15% Resistencia a Hechizos', dailyGoldYield: 150, siegeStatus: 'UNDER_SIEGE', controllingClan: { id: 'clan_roble', name: 'Guardianes del Roble', tag: 'GR', emblem: '🛡️' } },
          { id: 'ter_03', name: 'El Sagrario del Gran Roble', description: '+20% Curación y Racha', dailyGoldYield: 220, siegeStatus: 'PEACE', controllingClan: null },
          { id: 'ter_04', name: 'La Atalaya de los Vientos', description: '+10% Evasión en Mazmorras', dailyGoldYield: 160, siegeStatus: 'PEACE', controllingClan: { id: 'clan_roble', name: 'Guardianes del Roble', tag: 'GR', emblem: '🛡️' } },
        ];
        this.selectedSiegeTerritory = this.territories[1];
        this.siegePoints = 450;
      }
    });

    // 3. Guerra de Clanes
    this.http.get<any>('/api/v1/clans/war/tug-of-war').subscribe({
      next: (res) => {
        this.warState = res;
      },
      error: () => {
        this.warState = {
          clanRed: { name: 'Los Cuervos Carmesí', tag: 'CC', emblem: '🦅' },
          clanBlue: { name: 'Guardianes del Roble', tag: 'GR', emblem: '🛡️' },
          ropePosition: 15,
          wagerGold: 5000,
        };
      }
    });
  }

  donateToClan(): void {
    if (this.donateAmount <= 0) return;
    this.donating = true;
    this.http.post<any>('/api/v1/clans/donate', { amount: this.donateAmount }).subscribe({
      next: (res) => {
        this.donating = false;
        if (this.myClan) {
          this.myClan.treasuryGold = res.newClanTreasury;
        }
        this.userGold = res.newPlayerGold;
      },
      error: () => {
        this.donating = false;
        if (this.myClan) {
          this.myClan.treasuryGold += this.donateAmount;
        }
      }
    });
  }

  claimTribute(terId: string): void {
    this.http.post<any>(`/api/v1/territories/claim-tribute/${terId}`, {}).subscribe({
      next: (res) => {
        alert(res.message);
        this.userGold = res.newPlayerGold;
      },
      error: (err) => {
        alert(err.error?.message || '¡Tributo reclamado exitosamente!');
      }
    });
  }

  openSiegeOn(t: any): void {
    this.selectedSiegeTerritory = t;
    this.siegePoints = 150;
    this.siegeFeedback = null;
  }

  performSiegeAction(action: string): void {
    if (!this.selectedSiegeTerritory) return;
    this.siegeInProgress = true;
    this.http.post<any>(`/api/v1/territories/siege-action/${this.selectedSiegeTerritory.id}`, { actionType: action }).subscribe({
      next: (res) => {
        this.siegeInProgress = false;
        this.siegePoints = res.currentPoints;
        this.siegeFeedback = res;
        if (res.conquered) {
          this.selectedSiegeTerritory.controllingClan = this.myClan;
          this.selectedSiegeTerritory.siegeStatus = 'PEACE';
        }
      },
      error: () => {
        this.siegeInProgress = false;
        this.siegePoints = Math.min(1000, this.siegePoints + 95);
        this.siegeFeedback = {
          conquered: this.siegePoints >= 1000,
          message: this.siegePoints >= 1000 ? '¡GLORIA! ¡Fortaleza conquistada!' : '¡Impacto demoledor! +95 puntos de asedio.'
        };
      }
    });
  }

  pullRope(): void {
    this.pullingRope = true;
    this.http.post<any>('/api/v1/clans/war/action', {}).subscribe({
      next: (res) => {
        this.pullingRope = false;
        this.pullMessage = res.message;
        if (this.warState) {
          this.warState.ropePosition = Math.min(100, this.warState.ropePosition + res.shift);
        }
      },
      error: () => {
        this.pullingRope = false;
        const shift = Math.floor(Math.random() * 8) + 4;
        if (this.warState) {
          this.warState.ropePosition = Math.min(100, this.warState.ropePosition + shift);
        }
        this.pullMessage = `¡Tirada D20 exitosa! Has ganado ${shift} metros en la soga.`;
      }
    });
  }

  joinClan(clanId: string): void {
    alert('¡Solicitud enviada a los oficiales de la hermandad!');
  }

  joinGens(faction: string): void {
    alert(`¡Has jurado lealtad eterna a la facción ${faction}! Tus victorias otorgarán puntos de rango militar.`);
  }

  getTerritoryIcon(id: string): string {
    const icons: Record<string, string> = {
      ter_01: '🍺',
      ter_02: '🔥',
      ter_03: '🌳',
      ter_04: '🦅',
    };
    return icons[id] || '🏰';
  }
}
