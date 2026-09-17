import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { Item } from './entities/item.entity';
import { InventoryItem } from './entities/inventory.entity';
import { Clan, ClanMember } from './entities/clan.entity';
import { TransmuteLog, DmBalanceAuditLog } from './entities/transmute-log.entity';

import { Territory } from './entities/territory.entity';
import { RaidBoss, RaidContribution } from './entities/raid-boss.entity';
import { JourneyProgress } from './entities/journey-progress.entity';
import { PlayerTalent } from './entities/talent.entity';
import { TavernShout, MarketListing } from './entities/tavern-market.entity';

import { BalanceModule } from './modules/balance/balance.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlayerModule } from './modules/player/player.module';
import { ForgeModule } from './modules/forge/forge.module';
import { ClansModule } from './modules/clans/clans.module';
import { RunsModule } from './modules/runs/runs.module';
import { TalentsModule } from './modules/talents/talents.module';
import { TavernMarketModule } from './modules/tavern-market/tavern-market.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://cuervo_admin:cuervo_password_2026@localhost:5433/nido_cuervos_db',
      entities: [
        Player, 
        Item, 
        InventoryItem, 
        Clan, 
        ClanMember, 
        TransmuteLog, 
        DmBalanceAuditLog,
        Territory,
        RaidBoss,
        RaidContribution,
        JourneyProgress,
        PlayerTalent,
        TavernShout,
        MarketListing,
      ],
      synchronize: false,
      logging: false,
    }),
    BalanceModule,
    AuthModule,
    PlayerModule,
    ForgeModule,
    ClansModule,
    RunsModule,
    TalentsModule,
    TavernMarketModule,
  ],
})
export class AppModule {}
