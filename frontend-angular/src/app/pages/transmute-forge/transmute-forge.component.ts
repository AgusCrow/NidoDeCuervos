import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface InvItem {
  id: string;
  name: string;
  rarity: string;
  slot: string;
  icon: string;
  attackBonus: number;
  defenseBonus: number;
}

@Component({
  selector: 'app-transmute-forge',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="transmute-container">
      <div class="transmute-card glass-panel">
        <header class="transmute-header">
          <h1 class="epic-title">⚗️ Crisol de Transmutación Alquímica</h1>
          <p class="subtitle">Funde 9 artefactos de una misma categoría para forjar una reliquia superior</p>
        </header>

        <div class="alchemy-circle-container">
          <!-- Banner de Regla y Probabilidad -->
          <div class="rates-banner glass-panel">
            <div class="rate-item standard">
              <mat-icon>trending_up</mat-icon>
              <span>Salto de Categoría (+1 Rango): <strong>85% - 50%</strong></span>
            </div>
            <div class="rate-item divine">
              <mat-icon>auto_awesome</mat-icon>
              <span>Salto Doble Astral (+2 Rangos): <strong>10% - 15%</strong></span>
            </div>
            <div class="rate-item warning">
              <mat-icon>shield</mat-icon>
              <span>Coherencia: 9 ítems iguales garantizan mismo tipo de ranura</span>
            </div>
          </div>

          <!-- Selector de Rareza Activa -->
          <div class="rarity-selector">
            <label>Filtrar por Rareza:</label>
            <div class="chips-row">
              <button 
                *ngFor="let r of availableRarities" 
                class="rarity-btn" 
                [class.active]="selectedRarity === r"
                (click)="setRarity(r)">
                {{ r }}
              </button>
            </div>
          </div>

          <!-- Grid de 9 Ranuras de Fusión -->
          <div class="fusion-altar">
            <div class="slots-grid">
              <div 
                *ngFor="let slotIndex of [0,1,2,3,4,5,6,7,8]" 
                class="fusion-slot glass-panel"
                [class.filled]="selectedItems[slotIndex]"
                (click)="removeSlotItem(slotIndex)">
                <ng-container *ngIf="selectedItems[slotIndex]; else emptySlot">
                  <div class="slot-icon">{{ selectedItems[slotIndex].icon }}</div>
                  <div class="slot-name">{{ selectedItems[slotIndex].name }}</div>
                  <div class="slot-remove"><mat-icon>close</mat-icon></div>
                </ng-container>
                <ng-template #emptySlot>
                  <span class="slot-num">{{ slotIndex + 1 }}</span>
                  <span class="slot-lbl">Ranura</span>
                </ng-template>
              </div>
            </div>

            <!-- Botón Central de Ignición -->
            <div class="ignite-section">
              <div class="cost-summary">
                <span>Coste en Oro: <strong>{{ goldCost }} monedas</strong></span>
                <span>Insumos: <strong>{{ selectedItems.length }} / 9</strong></span>
              </div>
              <button 
                mat-flat-button 
                class="transmute-btn" 
                [disabled]="selectedItems.length !== 9 || isTransmuting"
                (click)="executeTransmutation()">
                <mat-icon>{{ isTransmuting ? 'sync' : 'whatshot' }}</mat-icon>
                {{ isTransmuting ? 'Transmutando en el Éter...' : 'Iniciar Transmutación Alquímica' }}
              </button>
            </div>
          </div>

          <!-- Inventario de Candidatos Elegibles -->
          <div class="eligible-inventory glass-panel">
            <h3>Tus Ítems Elegibles ({{ filteredInventory.length }})</h3>
            <div class="inventory-items-grid">
              <div 
                *ngFor="let it of filteredInventory" 
                class="inv-item glass-panel"
                (click)="addCandidateToSlot(it)">
                <span class="it-icon">{{ it.icon }}</span>
                <div class="it-info">
                  <div class="it-title">{{ it.name }}</div>
                  <div class="it-stats">ATK +{{ it.attackBonus }} | DEF +{{ it.defenseBonus }}</div>
                </div>
                <mat-icon class="add-icon">add</mat-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transmute-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .transmute-header {
      text-align: center;
      margin-bottom: 2rem;
      h1 { font-size: 2rem; margin-bottom: 0.3rem; }
      .subtitle { color: var(--text-secondary); font-size: 0.95rem; }
    }
    .rates-banner {
      display: flex;
      justify-content: space-around;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: 8px;
      .rate-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        &.standard { color: #38bdf8; }
        &.divine { color: var(--accent-gold); font-weight: 700; }
      }
    }
    .rarity-selector {
      margin-bottom: 1.5rem;
      label { display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.85rem; }
      .chips-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .rarity-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        &.active {
          background: var(--accent-cyan);
          color: #000;
          font-weight: 700;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
        }
      }
    }
    .fusion-altar {
      margin-bottom: 2rem;
      .slots-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        max-width: 600px;
        margin: 0 auto 1.5rem;
      }
      .fusion-slot {
        height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        transition: all 0.2s ease;
        &.filled {
          border-style: solid;
          border-color: var(--accent-gold);
          background: rgba(245, 158, 11, 0.1);
        }
        .slot-num { font-size: 1.2rem; font-family: var(--font-code); color: var(--text-muted); }
        .slot-lbl { font-size: 0.75rem; color: var(--text-muted); }
        .slot-icon { font-size: 1.8rem; }
        .slot-name { font-size: 0.75rem; text-align: center; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .slot-remove { position: absolute; top: 4px; right: 4px; mat-icon { font-size: 14px; height: 14px; width: 14px; color: var(--accent-crimson); } }
      }
      .ignite-section {
        text-align: center;
        .cost-summary {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
          font-size: 0.95rem;
          color: var(--text-secondary);
          strong { color: #fff; }
        }
        .transmute-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #fff;
          font-weight: 700;
          padding: 0.8rem 2.2rem;
          border-radius: 8px;
          font-size: 1.05rem;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
        }
      }
    }
    .eligible-inventory {
      padding: 1.5rem;
      border-radius: 8px;
      h3 { font-size: 1.1rem; color: #fff; margin-bottom: 1rem; }
      .inventory-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.8rem;
        max-height: 250px;
        overflow-y: auto;
      }
      .inv-item {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.6rem 0.8rem;
        border-radius: 6px;
        cursor: pointer;
        &:hover { border-color: var(--accent-cyan); }
        .it-icon { font-size: 1.4rem; }
        .it-info { flex: 1; .it-title { font-size: 0.85rem; font-weight: 600; color: #fff; } .it-stats { font-size: 0.75rem; color: var(--text-secondary); } }
        .add-icon { color: var(--accent-cyan); font-size: 18px; }
      }
    }
  `]
})
export class TransmuteForgeComponent implements OnInit {
  selectedRarity = 'COMMON';
  availableRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  goldCost = 25;
  isTransmuting = false;

  selectedItems: InvItem[] = [];

  // Muestra de inventario para pruebas
  inventory: InvItem[] = [
    { id: '1', name: 'Daga Oxidada', rarity: 'COMMON', slot: 'WEAPON', icon: '🗡️', attackBonus: 4, defenseBonus: 0 },
    { id: '2', name: 'Porra de Roble', rarity: 'COMMON', slot: 'WEAPON', icon: '🪵', attackBonus: 3, defenseBonus: 0 },
    { id: '3', name: 'Cota de Retales', rarity: 'COMMON', slot: 'ARMOR', icon: '🛡️', attackBonus: 0, defenseBonus: 3 },
    { id: '4', name: 'Escudo Astillado', rarity: 'COMMON', slot: 'ARMOR', icon: '🛡️', attackBonus: 0, defenseBonus: 4 },
    { id: '5', name: 'Cuchillo de Caza', rarity: 'COMMON', slot: 'WEAPON', icon: '🗡️', attackBonus: 5, defenseBonus: 0 },
    { id: '6', name: 'Guantelete Roído', rarity: 'COMMON', slot: 'ARMOR', icon: '🧤', attackBonus: 1, defenseBonus: 2 },
    { id: '7', name: 'Vara Quebrada', rarity: 'COMMON', slot: 'WEAPON', icon: '🪄', attackBonus: 4, defenseBonus: 0 },
    { id: '8', name: 'Yelmo de Latón', rarity: 'COMMON', slot: 'ARMOR', icon: '🪖', attackBonus: 0, defenseBonus: 5 },
    { id: '9', name: 'Arco de Fresno', rarity: 'COMMON', slot: 'WEAPON', icon: '🏹', attackBonus: 4, defenseBonus: 0 },
    { id: '10', name: 'Botas de Viajero', rarity: 'COMMON', slot: 'ARMOR', icon: '🥾', attackBonus: 0, defenseBonus: 2 },
  ];

  get filteredInventory(): InvItem[] {
    const selectedIds = new Set(this.selectedItems.map(i => i.id));
    return this.inventory.filter(i => i.rarity === this.selectedRarity && !selectedIds.has(i.id));
  }

  ngOnInit(): void {}

  setRarity(r: string) {
    this.selectedRarity = r;
    this.selectedItems = [];
    const costs: Record<string, number> = {
      COMMON: 25,
      UNCOMMON: 50,
      RARE: 120,
      EPIC: 300,
      LEGENDARY: 750,
    };
    this.goldCost = costs[r] || 25;
  }

  addCandidateToSlot(item: InvItem) {
    if (this.selectedItems.length < 9) {
      this.selectedItems.push(item);
    }
  }

  removeSlotItem(index: number) {
    if (this.selectedItems[index]) {
      this.selectedItems.splice(index, 1);
    }
  }

  executeTransmutation() {
    if (this.selectedItems.length !== 9) return;
    this.isTransmuting = true;

    setTimeout(() => {
      this.isTransmuting = false;
      const isCrit = Math.random() < 0.10; // 10% probabilidad
      if (isCrit) {
        alert('✨ ¡SALTO CRÍTICO DIVINO! Los 9 ítems han avanzado 2 categorías completas.');
      } else {
        alert('✨ ¡Transmutación Alquímica Exitosa! Has obtenido un nuevo artefacto de categoría superior.');
      }
      this.selectedItems = [];
    }, 1200);
  }
}
