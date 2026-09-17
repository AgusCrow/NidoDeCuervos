import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Player } from '../../entities/player.entity';
import { Item } from '../../entities/item.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, Item, InventoryItem]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'gremio_jwt_secret_key_taberna_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
