import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum CharacterClass {
  WARRIOR = 'WARRIOR',
  MAGE = 'MAGE',
  ROGUE = 'ROGUE',
  BARD = 'BARD',
}

export enum UserRole {
  PLAYER = 'PLAYER',
  DM = 'DM',
}

export enum GensFaction {
  DUPRIAN = 'DUPRIAN',
  VANERT = 'VANERT',
}

@Entity('players')
export class Player {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  nfc_uid: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'enum', enum: CharacterClass })
  secret_class: CharacterClass;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @Column({ type: 'int', default: 10 })
  stat_str: number;

  @Column({ type: 'int', default: 10 })
  stat_dex: number;

  @Column({ type: 'int', default: 10 })
  stat_int: number;

  @Column({ type: 'int', default: 10 })
  stat_con: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url?: string;

  @Column({ type: 'bigint', default: 0 })
  xp: string;

  @Column({ type: 'bigint', default: 50 })
  gold: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  private_token: string;

  @Column({ type: 'int', default: 0 })
  streak_days: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_daily_claim_at?: Date;

  @Column({ type: 'int', default: 0 })
  pvp_wins: number;

  @Column({ type: 'int', default: 0 })
  pvp_losses: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  equipped_title?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  telegram_id?: string;

  @Column({ type: 'timestamptz', nullable: true })
  duel_disabled_until?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_scanned_at?: Date;

  @Column({ type: 'enum', enum: GensFaction, nullable: true })
  gens_faction?: GensFaction;

  @Column({ type: 'bigint', default: 0 })
  gens_contribution_points: string;

  @Column({ type: 'varchar', length: 64, default: 'Recluta' })
  gens_rank: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
