import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('territories')
export class Territory {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  controlling_clan_id: string | null;

  @Column({ type: 'bigint', default: 100 })
  daily_gold_yield: string;

  @Column({ type: 'varchar', length: 64 })
  stat_buff_type: string;

  @Column({ type: 'int', default: 5 })
  stat_buff_value: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_payout_at: Date;

  @Column({ type: 'varchar', length: 32, default: 'PEACE' })
  siege_status: string;

  @Column({ type: 'int', default: 1000 })
  siege_target_points: number;

  @Column({ type: 'jsonb', default: {} })
  siege_progress: Record<string, any>;
}
