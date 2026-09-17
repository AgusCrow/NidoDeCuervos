import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import { TransmuteForgeComponent } from '../transmute-forge/transmute-forge.component';
import { DmBalancePanelComponent } from '../dm-dashboard/dm-balance-panel/dm-balance-panel.component';
import { RunsDungeonsComponent } from '../runs-dungeons/runs-dungeons.component';
import { ClanTerritoryComponent } from '../clan-territory/clan-territory.component';
import { TalentsTreeComponent } from '../talents-tree/talents-tree.component';
import { TavernMarketComponent } from '../tavern-market/tavern-market.component';

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    LeaderboardComponent,
    TransmuteForgeComponent,
    DmBalancePanelComponent,
    RunsDungeonsComponent,
    ClanTerritoryComponent,
    TalentsTreeComponent,
    TavernMarketComponent,
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Barra Superior de Navegación (Cyber-Glass Navbar) -->
      <nav class="main-navbar glass-panel">
        <div class="brand-zone">
          <span class="brand-icon">🦅</span>
          <div class="brand-text">
            <span class="brand-title">NIDO DE CUERVOS</span>
            <span class="brand-sub">v4.0.0 ANGULAR & NESTJS</span>
          </div>
        </div>

        <!-- Pestañas Principales en el Navbar -->
        <div class="nav-links">
          <button class="nav-btn" [class.active]="activeTab === 'hero'" (click)="activeTab = 'hero'">
            <mat-icon>shield</mat-icon> Héroe
          </button>
          <button class="nav-btn" [class.active]="activeTab === 'runs'" (click)="activeTab = 'runs'">
            <mat-icon>explore</mat-icon> Runs & Mazmorras
          </button>
          <button class="nav-btn" [class.active]="activeTab === 'clans'" (click)="activeTab = 'clans'">
            <mat-icon>castle</mat-icon> Clanes & Territorios
          </button>
          <button class="nav-btn" [class.active]="activeTab === 'transmute'" (click)="activeTab = 'transmute'">
            <mat-icon>auto_fix_high</mat-icon> Forja & Fusión 9:1
          </button>
          <button class="nav-btn" [class.active]="activeTab === 'talents'" (click)="activeTab = 'talents'">
            <mat-icon>bolt</mat-icon> Talentos
          </button>
          <button class="nav-btn" [class.active]="activeTab === 'market'" (click)="activeTab = 'market'">
            <mat-icon>storefront</mat-icon> Crónicas & Mercado
          </button>
          <button class="nav-btn" [class.active]="activeTab === 'leaderboard'" (click)="activeTab = 'leaderboard'">
            <mat-icon>emoji_events</mat-icon> Rankings
          </button>
          <button *ngIf="player.role === 'DM' || player.role === 'ADMIN'" class="nav-btn dm-link" [class.active]="activeTab === 'dm-balance'" (click)="activeTab = 'dm-balance'">
            <mat-icon>tune</mat-icon> Balance DM
          </button>
        </div>

        <!-- Indicadores de Recursos y Desplegable de Perfil -->
        <div class="user-zone">
          <div class="resource-badge gold-badge" matTooltip="Oro acumulado">
            <span>🪙</span> {{ player.gold }}
          </div>
          <div class="resource-badge streak-badge" matTooltip="Racha diaria">
            <span>🔥</span> {{ player.streak }}d
          </div>

          <!-- Avatar con Menú Desplegable -->
          <div class="avatar-button" [matMenuTriggerFor]="profileMenu">
            <img [src]="player.avatar" alt="Avatar" class="avatar-img">
            <span class="level-badge">{{ player.level }}</span>
          </div>

          <mat-menu #profileMenu="matMenu" class="custom-profile-menu">
            <div class="menu-profile-header">
              <div class="menu-name">{{ player.name }}</div>
              <div class="menu-class">{{ player.class }} • Nivel {{ player.level }}</div>
            </div>
            <button mat-menu-item (click)="openProfileSettings()">
              <mat-icon>account_circle</mat-icon> Mi Perfil y Credenciales
            </button>
            <button mat-menu-item (click)="toggleAudio()">
              <mat-icon>{{ audioEnabled ? 'volume_up' : 'volume_off' }}</mat-icon> Audio SFX ({{ audioEnabled ? 'ON' : 'OFF' }})
            </button>
            <button mat-menu-item (click)="toggleTheme()">
              <mat-icon>palette</mat-icon> Tema Visual (Dark/Glass)
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item class="logout-item" (click)="logout()">
              <mat-icon color="warn">logout</mat-icon> Cerrar Sesión
            </button>
          </mat-menu>
        </div>
      </nav>

      <!-- Contenedor de Vista Dinámica -->
      <main class="main-viewport">
        <!-- VISTA 1: GRIMORIO DEL HÉROE -->
        <div *ngIf="activeTab === 'hero'" class="hero-view">
          <div class="hero-grid">
            <div class="hero-card glass-panel">
              <div class="hero-profile-box">
                <img [src]="player.avatar" class="big-avatar" alt="Hero">
                <h2>{{ player.name }}</h2>
                <span class="class-tag">{{ player.class }} de la Taberna</span>
              </div>
              <div class="stats-list">
                <div class="s-row"><span>Fuerza (STR):</span> <strong>{{ player.stats.str }}</strong></div>
                <div class="s-row"><span>Destreza (DEX):</span> <strong>{{ player.stats.dex }}</strong></div>
                <div class="s-row"><span>Inteligencia (INT):</span> <strong>{{ player.stats.int }}</strong></div>
                <div class="s-row"><span>Constitución (CON):</span> <strong>{{ player.stats.con }}</strong></div>
              </div>
            </div>

            <div class="quick-actions glass-panel">
              <h3>Bendición de la Taberna</h3>
              <p>Reclama tu medalla diaria con racha continua o lánzate a conquistar las mazmorras y fortalezas.</p>
              <button mat-flat-button class="daily-btn" (click)="claimDaily()">
                <mat-icon>workspace_premium</mat-icon> Reclamar Medalla Diaria (+150 XP, +50 Oro)
              </button>

              <div class="hero-shortcuts">
                <button mat-stroked-button color="accent" (click)="activeTab = 'runs'">
                  <mat-icon>directions_run</mat-icon> Iniciar Run en Senda Infinita
                </button>
                <button mat-stroked-button color="primary" (click)="activeTab = 'clans'">
                  <mat-icon>castle</mat-icon> Revisar Territorios y Asedios
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- VISTA 2: RUNS Y MAZMORRAS (SENDA INFINITA, CATACUMBAS, EXPEDICIONES, COLOSOS) -->
        <app-runs-dungeons *ngIf="activeTab === 'runs'"></app-runs-dungeons>

        <!-- VISTA 3: CLANES Y CONQUISTAS DE TERRITORIO -->
        <app-clan-territory *ngIf="activeTab === 'clans'"></app-clan-territory>

        <!-- VISTA 4: RANKINGS GLOBALES (PODIO + LISTA) -->
        <app-leaderboard *ngIf="activeTab === 'leaderboard'"></app-leaderboard>

        <!-- VISTA 5: CRISOL DE FORJA & FUSIÓN 9:1 -->
        <app-transmute-forge *ngIf="activeTab === 'transmute'"></app-transmute-forge>

        <!-- VISTA 6: ÁRBOL DE TALENTOS & ESPECIALIZACIÓN (DESACOPLADO) -->
        <app-talents-tree *ngIf="activeTab === 'talents'"></app-talents-tree>

        <!-- VISTA 7: CRÓNICAS & MERCADO P2P -->
        <app-tavern-market *ngIf="activeTab === 'market'"></app-tavern-market>

        <!-- VISTA 8: PANEL ESPECÍFICO DE BALANCE DM / ADMIN -->
        <app-dm-balance-panel *ngIf="activeTab === 'dm-balance' && (player.role === 'DM' || player.role === 'ADMIN')"></app-dm-balance-panel>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-navbar {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 1000;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-top: none;
    }
    .brand-zone {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      .brand-icon { font-size: 1.6rem; }
      .brand-title { font-family: var(--font-epic); font-weight: 800; font-size: 1.1rem; color: #fff; display: block; }
      .brand-sub { font-size: 0.7rem; color: var(--accent-gold); letter-spacing: 0.1em; }
    }
    .nav-links {
      display: flex;
      gap: 0.5rem;
      .nav-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        &:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
        &.active {
          color: #fff;
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid var(--accent-cyan);
        }
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }
      .dm-link.active {
        background: rgba(245, 158, 11, 0.15);
        border-color: var(--accent-gold);
      }
    }
    .user-zone {
      display: flex;
      align-items: center;
      gap: 1rem;
      .resource-badge {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-family: var(--font-code);
        font-weight: 600;
        background: rgba(0, 0, 0, 0.4);
      }
      .gold-badge { color: var(--accent-gold); border: 1px solid rgba(245, 158, 11, 0.3); }
      .streak-badge { color: #f97316; border: 1px solid rgba(249, 115, 22, 0.3); }
      .avatar-button {
        position: relative;
        cursor: pointer;
        .avatar-img { width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--accent-cyan); }
        .level-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: var(--accent-gold);
          color: #000;
          font-weight: 800;
          font-size: 0.65rem;
          padding: 0.1rem 0.3rem;
          border-radius: 8px;
        }
      }
    }
    .main-viewport {
      flex: 1;
      padding: 1rem;
    }
    .hero-view {
      max-width: 900px;
      margin: 2rem auto;
      .hero-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      .hero-card {
        padding: 2rem;
        text-align: center;
        border-radius: 12px;
        .big-avatar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid var(--accent-cyan); margin-bottom: 1rem; }
        h2 { font-size: 1.5rem; color: #fff; margin-bottom: 0.2rem; }
        .class-tag { color: var(--accent-gold); font-size: 0.9rem; }
        .stats-list {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          .s-row {
            display: flex;
            justify-content: space-between;
            padding: 0.4rem 0.8rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            font-size: 0.9rem;
            strong { color: var(--accent-cyan); }
          }
        }
      }
      .quick-actions {
        padding: 2rem;
        border-radius: 12px;
        h3 { font-size: 1.3rem; color: #fff; margin-bottom: 0.5rem; }
        p { color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem; }
        .daily-btn {
          background: linear-gradient(135deg, var(--accent-gold) 0%, #d97706 100%);
          color: #fff;
          font-weight: 700;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
        }
        .hero-shortcuts {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
          button {
            padding: 0.6rem 1.2rem;
            font-weight: 600;
          }
        }
      }
    }
  `]
})
export class PlayerDashboardComponent implements OnInit {
  activeTab = 'hero';
  audioEnabled = true;

  player: {
    name: string;
    role: string;
    class: string;
    level: number;
    gold: number;
    streak: number;
    avatar: string;
    stats: { str: number; dex: number; int: number; con: number; };
  } = {
    name: 'Kaelen el Justiciero',
    role: 'DM',
    class: 'Guerrero',
    level: 24,
    gold: 520,
    streak: 5,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=kaelen',
    stats: { str: 18, dex: 12, int: 10, con: 16 }
  };

  ngOnInit(): void {}

  openProfileSettings() {
    alert('Ajustes de Perfil: Podrás actualizar tus credenciales y títulos.');
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
  }

  toggleTheme() {
    alert('Cambiando tema visual entre Cyberpunk y Glassmorphism.');
  }

  claimDaily() {
    this.player.gold += 65;
    this.player.streak += 1;
    alert('✨ ¡Medalla diaria reclamada! Has recibido 65 monedas de oro y +150 XP.');
  }

  logout() {
    alert('Sesión cerrada. ¡Que los vientos te sean favorables!');
  }
}
