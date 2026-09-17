import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';

export enum ClanRole {
  LEADER = 'LEADER',
  OFFICER = 'OFFICER',
  VETERAN = 'VETERAN',
  MEMBER = 'MEMBER',
}

@Entity('clans')
export class Clan {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 8, unique: true })
  tag: string;

  @Column({ type: 'varchar', length: 32 })
  banner_icon: string;

  @Column({ type: 'varchar', length: 64 })
  leader_id: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'bigint', default: 0 })
  xp: string;

  @Column({ type: 'bigint', default: 0 })
  treasury_gold: string;

  @Column({ type: 'int', default: 0 })
  total_trophies: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@Entity('clan_members')
export class ClanMember {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  clan_id: string;

  @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;

  @Column({ type: 'varchar', length: 64, unique: true })
  player_id: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ type: 'enum', enum: ClanRole, default: ClanRole.MEMBER })
  role: ClanRole;

  @Column({ type: 'bigint', default: 0 })
  gold_contributed: string;

  @Column({ type: 'int', default: 0 })
  trophies_contributed: number;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;
}
