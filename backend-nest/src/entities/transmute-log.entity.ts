import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { ItemRarity } from './item.entity';

@Entity('transmute_logs')
export class TransmuteLog {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  player_id: string;

  @Column({ type: 'enum', enum: ItemRarity })
  source_rarity: ItemRarity;

  @Column({ type: 'jsonb' })
  source_item_ids: string[];

  @Column({ type: 'varchar', length: 64 })
  result_item_id: string;

  @Column({ type: 'enum', enum: ItemRarity })
  result_rarity: ItemRarity;

  @Column({ type: 'boolean', default: false })
  was_critical_double_jump: boolean;

  @Column({ type: 'bigint', default: 0 })
  gold_spent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@Entity('dm_balance_audit_logs')
export class DmBalanceAuditLog {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  dm_player_id: string;

  @Column({ type: 'varchar', length: 64 })
  dm_username: string;

  @Column({ type: 'varchar', length: 64 })
  section: string;

  @Column({ type: 'jsonb' })
  previous_config: any;

  @Column({ type: 'jsonb' })
  new_config: any;

  @CreateDateColumn({ type: 'timestamptz' })
  applied_at: Date;
}
