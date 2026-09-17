import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tavern_shouts')
export class TavernShout {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  player_id: string;

  @Column({ type: 'varchar', length: 100 })
  player_name: string;

  @Column({ type: 'varchar', length: 32 })
  secret_class: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 280 })
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@Entity('market_listings')
export class MarketListing {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  seller_id: string;

  @Column({ type: 'varchar', length: 100 })
  seller_name: string;

  @Column({ type: 'varchar', length: 64 })
  item_id: string;

  @Column({ type: 'varchar', length: 100 })
  item_name: string;

  @Column({ type: 'text', nullable: true })
  item_description: string;

  @Column({ type: 'varchar', length: 32, default: '📦' })
  item_icon: string;

  @Column({ type: 'bigint' })
  gold_price: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status: string; // 'ACTIVE' | 'SOLD' | 'CANCELLED'

  @Column({ type: 'varchar', length: 64, nullable: true })
  buyer_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
