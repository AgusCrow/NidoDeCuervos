import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('raid_boss')
export class RaidBoss {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ type: 'bigint' })
  current_hp: string;

  @Column({ type: 'bigint' })
  max_hp: string;

  @Column({ type: 'varchar', length: 32, default: 'MYTHIC' })
  tier: string;

  @Column({ type: 'int', default: 1 })
  phase: number;

  @Column({ type: 'varchar', length: 32, default: 'FIRE' })
  element: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', default: [] })
  milestones_achieved: any[];

  @CreateDateColumn({ type: 'timestamptz' })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ends_at: Date;
}

@Entity('raid_contributions')
export class RaidContribution {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  raid_id: string;

  @Column({ type: 'varchar', length: 64 })
  player_id: string;

  @Column({ type: 'varchar', length: 100 })
  player_name: string;

  @Column({ type: 'bigint', default: 0 })
  damage_dealt: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_attack_at: Date;
}
