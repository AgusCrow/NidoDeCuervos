import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('journey_progress')
export class JourneyProgress {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  player_id: string;

  @Column({ type: 'varchar', length: 64 })
  biome_id: string;

  @Column({ type: 'int', default: 1 })
  wave_depth: number;

  @Column({ type: 'int', default: 0 })
  current_monster_index: number;

  @Column({ type: 'int' })
  monster_current_hp: number;

  @Column({ type: 'int' })
  monster_max_hp: number;

  @Column({ type: 'varchar', length: 100 })
  monster_name: string;

  @Column({ type: 'varchar', length: 32 })
  monster_icon: string;

  @Column({ type: 'int', default: 0 })
  total_monsters_slain: number;

  @Column({ type: 'bigint', default: 0 })
  accumulated_gold: string;

  @Column({ type: 'bigint', default: 0 })
  accumulated_xp: string;

  @Column({ type: 'jsonb', default: [] })
  accumulated_items: any[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_tick_at: Date;
}
