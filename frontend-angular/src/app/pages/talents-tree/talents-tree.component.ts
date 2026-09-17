import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  branch: 'OFFENSE' | 'DEFENSE' | 'UTILITY';
  tier: number;
  maxPoints: number;
  currentPoints: number;
  isUnlocked: boolean;
  icon: string;
}

@Component({
  selector: 'app-talents-tree',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="talents-container">
      <div class="header-card glass-panel">
        <div class="header-left">
          <span class="header-icon">⚡</span>
          <div>
            <h2>ÁRBOL DE TALENTOS & ESPECIALIZACIÓN</h2>
            <p class="subtitle">Forja el destino táctico de tu héroe canalizando el Éter ancestral</p>
          </div>
        </div>
        <div class="header-right">
          <div class="points-badge available">
            <span class="p-num">{{ availablePoints }}</span>
            <span class="p-lbl">Puntos Disponibles</span>
          </div>
          <div class="points-badge spent">
            <span class="p-num">{{ spentPoints }}</span>
            <span class="p-lbl">Puntos Invertidos</span>
          </div>
          <button mat-stroked-button color="warn" class="reset-btn" (click)="resetTalents()" [disabled]="spentPoints === 0">
            <mat-icon>restart_alt</mat-icon> Reiniciar Árbol (150 🪙)
          </button>
        </div>
      </div>

      <div class="branches-grid">
        <!-- RAMA 1: OFENSIVA -->
        <div class="branch-column glass-panel offense">
          <div class="branch-header">
            <span class="b-icon">⚔️</span>
            <div>
              <h3>Senda Ofensiva</h3>
              <span class="b-sub">Poder destructor y golpes críticos letales</span>
            </div>
          </div>
          <div class="nodes-list">
            <div *ngFor="let node of getNodesByBranch('OFFENSE')" class="talent-node-card glass-panel" [class.maxed]="node.currentPoints === node.maxPoints" [class.active]="node.currentPoints > 0">
              <div class="node-icon-wrap">
                <span class="n-icon">{{ node.icon }}</span>
                <span class="n-tier">T{{ node.tier }}</span>
              </div>
              <div class="node-content">
                <div class="n-title-row">
                  <h4>{{ node.name }}</h4>
                  <span class="points-counter">{{ node.currentPoints }} / {{ node.maxPoints }}</span>
                </div>
                <p class="n-desc">{{ node.description }}</p>
                <button mat-raised-button color="accent" class="invest-btn" 
                        [disabled]="availablePoints === 0 || node.currentPoints === node.maxPoints"
                        (click)="allocatePoint(node.id)">
                  <mat-icon>add_circle</mat-icon> Potenciar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RAMA 2: DEFENSIVA -->
        <div class="branch-column glass-panel defense">
          <div class="branch-header">
            <span class="b-icon">🛡️</span>
            <div>
              <h3>Senda Defensiva</h3>
              <span class="b-sub">Mitigación férrea, coraza y supervivencia</span>
            </div>
          </div>
          <div class="nodes-list">
            <div *ngFor="let node of getNodesByBranch('DEFENSE')" class="talent-node-card glass-panel" [class.maxed]="node.currentPoints === node.maxPoints" [class.active]="node.currentPoints > 0">
              <div class="node-icon-wrap">
                <span class="n-icon">{{ node.icon }}</span>
                <span class="n-tier">T{{ node.tier }}</span>
              </div>
              <div class="node-content">
                <div class="n-title-row">
                  <h4>{{ node.name }}</h4>
                  <span class="points-counter">{{ node.currentPoints }} / {{ node.maxPoints }}</span>
                </div>
                <p class="n-desc">{{ node.description }}</p>
                <button mat-raised-button color="primary" class="invest-btn" 
                        [disabled]="availablePoints === 0 || node.currentPoints === node.maxPoints"
                        (click)="allocatePoint(node.id)">
                  <mat-icon>add_circle</mat-icon> Potenciar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RAMA 3: UTILIDAD & FORTUNA -->
        <div class="branch-column glass-panel utility">
          <div class="branch-header">
            <span class="b-icon">🌟</span>
            <div>
              <h3>Senda de Fortuna</h3>
              <span class="b-sub">Saqueo de oro, aceleración de XP y maestría</span>
            </div>
          </div>
          <div class="nodes-list">
            <div *ngFor="let node of getNodesByBranch('UTILITY')" class="talent-node-card glass-panel" [class.maxed]="node.currentPoints === node.maxPoints" [class.active]="node.currentPoints > 0">
              <div class="node-icon-wrap">
                <span class="n-icon">{{ node.icon }}</span>
                <span class="n-tier">T{{ node.tier }}</span>
              </div>
              <div class="node-content">
                <div class="n-title-row">
                  <h4>{{ node.name }}</h4>
                  <span class="points-counter">{{ node.currentPoints }} / {{ node.maxPoints }}</span>
                </div>
                <p class="n-desc">{{ node.description }}</p>
                <button mat-raised-button color="accent" class="invest-btn" 
                        [disabled]="availablePoints === 0 || node.currentPoints === node.maxPoints"
                        (click)="allocatePoint(node.id)">
                  <mat-icon>add_circle</mat-icon> Potenciar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .talents-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1300px;
      margin: 0 auto;
    }

    .header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .header-icon {
      font-size: 2.75rem;
      filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.5));
    }

    .header-left h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #f59e0b, #fbbf24, #fef08a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .points-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 1.25rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .points-badge.available {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.4);
    }

    .points-badge.available .p-num {
      color: #4ade80;
      font-size: 1.5rem;
      font-weight: 800;
    }

    .points-badge.spent {
      background: rgba(148, 163, 184, 0.1);
    }

    .points-badge.spent .p-num {
      color: #94a3b8;
      font-size: 1.5rem;
      font-weight: 800;
    }

    .p-lbl {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #cbd5e1;
    }

    .branches-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .branches-grid {
        grid-template-columns: 1fr;
      }
    }

    .branch-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .branch-column.offense {
      border-top: 3px solid #ef4444;
    }

    .branch-column.defense {
      border-top: 3px solid #3b82f6;
    }

    .branch-column.utility {
      border-top: 3px solid #eab308;
    }

    .branch-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .b-icon {
      font-size: 2rem;
    }

    .branch-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .b-sub {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .nodes-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .talent-node-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 0.2s ease;
    }

    .talent-node-card.active {
      border-color: rgba(56, 189, 248, 0.4);
      background: rgba(30, 41, 59, 0.85);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .talent-node-card.maxed {
      border-color: rgba(234, 179, 8, 0.6);
      box-shadow: 0 0 16px rgba(234, 179, 8, 0.2);
    }

    .node-icon-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }

    .n-icon {
      font-size: 1.75rem;
    }

    .n-tier {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.15rem 0.4rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: #94a3b8;
    }

    .node-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .n-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .n-title-row h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .points-counter {
      font-size: 0.8rem;
      font-weight: 800;
      color: #38bdf8;
    }

    .n-desc {
      margin: 0;
      font-size: 0.775rem;
      color: #94a3b8;
      line-height: 1.35;
    }

    .invest-btn {
      align-self: flex-start;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
    }
  `]
})
export class TalentsTreeComponent implements OnInit {
  public availablePoints: number = 5;
  public spentPoints: number = 3;
  public nodes: TalentNode[] = [
    // Branch: OFFENSE
    { id: 'off_t1_fuerza', name: 'Fuerza de Coloso', description: '+8% de Daño físico y crítico en combate', branch: 'OFFENSE', tier: 1, maxPoints: 3, currentPoints: 2, isUnlocked: true, icon: '⚔️' },
    { id: 'off_t2_sobrecarga', name: 'Sobrecarga Rúnica', description: '+12% de daño en tiradas D20 superiores a 12', branch: 'OFFENSE', tier: 2, maxPoints: 3, currentPoints: 0, isUnlocked: false, icon: '⚡' },
    { id: 'off_t3_demoledor', name: 'Golpe Cataclísmico', description: 'Los impactos críticos ejecutan a enemigos a <15% HP', branch: 'OFFENSE', tier: 3, maxPoints: 1, currentPoints: 0, isUnlocked: false, icon: '💥' },

    // Branch: DEFENSE
    { id: 'def_t1_coraza', name: 'Coraza Pétrea', description: '+10% de Armadura y mitigación plana de daño', branch: 'DEFENSE', tier: 1, maxPoints: 3, currentPoints: 1, isUnlocked: true, icon: '🛡️' },
    { id: 'def_t2_evasion', name: 'Paso Espectral', description: '20% probabilidad de evadir contragolpes de Colosos', branch: 'DEFENSE', tier: 2, maxPoints: 3, currentPoints: 0, isUnlocked: false, icon: '💨' },
    { id: 'def_t3_inmortal', name: 'Espíritu Inquebrantable', description: 'Al recibir daño letal, sobrevive con 1 HP durante 3s', branch: 'DEFENSE', tier: 3, maxPoints: 1, currentPoints: 0, isUnlocked: false, icon: '✨' },

    // Branch: UTILITY
    { id: 'utl_t1_avaro', name: 'Ojo del Saqueador', description: '+15% de Oro obtenido en la Senda y Asedios', branch: 'UTILITY', tier: 1, maxPoints: 3, currentPoints: 0, isUnlocked: false, icon: '💰' },
    { id: 'utl_t2_sabiduria', name: 'Sabiduría Ancestral', description: '+20% de Experiencia en todas las actividades', branch: 'UTILITY', tier: 2, maxPoints: 3, currentPoints: 0, isUnlocked: false, icon: '📜' },
    { id: 'utl_t3_forja', name: 'Bendición de la Forja', description: '+5% probabilidad adicional de éxito en el Yunque', branch: 'UTILITY', tier: 3, maxPoints: 1, currentPoints: 0, isUnlocked: false, icon: '🔨' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTalents();
  }

  getNodesByBranch(branch: 'OFFENSE' | 'DEFENSE' | 'UTILITY'): TalentNode[] {
    return this.nodes.filter(n => n.branch === branch);
  }

  fetchTalents(): void {
    this.http.get<any>('/api/v1/talents/usr_kaelen').subscribe({
      next: (res) => {
        if (res && res.nodes) {
          this.availablePoints = res.availablePoints;
          this.spentPoints = res.spentPoints;
          this.nodes = res.nodes;
        }
      },
      error: () => {
        // Fallback local ya inicializado
      }
    });
  }

  allocatePoint(nodeId: string): void {
    if (this.availablePoints <= 0) return;
    this.http.post<any>(`/api/v1/talents/usr_kaelen/allocate`, { nodeId }).subscribe({
      next: (res) => {
        this.fetchTalents();
      },
      error: () => {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node && node.currentPoints < node.maxPoints) {
          node.currentPoints++;
          this.availablePoints--;
          this.spentPoints++;
        }
      }
    });
  }

  resetTalents(): void {
    this.http.post<any>(`/api/v1/talents/usr_kaelen/reset`, {}).subscribe({
      next: (res) => {
        this.fetchTalents();
      },
      error: () => {
        this.nodes.forEach(n => n.currentPoints = 0);
        this.availablePoints += this.spentPoints;
        this.spentPoints = 0;
      }
    });
  }
}
