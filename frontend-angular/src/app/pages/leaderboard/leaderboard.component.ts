import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule],
  template: `
    <div class="leaderboard-container">
      <header class="lb-header">
        <h1 class="epic-title">🏆 Salón de la Gloria y Crónicas Heroicas</h1>
        <p class="subtitle">Los aventureros y hermandades más laureadas en los anales del gremio</p>
      </header>

      <div class="lb-card glass-panel">
        <mat-tab-group animationDuration="200ms">
          <!-- RANKING INDIVIDUAL -->
          <mat-tab label="⚔️ Aventureros Ilustres">
            <div class="tab-content">
              <!-- Podio Top 3 -->
              <div class="podium-grid">
                <!-- 2do Lugar (Plata) -->
                <div class="podium-pillar second glass-panel">
                  <div class="rank-crown silver"><mat-icon>military_tech</mat-icon> 2º</div>
                  <div class="avatar-box">
                    <img [src]="players[1]?.avatar" alt="2do">
                  </div>
                  <div class="p-name">{{ players[1]?.name }}</div>
                  <div class="p-meta">Nvl {{ players[1]?.level }} • {{ players[1]?.class }}</div>
                  <div class="p-xp">{{ players[1]?.xp }} XP</div>
                </div>

                <!-- 1er Lugar (Oro) -->
                <div class="podium-pillar first glass-panel">
                  <div class="rank-crown gold"><mat-icon>workspace_premium</mat-icon> 1º</div>
                  <div class="avatar-box gold-ring">
                    <img [src]="players[0]?.avatar" alt="1ro">
                  </div>
                  <div class="p-name">{{ players[0]?.name }}</div>
                  <div class="p-meta">Nvl {{ players[0]?.level }} • {{ players[0]?.class }}</div>
                  <div class="p-xp">{{ players[0]?.xp }} XP</div>
                </div>

                <!-- 3er Lugar (Bronce) -->
                <div class="podium-pillar third glass-panel">
                  <div class="rank-crown bronze"><mat-icon>emoji_events</mat-icon> 3º</div>
                  <div class="avatar-box">
                    <img [src]="players[2]?.avatar" alt="3ro">
                  </div>
                  <div class="p-name">{{ players[2]?.name }}</div>
                  <div class="p-meta">Nvl {{ players[2]?.level }} • {{ players[2]?.class }}</div>
                  <div class="p-xp">{{ players[2]?.xp }} XP</div>
                </div>
              </div>

              <!-- Lista Restante -->
              <div class="rankings-table">
                <div class="table-row table-head">
                  <span class="col-rank">#</span>
                  <span class="col-name">Aventurero</span>
                  <span class="col-class">Clase</span>
                  <span class="col-lvl">Nivel</span>
                  <span class="col-xp">Experiencia</span>
                </div>
                <div 
                  *ngFor="let p of players.slice(3); let idx = index" 
                  class="table-row glass-panel"
                  [class.my-pos]="p.isMe">
                  <span class="col-rank">{{ idx + 4 }}</span>
                  <span class="col-name">
                    <img [src]="p.avatar" class="row-avatar" alt="avatar">
                    {{ p.name }}
                    <span *ngIf="p.isMe" class="me-chip">TÚ</span>
                  </span>
                  <span class="col-class">{{ p.class }}</span>
                  <span class="col-lvl">{{ p.level }}</span>
                  <span class="col-xp">{{ p.xp }} XP</span>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- RANKING DE CLANES -->
          <mat-tab label="🛡️ Grandes Hermandades">
            <div class="tab-content">
              <div class="clans-list">
                <div *ngFor="let c of clans; let idx = index" class="clan-row glass-panel">
                  <div class="clan-rank">{{ idx + 1 }}</div>
                  <div class="clan-icon">{{ c.icon }}</div>
                  <div class="clan-details">
                    <div class="clan-title">[{{ c.tag }}] {{ c.name }}</div>
                    <div class="clan-sub">Líder: {{ c.leader }} • Nivel {{ c.level }}</div>
                  </div>
                  <div class="clan-stats">
                    <div class="stat-num">{{ c.trophies }} 🏆</div>
                    <div class="stat-sub">{{ c.treasury }} oro en arcas</div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .lb-header {
      text-align: center;
      margin-bottom: 2rem;
      h1 { font-size: 2rem; margin-bottom: 0.3rem; }
      .subtitle { color: var(--text-secondary); font-size: 0.95rem; }
    }
    .lb-card { padding: 1.5rem; border-radius: 12px; }
    .tab-content { padding: 1.5rem 0; }
    .podium-grid {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .podium-pillar {
      width: 220px;
      padding: 1.5rem 1rem;
      text-align: center;
      border-radius: 12px;
      position: relative;
      &.first {
        height: 280px;
        background: rgba(245, 158, 11, 0.12);
        border: 2px solid var(--accent-gold);
        box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
      }
      &.second { height: 240px; border-color: #94a3b8; }
      &.third { height: 210px; border-color: #b45309; }
      .rank-crown {
        font-size: 1.1rem;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        margin-bottom: 0.8rem;
        &.gold { color: var(--accent-gold); }
        &.silver { color: #cbd5e1; }
        &.bronze { color: #d97706; }
      }
      .avatar-box {
        width: 70px;
        height: 70px;
        margin: 0 auto 0.8rem;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.2);
        &.gold-ring { width: 85px; height: 85px; border-color: var(--accent-gold); }
        img { width: 100%; height: 100%; object-fit: cover; }
      }
      .p-name { font-weight: 700; font-size: 1.1rem; color: #fff; }
      .p-meta { font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0; }
      .p-xp { font-family: var(--font-code); font-size: 0.9rem; color: var(--accent-cyan); }
    }
    .rankings-table {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .table-row {
      display: grid;
      grid-template-columns: 50px 2fr 1.2fr 80px 120px;
      align-items: center;
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      font-size: 0.95rem;
      &.table-head {
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        font-size: 0.75rem;
        padding-bottom: 0.4rem;
      }
      &.my-pos {
        border-color: var(--accent-cyan);
        background: rgba(6, 182, 212, 0.1);
      }
      .col-name {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        color: #fff;
        font-weight: 600;
        .row-avatar { width: 28px; height: 28px; border-radius: 50%; }
        .me-chip { background: var(--accent-cyan); color: #000; font-size: 0.7rem; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; }
      }
      .col-rank { font-weight: 700; color: var(--text-secondary); }
      .col-xp { font-family: var(--font-code); color: var(--accent-gold); text-align: right; }
    }
    .clans-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .clan-row {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      .clan-rank { font-size: 1.4rem; font-weight: 800; color: var(--accent-gold); width: 30px; }
      .clan-icon { font-size: 2rem; }
      .clan-details { flex: 1; .clan-title { font-size: 1.1rem; font-weight: 700; color: #fff; } .clan-sub { font-size: 0.85rem; color: var(--text-secondary); } }
      .clan-stats { text-align: right; .stat-num { font-size: 1.2rem; font-weight: 700; color: #fff; } .stat-sub { font-size: 0.8rem; color: var(--text-muted); } }
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  players = [
    { name: 'Kaelen el Justiciero', level: 24, class: 'Guerrero', xp: '184,200', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=kaelen', isMe: false },
    { name: 'Morgana del Viento', level: 21, class: 'Maga', xp: '142,500', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=morgana', isMe: false },
    { name: 'ShadowDagger', level: 19, class: 'Pícaro', xp: '118,900', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=shadow', isMe: false },
    { name: 'Valerius', level: 17, class: 'Bardo', xp: '95,400', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=valerius', isMe: true },
    { name: 'SirGalahad', level: 16, class: 'Guerrero', xp: '88,100', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=galahad', isMe: false },
    { name: 'ArchmageRoran', level: 15, class: 'Mago', xp: '76,300', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=roran', isMe: false },
  ];

  clans = [
    { name: 'Los Cuervos Negros', tag: 'CRV', leader: 'Kaelen', level: 3, trophies: 1250, treasury: '520', icon: '🦅' },
    { name: 'Furia Invernal', tag: 'LBO', leader: 'Wulfgar', level: 2, trophies: 980, treasury: '340', icon: '🐺' },
  ];

  ngOnInit(): void {}
}
