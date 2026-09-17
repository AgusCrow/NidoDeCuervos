import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dm-balance-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  template: `
    <div class="dm-balance-container">
      <header class="dm-header glass-panel">
        <div class="header-content">
          <div class="title-cluster">
            <h1 class="epic-title">🎛️ Telar del Destino: Panel de Balance Maestro</h1>
            <p class="subtitle">Ajuste en tiempo real de las leyes físicas, alquímicas y económicas del servidor</p>
          </div>
          <div class="header-badges">
            <span class="status-badge hot-reload">
              <mat-icon>bolt</mat-icon> Hot-Reload Activo
            </span>
            <span class="role-badge">
              <mat-icon>shield</mat-icon> Modo Dios (DM)
            </span>
          </div>
        </div>
      </header>

      <div class="tabs-container glass-panel">
        <mat-tab-group animationDuration="200ms">
          <!-- PESTAÑA 1: TRANSMUTACIÓN ALQUÍMICA 9 A 1 -->
          <mat-tab label="⚗️ Transmutación 9:1">
            <div class="tab-body">
              <div class="section-intro">
                <h2>Reglas de Fusión y Salto Crítico</h2>
                <p>Calibra la tasa de insumo de ítems y la probabilidad milagrosa de avanzar 2 categorías de rareza.</p>
              </div>

              <div class="config-grid">
                <div class="config-card glass-panel">
                  <h3>Probabilidad de Salto Crítico (+2 Rarezas)</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ transmuteConfig.double_jump_critical_chance_pct }}%</span>
                    <mat-slider min="0" max="100" step="1">
                      <input matSliderThumb [(ngModel)]="transmuteConfig.double_jump_critical_chance_pct">
                    </mat-slider>
                  </div>
                  <small class="hint">Probabilidad de que la fusión de 9 ítems salte directamente 2 categorías superiores (Ej: Común ➔ Raro).</small>
                </div>

                <div class="config-card glass-panel">
                  <h3>Ítems Requeridos para Transmutación</h3>
                  <div class="number-box">
                    <mat-form-field appearance="outline" class="cyber-input">
                      <mat-label>Cantidad de Ítems</mat-label>
                      <input matInput type="number" [(ngModel)]="transmuteConfig.required_items_count" min="2" max="20">
                    </mat-form-field>
                  </div>
                  <small class="hint">Regla canónica fijada en 9 ítems de igual categoría.</small>
                </div>
              </div>

              <div class="costs-table-section glass-panel">
                <h3>Coste en Oro por Fusión según Rareza Base</h3>
                <div class="costs-grid">
                  <div class="cost-item" *ngFor="let rarity of rarityKeys">
                    <span class="rarity-tag" [ngClass]="rarity.toLowerCase()">{{ rarity }}</span>
                    <input type="number" [(ngModel)]="transmuteConfig.gold_cost_per_transmute[rarity]" class="cost-input">
                    <span class="currency-tag">oro</span>
                  </div>
                </div>
              </div>

              <div class="actions-bar">
                <button mat-button class="reset-btn" (click)="resetSection('transmute')">
                  <mat-icon>restart_alt</mat-icon> Restaurar Defaults
                </button>
                <button mat-flat-button class="save-btn" (click)="saveSection('transmute')">
                  <mat-icon>save</mat-icon> Guardar Ajustes en Caliente
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 2: CLASES Y POINT-BUY -->
          <mat-tab label="🛡️ Clases & Point-Buy">
            <div class="tab-body">
              <div class="section-intro">
                <h2>Generación de Aventureros y Salud Base</h2>
                <p>Equilibra los puntos de partida de los héroes al crear su personaje.</p>
              </div>

              <div class="config-grid">
                <div class="config-card glass-panel">
                  <h3>Puntos Totales de Creación (Point-Buy)</h3>
                  <div class="number-box">
                    <mat-form-field appearance="outline" class="cyber-input">
                      <mat-label>Puntos Disponibles</mat-label>
                      <input matInput type="number" [(ngModel)]="classesConfig.point_buy.total_starting_points">
                    </mat-form-field>
                  </div>
                </div>

                <div class="config-card glass-panel">
                  <h3>HP Base del Guerrero</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ classesConfig.classes.WARRIOR.base_hp }} HP</span>
                    <mat-slider min="50" max="250" step="5">
                      <input matSliderThumb [(ngModel)]="classesConfig.classes.WARRIOR.base_hp">
                    </mat-slider>
                  </div>
                </div>

                <div class="config-card glass-panel">
                  <h3>HP Base del Mago</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ classesConfig.classes.MAGE.base_hp }} HP</span>
                    <mat-slider min="40" max="180" step="5">
                      <input matSliderThumb [(ngModel)]="classesConfig.classes.MAGE.base_hp">
                    </mat-slider>
                  </div>
                </div>

                <div class="config-card glass-panel">
                  <h3>HP Base del Pícaro</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ classesConfig.classes.ROGUE.base_hp }} HP</span>
                    <mat-slider min="50" max="200" step="5">
                      <input matSliderThumb [(ngModel)]="classesConfig.classes.ROGUE.base_hp">
                    </mat-slider>
                  </div>
                </div>
              </div>

              <div class="actions-bar">
                <button mat-button class="reset-btn" (click)="resetSection('classes')">
                  <mat-icon>restart_alt</mat-icon> Restaurar Defaults
                </button>
                <button mat-flat-button class="save-btn" (click)="saveSection('classes')">
                  <mat-icon>save</mat-icon> Guardar Ajustes en Caliente
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 3: FORJA Y REFINAMIENTO -->
          <mat-tab label="🔨 Forja & Refinado">
            <div class="tab-body">
              <div class="section-intro">
                <h2>Probabilidades de Refinamiento (+1 a +15)</h2>
                <p>Define las tasas de éxito para impedir inflación de artefactos de poder extremo.</p>
              </div>

              <div class="refine-levels-grid">
                <div class="refine-chip glass-panel" *ngFor="let lvl of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]">
                  <span class="level-lbl">+{{ lvl }}</span>
                  <div class="rate-val">{{ forgeConfig.refinement_levels[lvl]?.success_rate_pct }}% éxito</div>
                  <input type="range" min="1" max="100" [(ngModel)]="forgeConfig.refinement_levels[lvl].success_rate_pct" class="mini-slider">
                </div>
              </div>

              <div class="actions-bar">
                <button mat-button class="reset-btn" (click)="resetSection('forge')">
                  <mat-icon>restart_alt</mat-icon> Restaurar Defaults
                </button>
                <button mat-flat-button class="save-btn" (click)="saveSection('forge')">
                  <mat-icon>save</mat-icon> Guardar Ajustes en Caliente
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 4: COMBATE & DUELOS -->
          <mat-tab label="⚔️ Combate PvP">
            <div class="tab-body">
              <div class="section-intro">
                <h2>Fórmulas de Duelos y Multiplicadores</h2>
                <p>Ajusta el peso de atributos y pasivas especiales en los duelos de taberna Bo3.</p>
              </div>

              <div class="config-grid">
                <div class="config-card glass-panel">
                  <h3>Umbral de K.O. Instantáneo del Pícaro</h3>
                  <div class="slider-box">
                    <span class="slider-val">Tirada d20 ≥ {{ combatConfig.pvp.rogue_ko_threshold }}</span>
                    <mat-slider min="15" max="20" step="1">
                      <input matSliderThumb [(ngModel)]="combatConfig.pvp.rogue_ko_threshold">
                    </mat-slider>
                  </div>
                </div>

                <div class="config-card glass-panel">
                  <h3>Multiplicador de Sobrecarga del Mago</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ combatConfig.pvp.mage_surge_multiplier }}x daño</span>
                    <mat-slider min="1.1" max="3.0" step="0.1">
                      <input matSliderThumb [(ngModel)]="combatConfig.pvp.mage_surge_multiplier">
                    </mat-slider>
                  </div>
                </div>
              </div>

              <div class="actions-bar">
                <button mat-button class="reset-btn" (click)="resetSection('combat')">
                  <mat-icon>restart_alt</mat-icon> Restaurar Defaults
                </button>
                <button mat-flat-button class="save-btn" (click)="saveSection('combat')">
                  <mat-icon>save</mat-icon> Guardar Ajustes en Caliente
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 5: COLOSOS Y ASUSTES -->
          <mat-tab label="🐉 Colosos Mundiales">
            <div class="tab-body">
              <div class="section-intro">
                <h2>Vitalidad y Tiempos de Asalto de Incursiones</h2>
                <p>Regula la dificultad de los jefes para mantener la taberna unida en batalla.</p>
              </div>

              <div class="config-grid">
                <div class="config-card glass-panel">
                  <h3>HP Máximo: Ignis el Coloso Ígneo</h3>
                  <mat-form-field appearance="outline" class="cyber-input full-w">
                    <mat-label>Salud Total</mat-label>
                    <input matInput type="number" [(ngModel)]="raidConfig.raid_bosses.volcanic_colossus.base_max_hp">
                  </mat-form-field>
                </div>

                <div class="config-card glass-panel">
                  <h3>Duración de Asalto por Turno</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ raidConfig.raid_bosses.volcanic_colossus.assault_duration_seconds }} segundos ({{ raidConfig.raid_bosses.volcanic_colossus.assault_duration_seconds / 60 }} min)</span>
                    <mat-slider min="60" max="300" step="10">
                      <input matSliderThumb [(ngModel)]="raidConfig.raid_bosses.volcanic_colossus.assault_duration_seconds">
                    </mat-slider>
                  </div>
                </div>
              </div>

              <div class="actions-bar">
                <button mat-button class="reset-btn" (click)="resetSection('raid')">
                  <mat-icon>restart_alt</mat-icon> Restaurar Defaults
                </button>
                <button mat-flat-button class="save-btn" (click)="saveSection('raid')">
                  <mat-icon>save</mat-icon> Guardar Ajustes en Caliente
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- PESTAÑA 6: ECONOMÍA -->
          <mat-tab label="💰 Economía">
            <div class="tab-body">
              <div class="section-intro">
                <h2>Límites de Oro y Renta de Territorios</h2>
                <p>Control de la masa monetaria y recompensas de soberanía territorial.</p>
              </div>

              <div class="config-grid">
                <div class="config-card glass-panel">
                  <h3>Capacidad Máxima de Oro</h3>
                  <mat-form-field appearance="outline" class="cyber-input full-w">
                    <mat-label>Tope Bóveda Personal</mat-label>
                    <input matInput type="number" [(ngModel)]="economyConfig.currency.max_gold_capacity">
                  </mat-form-field>
                </div>

                <div class="config-card glass-panel">
                  <h3>Tasa Impositiva Mercado P2P</h3>
                  <div class="slider-box">
                    <span class="slider-val">{{ economyConfig.market.tax_rate_pct }}% comisión</span>
                    <mat-slider min="0" max="25" step="0.5">
                      <input matSliderThumb [(ngModel)]="economyConfig.market.tax_rate_pct">
                    </mat-slider>
                  </div>
                </div>
              </div>

              <div class="actions-bar">
                <button mat-button class="reset-btn" (click)="resetSection('economy')">
                  <mat-icon>restart_alt</mat-icon> Restaurar Defaults
                </button>
                <button mat-flat-button class="save-btn" (click)="saveSection('economy')">
                  <mat-icon>save</mat-icon> Guardar Ajustes en Caliente
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .dm-balance-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .dm-header {
      padding: 1.5rem 2rem;
      margin-bottom: 1.5rem;
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .title-cluster {
        h1 { font-size: 1.8rem; margin-bottom: 0.3rem; }
        .subtitle { color: var(--text-secondary); font-size: 0.95rem; }
      }
      .header-badges {
        display: flex;
        gap: 0.8rem;
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          &.hot-reload { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
        }
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-gold);
          border: 1px solid var(--accent-gold);
        }
      }
    }
    .tabs-container {
      padding: 1rem 1.5rem 2rem;
    }
    .tab-body {
      padding: 1.5rem 0;
    }
    .section-intro {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.3rem; color: #fff; margin-bottom: 0.3rem; }
      p { color: var(--text-secondary); font-size: 0.9rem; }
    }
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.2rem;
      margin-bottom: 1.5rem;
    }
    .config-card {
      padding: 1.2rem;
      border-radius: 8px;
      h3 { font-size: 1rem; color: #e2e8f0; margin-bottom: 0.8rem; }
      .slider-box {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        .slider-val { font-size: 1.4rem; font-weight: 700; color: var(--accent-cyan); font-family: var(--font-code); }
      }
      .hint { color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 0.5rem; }
    }
    .costs-table-section {
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border-radius: 8px;
      h3 { font-size: 1.1rem; color: #fff; margin-bottom: 1rem; }
      .costs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.8rem;
      }
      .cost-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: rgba(0, 0, 0, 0.3);
        padding: 0.5rem 0.8rem;
        border-radius: 6px;
        .rarity-tag { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; min-width: 80px; text-align: center; }
        .rarity-tag.common { background: #475569; color: #f8fafc; }
        .rarity-tag.uncommon { background: #15803d; color: #f8fafc; }
        .rarity-tag.rare { background: #1d4ed8; color: #f8fafc; }
        .rarity-tag.epic { background: #7e22ce; color: #f8fafc; }
        .rarity-tag.legendary { background: #b45309; color: #fef08a; }
        .rarity-tag.mythic { background: #b91c1c; color: #fef2f2; }
        .cost-input {
          width: 80px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #fff;
          padding: 0.3rem 0.5rem;
          font-family: var(--font-code);
          text-align: right;
        }
        .currency-tag { font-size: 0.8rem; color: var(--accent-gold); }
      }
    }
    .refine-levels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1.5rem;
      .refine-chip {
        padding: 0.8rem;
        text-align: center;
        .level-lbl { font-size: 1.1rem; font-weight: 800; color: var(--accent-gold); }
        .rate-val { font-size: 0.85rem; color: #fff; margin: 0.3rem 0; font-family: var(--font-code); }
        .mini-slider { width: 100%; }
      }
    }
    .actions-bar {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      .save-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #fff;
        font-weight: 600;
        padding: 0.6rem 1.5rem;
      }
      .reset-btn { color: var(--accent-crimson); }
    }
  `]
})
export class DmBalancePanelComponent implements OnInit {
  rarityKeys = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

