import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { Router } from '@angular/router';

export interface CharacterAttributes {
  [key: string]: number;
  str: number;
  dex: number;
  int: number;
  con: number;
}

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
  ],
  template: `
    <div class="creation-container">
      <div class="creation-card glass-panel">
        <header class="creation-header">
          <h1 class="epic-title">🧙‍♂️ Iniciación del Aventurero</h1>
          <p class="subtitle">Forja tu identidad e inscribe tu nombre en los pergaminos eternos de la taberna</p>
        </header>

        <mat-stepper [linear]="true" #stepper class="custom-stepper">
          <!-- PASO 1: IDENTIDAD -->
          <mat-step [stepControl]="identityForm">
            <form [formGroup]="identityForm">
              <ng-template matStepLabel>Identidad</ng-template>
              <div class="step-content">
                <h2>¿Cómo serás recordado en las crónicas?</h2>
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="cyber-field">
                    <mat-label>Nombre de Aventurero</mat-label>
                    <input matInput formControlName="name" placeholder="Ej: Valerius el Justiciero">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="cyber-field">
                    <mat-label>Usuario de Acceso</mat-label>
                    <input matInput formControlName="username" placeholder="valerius_2026">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="cyber-field full-width">
                    <mat-label>Contraseña Maestra</mat-label>
                    <input matInput type="password" formControlName="password">
                  </mat-form-field>
                </div>

                <div class="step-actions">
                  <button mat-flat-button class="action-btn next-btn" matStepperNext [disabled]="identityForm.invalid">
                    Siguiente: Elegir Vocación <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </form>
          </mat-step>

          <!-- PASO 2: CLASE -->
          <mat-step>
            <ng-template matStepLabel>Clase</ng-template>
            <div class="step-content">
              <h2>Elige tu sendero arcano</h2>
              <div class="classes-grid">
                <div 
                  *ngFor="let c of classesList"
                  class="class-card glass-panel"
                  [class.selected]="selectedClass === c.id"
                  (click)="selectClass(c.id)">
                  <div class="class-icon">{{ c.icon }}</div>
                  <h3 class="class-name">{{ c.name }}</h3>
                  <div class="class-role">{{ c.role }}</div>
                  <p class="class-desc">{{ c.desc }}</p>
                  <div class="passive-pill">
                    <mat-icon>auto_awesome</mat-icon> {{ c.passive }}
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button class="back-btn" matStepperPrevious>Atrás</button>
                <button mat-flat-button class="action-btn next-btn" matStepperNext>
                  Siguiente: Asignar Atributos <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- PASO 3: ATRIBUTOS POINT-BUY -->
          <mat-step>
            <ng-template matStepLabel>Atributos</ng-template>
            <div class="step-content">
              <div class="points-pool-banner glass-panel">
                <span>Puntos de Destino Disponibles:</span>
                <strong class="points-counter" [class.empty]="availablePoints === 0">{{ availablePoints }}</strong>
              </div>

              <div class="attributes-stack">
                <div class="stat-row glass-panel" *ngFor="let st of attributesList">
                  <div class="stat-meta">
                    <div class="stat-title">{{ st.name }} ({{ st.key.toUpperCase() }})</div>
                    <div class="stat-desc">{{ st.desc }}</div>
                  </div>
                  <div class="stat-control">
                    <button mat-icon-button (click)="modifyStat(st.key, -1)" [disabled]="stats[st.key] <= 8">
                      <mat-icon>remove_circle_outline</mat-icon>
                    </button>
                    <span class="stat-val">{{ stats[st.key] }}</span>
                    <button mat-icon-button (click)="modifyStat(st.key, 1)" [disabled]="availablePoints <= 0 || stats[st.key] >= 18">
                      <mat-icon>add_circle_outline</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button class="back-btn" matStepperPrevious>Atrás</button>
                <button mat-flat-button class="action-btn next-btn" matStepperNext>
                  Siguiente: Confirmación <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- PASO 4: CONFIRMACIÓN Y AVATAR -->
          <mat-step>
            <ng-template matStepLabel>Juramento</ng-template>
            <div class="step-content confirm-step">
              <div class="character-preview glass-panel">
                <div class="avatar-circle">
                  <img [src]="'https://api.dicebear.com/7.x/bottts/svg?seed=' + identityForm.value.username" alt="Avatar">
                </div>
                <h2>{{ identityForm.value.name || 'Sin Nombre' }}</h2>
                <div class="meta-tag">{{ getSelectedClassName() }} | Nivel 1</div>
                
                <div class="stats-summary">
                  <div class="stat-chip">STR: {{ stats.str }}</div>
                  <div class="stat-chip">DEX: {{ stats.dex }}</div>
                  <div class="stat-chip">INT: {{ stats.int }}</div>
                  <div class="stat-chip">CON: {{ stats.con }}</div>
                </div>

                <div class="gift-banner">
                  <mat-icon>card_giftcard</mat-icon>
                  <span>Incluye paquete de bienvenida: Arma inicial de clase + 50 monedas de oro.</span>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button class="back-btn" matStepperPrevious>Atrás</button>
                <button mat-flat-button class="action-btn finish-btn" (click)="finalizeCreation()">
                  <mat-icon>check_circle</mat-icon> Cruzar el Umbral del Gremio
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    </div>
  `,
  styles: [`
    .creation-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .creation-card {
      width: 100%;
      max-width: 860px;
      padding: 2.5rem;
    }
    .creation-header {
      text-align: center;
      margin-bottom: 2rem;
      h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
      .subtitle { color: var(--text-secondary); font-size: 1rem; }
    }
    .step-content {
      padding: 1.5rem 0;
      h2 { font-size: 1.3rem; margin-bottom: 1.2rem; color: #e2e8f0; font-weight: 500; }
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.2rem;
      .full-width { grid-column: span 2; }
    }
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .class-card {
      padding: 1.2rem;
      text-align: center;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      transition: all 0.2s ease;
      &.selected {
        border-color: var(--accent-cyan);
        background: rgba(6, 182, 212, 0.12);
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
      }
      .class-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
      .class-name { font-size: 1.2rem; font-weight: 700; color: #fff; }
      .class-role { font-size: 0.8rem; color: var(--accent-cyan); margin-bottom: 0.6rem; text-transform: uppercase; }
      .class-desc { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem; line-height: 1.3; }
      .passive-pill {
        font-size: 0.75rem;
        background: rgba(0, 0, 0, 0.4);
        padding: 0.3rem 0.6rem;
        border-radius: 20px;
        color: #fef08a;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        mat-icon { font-size: 1rem; height: 1rem; width: 1rem; }
      }
    }
    .points-pool-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      border-radius: 8px;
      font-size: 1.1rem;
      .points-counter {
        font-size: 1.6rem;
        color: var(--accent-gold);
        font-family: var(--font-code);
        &.empty { color: #10b981; }
      }
    }
    .attributes-stack {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      .stat-title { font-weight: 700; color: #fff; font-size: 1.05rem; }
      .stat-desc { font-size: 0.85rem; color: var(--text-secondary); }
      .stat-control {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        .stat-val { font-size: 1.4rem; font-family: var(--font-code); min-width: 2rem; text-align: center; }
      }
    }
    .character-preview {
      text-align: center;
      padding: 2rem;
      margin-bottom: 1.5rem;
      .avatar-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin: 0 auto 1rem;
        overflow: hidden;
        border: 2px solid var(--accent-cyan);
        img { width: 100%; height: 100%; object-fit: cover; }
      }
      .meta-tag { color: var(--accent-gold); font-size: 0.95rem; margin-bottom: 1.2rem; }
      .stats-summary {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        .stat-chip {
          background: rgba(255, 255, 255, 0.06);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-family: var(--font-code);
        }
      }
      .gift-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        font-size: 0.9rem;
        color: #86efac;
      }
    }
    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      .action-btn {
        background: linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%);
        color: #fff;
        font-weight: 600;
        padding: 0.6rem 1.4rem;
        border-radius: 8px;
      }
      .finish-btn {
        background: linear-gradient(135deg, var(--accent-gold) 0%, #d97706 100%);
      }
      .back-btn { color: var(--text-secondary); }
    }
  `]
})
export class CharacterCreationComponent implements OnInit {
  identityForm: FormGroup;
  selectedClass = 'WARRIOR';
  availablePoints = 20;

