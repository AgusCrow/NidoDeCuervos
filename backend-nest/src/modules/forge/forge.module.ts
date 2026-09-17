import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../../entities/player.entity';
import { Item } from '../../entities/item.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { TransmuteLog } from '../../entities/transmute-log.entity';
import { TransmuteService } from './transmute.service';
import { ForgeController } from './forge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Item, InventoryItem, TransmuteLog])],
  providers: [TransmuteService],
  controllers: [ForgeController],
  exports: [TransmuteService],
})
export class ForgeModule {}
