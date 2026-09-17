import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum ItemSlot {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  RING = 'RING',
  AMULET = 'AMULET',
  CONSUMABLE = 'CONSUMABLE',
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  ANCIENT = 'ANCIENT',
  DIVINE = 'DIVINE',
  CELESTIAL = 'CELESTIAL',
  ETERNAL = 'ETERNAL',
  PRIMORDIAL = 'PRIMORDIAL',
}

@Entity('items')
export class Item {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ItemSlot })
  slot: ItemSlot;

  @Column({ type: 'enum', enum: ItemRarity })
  rarity: ItemRarity;

  @Column({ type: 'int', default: 0 })
  attack_bonus: number;

  @Column({ type: 'int', default: 0 })
  defense_bonus: number;

  @Column({ type: 'bigint', default: 10 })
  gold_value: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  special_effect?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon?: string;

  @Column({ type: 'boolean', default: true })
  is_template: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  owner_id?: string;

  @Column({ type: 'int', default: 0 })
  refinement_level: number;

  @Column({ type: 'varchar', length: 64, default: 'STANDARD' })
  item_type: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