  stats: CharacterAttributes = {
    str: 10,
    dex: 10,
    int: 10,
    con: 10,
  };

  classesList = [
    { id: 'WARRIOR', name: 'Guerrero', icon: '🛡️', role: 'Tanque & Combatiente', desc: 'Dominio de armas pesadas y resistencia de acero.', passive: 'Bastión: Gana empates PvP' },
    { id: 'MAGE', name: 'Mago', icon: '🧙‍♂️', role: 'Hechicero de Destrucción', desc: 'Canalizador del éter y relámpagos ancestrales.', passive: 'Sobrecarga: +50% daño tras derrota' },
    { id: 'ROGUE', name: 'Pícaro', icon: '🗡️', role: 'Asesino Sigiloso', desc: 'Veloz como el viento y letal en las sombras.', passive: 'Golpe Sombrío: d20>=18 K.O.' },
    { id: 'BARD', name: 'Bardo', icon: '🎼', role: 'Soporte & Fortuna', desc: 'Encanto de taberna y bendición de botines.', passive: 'Fortuna: +50% oro saqueado' },
  ];

  attributesList = [
    { key: 'str', name: 'Fuerza', desc: 'Incrementa el daño físico y la potencia en Guerra de Clanes.' },
    { key: 'dex', name: 'Destreza', desc: 'Aumenta la probabilidad de impacto crítico e iniciativa en duelos.' },
    { key: 'int', name: 'Inteligencia', desc: 'Potencia hechizos arcanos y resistencia al daño elemental.' },
    { key: 'con', name: 'Constitución', desc: 'Aumenta la salud total (HP) y absorción en asedios y expediciones.' },
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.identityForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {}

  selectClass(classId: string) {
    this.selectedClass = classId;
  }

  modifyStat(key: string, delta: number) {
    if (delta > 0 && this.availablePoints > 0 && this.stats[key] < 18) {
      this.stats[key]++;
      this.availablePoints--;
    } else if (delta < 0 && this.stats[key] > 8) {
      this.stats[key]--;
      this.availablePoints++;
    }
  }

  getSelectedClassName(): string {
    return this.classesList.find(c => c.id === this.selectedClass)?.name || 'Guerrero';
  }

  finalizeCreation() {
    const payload = {
      name: this.identityForm.value.name,
      username: this.identityForm.value.username,
      password: this.identityForm.value.password,
      secretClass: this.selectedClass,
      statStr: this.stats.str,
      statDex: this.stats.dex,
      statInt: this.stats.int,
      statCon: this.stats.con,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + this.identityForm.value.username,
    };

    console.log('Inscribiendo personaje en backend NestJS:', payload);
    // Redirección al grimorio tras alta
    this.router.navigate(['/dashboard']);
  }
}
