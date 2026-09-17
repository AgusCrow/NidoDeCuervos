import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { TransmuteService } from './transmute.service';
import { BalanceService } from '../balance/balance.service';

@Controller('api/v1/forge')
export class ForgeController {
  constructor(
    private readonly transmuteService: TransmuteService,
    private readonly balanceService: BalanceService,
  ) {}

  @Get('transmute/config')
  getTransmuteConfig() {
    return {
      status: 'success',
      config: this.balanceService.getSection('transmute'),
    };
  }

  @Post('transmute')
  async transmute(@Body() body: { itemIds: string[] }, @Req() req: any) {
    const playerId = req.user?.id || body['playerId'] || 'usr_kaelen';
    const result = await this.transmuteService.transmuteItems(playerId, body.itemIds);
    return {
      status: 'success',
      data: result,
    };
  }
}
