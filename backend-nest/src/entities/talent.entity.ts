import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';

@Entity('player_talents')
export class PlayerTalent {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  player_id: string;

  @Column({ type: 'varchar', length: 64 })
  node_id: string;

  @Column({ type: 'int' })
  tier: number;

  @Column({ type: 'int', default: 1 })
  points: number;

  @CreateDateColumn({ type: 'timestamptz' })
  unlocked_at: Date;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;
}
