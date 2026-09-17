import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TavernShout, MarketListing } from '../../entities/tavern-market.entity';
import { Player } from '../../entities/player.entity';
import { Item } from '../../entities/item.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { TavernMarketService } from './tavern-market.service';
import { TavernMarketController } from './tavern-market.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TavernShout, MarketListing, Player, Item, InventoryItem]),
  ],
  controllers: [TavernMarketController],
  providers: [TavernMarketService],
  exports: [TavernMarketService],
})
export class TavernMarketModule {}