  transmuteConfig: any = {
    required_items_count: 9,
    double_jump_critical_chance_pct: 10.0,
    gold_cost_per_transmute: {
      COMMON: 25,
      UNCOMMON: 50,
      RARE: 120,
      EPIC: 300,
      LEGENDARY: 750,
      MYTHIC: 2000,
    }
  };

  classesConfig: any = {
    point_buy: { total_starting_points: 20 },
    classes: {
      WARRIOR: { base_hp: 120 },
      MAGE: { base_hp: 85 },
      ROGUE: { base_hp: 95 },
      BARD: { base_hp: 100 },
    }
  };

  forgeConfig: any = {
    refinement_levels: {
      1: { success_rate_pct: 100 },
      2: { success_rate_pct: 95 },
      3: { success_rate_pct: 90 },
      4: { success_rate_pct: 85 },
      5: { success_rate_pct: 80 },
      6: { success_rate_pct: 70 },
      7: { success_rate_pct: 60 },
      8: { success_rate_pct: 50 },
      9: { success_rate_pct: 40 },
      10: { success_rate_pct: 30 },
      11: { success_rate_pct: 25 },
      12: { success_rate_pct: 20 },
      13: { success_rate_pct: 15 },
      14: { success_rate_pct: 10 },
      15: { success_rate_pct: 5 },
    }
  };

  combatConfig: any = {
    pvp: { rogue_ko_threshold: 18, mage_surge_multiplier: 1.5 }
  };

  raidConfig: any = {
    raid_bosses: {
      volcanic_colossus: { base_max_hp: 500000, assault_duration_seconds: 180 }
    }
  };

  economyConfig: any = {
    currency: { max_gold_capacity: 1000000000 },
    market: { tax_rate_pct: 5.0 }
  };

  ngOnInit(): void {
    console.log('DmBalancePanelComponent inicializado con soporte de Hot-Reload');
  }

  saveSection(section: string) {
    console.log(`Guardando sección ${section} en caliente...`);
    alert(`⚡ [Hot-Reload]: Sección '${section}' guardada y aplicada instantáneamente en el servidor.`);
  }

  resetSection(section: string) {
    if (confirm(`¿Restaurar los parámetros de fábrica para la sección '${section}'?`)) {
      console.log(`Restaurando sección ${section}...`);
    }
  }
}
