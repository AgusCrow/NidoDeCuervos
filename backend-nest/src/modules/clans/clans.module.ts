import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClansService } from './clans.service';
import { ClansController } from './clans.controller';
import { Clan, ClanMember } from '../../entities/clan.entity';
import { Territory } from '../../entities/territory.entity';
import { Player } from '../../entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clan, ClanMember, Territory, Player])],
  controllers: [ClansController],
  providers: [ClansService],
  exports: [ClansService],
})
export class ClansModule {}
