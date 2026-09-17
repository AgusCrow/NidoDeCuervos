import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceService } from './balance.service';
import { DmBalanceController } from './balance.controller';
import { DmBalanceAuditLog } from '../../entities/transmute-log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DmBalanceAuditLog])],
  providers: [BalanceService],
  controllers: [DmBalanceController],
  exports: [BalanceService],
})
export class BalanceModule {}
