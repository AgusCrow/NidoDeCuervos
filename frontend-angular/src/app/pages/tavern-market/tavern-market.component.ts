import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';

export interface Shout {
  id: string;
  player_name: string;
  secret_class: string;
  title: string;
  message: string;
  created_at: string;
}

export interface MarketItem {
  id: string;
  seller_name: string;
  item_name: string;
  item_description: string;
  item_icon: string;
  gold_price: number;
}

@Component({
  selector: 'app-tavern-market',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="tavern-market-container">
      <div class="header-card glass-panel">
        <div class="header-left">
          <span class="header-icon">🍺</span>
          <div>
            <h2>CRÓNICAS & MERCADO P2P</h2>
            <p class="subtitle">Escucha las historias de los aventureros y comercia tesoros libremente por oro</p>
          </div>
        </div>
        <div class="header-right">
          <div class="gold-chip">
            <span class="icon">🪙</span>
            <span>{{ userGold }} Oro Disponible</span>
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="300ms" class="cyber-tabs glass-panel">
        <!-- PESTAÑA 1: MURO DE TABERNA -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">forum</mat-icon> Muro de la Taberna
          </ng-template>
          <div class="tab-content">
            <div class="shout-input-box glass-panel">
              <input type="text" [(ngModel)]="newShoutMessage" placeholder="Escribe tu proclama o historia para todos los aventureros..." (keyup.enter)="postShout()">
              <button mat-raised-button color="primary" (click)="postShout()" [disabled]="!newShoutMessage.trim()">
                <mat-icon>send</mat-icon> Proclamar
              </button>
            </div>

            <div class="shouts-list">
              <div *ngFor="let s of shouts" class="shout-card glass-panel">
                <div class="shout-avatar">
                  <span class="class-badge">{{ s.secret_class === 'WARRIOR' ? '⚔️' : s.secret_class === 'MAGE' ? '🔮' : s.secret_class === 'ROGUE' ? '🗡️' : '🛡️' }}</span>
                </div>
                <div class="shout-content">
                  <div class="shout-meta">
                    <strong>{{ s.player_name }}</strong>
                    <span class="title-tag">{{ s.title }}</span>
                    <span class="time-lbl">{{ s.created_at | date:'shortTime' }}</span>
                  </div>
                  <p class="shout-text">{{ s.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- PESTAÑA 2: MERCADO P2P -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">storefront</mat-icon> Casa de Subastas P2P
          </ng-template>
          <div class="tab-content">
            <div class="market-grid">
              <div *ngFor="let m of marketListings" class="market-card glass-panel">
                <div class="m-icon-wrap">{{ m.item_icon }}</div>
                <div class="m-details">
                  <h4>{{ m.item_name }}</h4>
                  <p class="m-desc">{{ m.item_description }}</p>
                  <span class="m-seller">Vendedor: <strong>{{ m.seller_name }}</strong></span>
                </div>
                <div class="m-buy-box">
                  <span class="m-price">🪙 {{ m.gold_price }}</span>
                  <button mat-raised-button color="accent" (click)="buyItem(m)">
                    <mat-icon>shopping_cart</mat-icon> Comprar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .tavern-market-container {
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
    }

    .header-left h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .gold-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      border-radius: 20px;
      background: rgba(234, 179, 8, 0.15);
      border: 1px solid rgba(234, 179, 8, 0.4);
      color: #facc15;
      font-weight: 700;
    }

    .tab-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .shout-input-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .shout-input-box input {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 0.95rem;
      outline: none;
    }

    .shouts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .shout-card {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .class-badge {
      font-size: 1.75rem;
    }

    .shout-content {
      flex: 1;
    }

    .shout-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
    }

    .title-tag {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: rgba(234, 179, 8, 0.15);
      color: #facc15;
    }

    .time-lbl {
      font-size: 0.75rem;
      color: #64748b;
      margin-left: auto;
    }

    .shout-text {
      margin: 0;
      color: #e2e8f0;
      font-size: 0.925rem;
      line-height: 1.4;
    }

    .market-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .market-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .m-icon-wrap {
      font-size: 2.5rem;
      text-align: center;
    }

    .m-details h4 {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
      color: #f8fafc;
    }

    .m-desc {
      margin: 0 0 0.5rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .m-seller {
      font-size: 0.75rem;
      color: #cbd5e1;
    }

    .m-buy-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .m-price {
      font-weight: 800;
      font-size: 1.1rem;
      color: #facc15;
    }
  `]
})
export class TavernMarketComponent implements OnInit, OnDestroy {
  public userGold: number = 2473;
  public newShoutMessage: string = '';
  public shouts: Shout[] = [
    {
      id: 's_01',
      player_name: 'Thorin el Guerrero',
      secret_class: 'WARRIOR',
      title: 'Campeón de la Tormenta',
      message: '¡El Bastión de la Aurora ha resistido el asedio! ¡Larga vida a la Hermandad!',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 's_02',
      player_name: 'Elara la Maga',
      secret_class: 'MAGE',
      title: 'Segadora de Almas',
      message: 'Vendo Báculo Arcano +5 en el mercado. Precio especial para aventureros de nivel 10.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    }
  ];

  public marketListings: MarketItem[] = [
    {
      id: 'm_01',
      seller_name: 'Kaelen el Pícaro',
      item_name: 'Dagas Gemelas de Sombras +3',
      item_description: 'Forjadas con acero templado. +18 Daño, +10% Probabilidad de Crítico.',
      item_icon: '🗡️',
      gold_price: 350,
    },
    {
      id: 'm_02',
      seller_name: 'Lyra la Barda',
      item_name: 'Pechera de Placas del Bastión',
      item_description: 'Armadura pesada bendecida. +24 Defensa, +150 Vitalidad máxima.',
      item_icon: '🛡️',
      gold_price: 520,
    },
    {
      id: 'm_03',
      seller_name: 'Thorin el Guerrero',
      item_name: 'Poción Mayor de Sanación x5',
      item_description: 'Restaura 250 HP instantáneamente durante expediciones.',
      item_icon: '🧪',
      gold_price: 120,
    }
  ];

  private eventSource?: EventSource;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    this.connectSse();
  }

  ngOnDestroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  fetchData(): void {
    this.http.get<any[]>('/api/v1/tavern/shouts').subscribe({
      next: (data) => {
        if (data && data.length) this.shouts = data;
      },
      error: () => {}
    });

    this.http.get<any[]>('/api/v1/market/listings').subscribe({
      next: (data) => {
        if (data && data.length) this.marketListings = data;
      },
      error: () => {}
    });
  }

  connectSse(): void {
    try {
      this.eventSource = new EventSource('/api/v1/events/stream');
      this.eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'TAVERN_SHOUT') {
          this.shouts.unshift(payload.payload);
        }
      };
    } catch (e) {
      // EventSource fallback
    }
  }

  postShout(): void {
    if (!this.newShoutMessage.trim()) return;
    const msg = this.newShoutMessage.trim();
    this.newShoutMessage = '';

    this.http.post<any>('/api/v1/tavern/shout', { playerId: 'usr_kaelen', message: msg }).subscribe({
      next: (res) => {
        this.shouts.unshift(res);
      },
      error: () => {
        this.shouts.unshift({
          id: `s_local_${Date.now()}`,
          player_name: 'Kaelen el Pícaro',
          secret_class: 'ROGUE',
          title: 'Segadora de Almas',
          message: msg,
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  buyItem(item: MarketItem): void {
    if (this.userGold < item.gold_price) {
      alert('Oro insuficiente para comprar este objeto.');
      return;
    }

    this.http.post<any>('/api/v1/market/buy', { buyerId: 'usr_kaelen', listingId: item.id }).subscribe({
      next: (res) => {
        this.userGold -= item.gold_price;
        this.marketListings = this.marketListings.filter(m => m.id !== item.id);
        alert(res.message);
      },
      error: () => {
        this.userGold -= item.gold_price;
        this.marketListings = this.marketListings.filter(m => m.id !== item.id);
        alert(`¡Has adquirido con éxito "${item.item_name}" por ${item.gold_price} oro!`);
      }
    });
  }
}
