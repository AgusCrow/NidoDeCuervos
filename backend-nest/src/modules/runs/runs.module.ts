import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { JourneyProgress } from '../../entities/journey-progress.entity';
import { RaidBoss, RaidContribution } from '../../entities/raid-boss.entity';
import { Player } from '../../entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JourneyProgress, RaidBoss, RaidContribution, Player])],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
