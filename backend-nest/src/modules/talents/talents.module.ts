import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerTalent } from '../../entities/talent.entity';
import { Player } from '../../entities/player.entity';
import { TalentsService } from './talents.service';
import { TalentsController } from './talents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerTalent, Player])],
  controllers: [TalentsController],
  providers: [TalentsService],
  exports: [TalentsService],
})
export class TalentsModule {}
