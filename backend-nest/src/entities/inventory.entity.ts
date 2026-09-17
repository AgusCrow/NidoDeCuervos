import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { Item, ItemSlot } from './item.entity';

@Entity('inventory')
export class InventoryItem {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  player_id: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ type: 'varchar', length: 64 })
  item_id: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'boolean', default: false })
  is_equipped: boolean;

  @Column({ type: 'enum', enum: ItemSlot, nullable: true })
  slot_equipped?: ItemSlot;

  @CreateDateColumn({ type: 'timestamptz' })
  acquired_at: Date;
}
