import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ClansService } from './clans.service';

@Controller('api/v1')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Get('clans')
  async getAllClans() {
    return { status: 'success', data: await this.clansService.getAllClans() };
  }

  @Get('clans/my-clan')
  async getMyClan(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.clansService.getMyClan(playerId) };
  }

  @Post('clans/donate')
  async donateGold(@Req() req: any, @Body() body: { amount: number }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.clansService.donateGold(playerId, body.amount || 50);
  }

  @Get('territories')
  async getTerritories() {
    return { status: 'success', data: await this.clansService.getTerritories() };
  }

  @Post('territories/claim-tribute/:id')
  async claimTribute(@Req() req: any, @Param('id') territoryId: string) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.clansService.claimTribute(playerId, territoryId);
  }

  @Post('territories/siege-action/:id')
  async siegeAction(@Req() req: any, @Param('id') territoryId: string, @Body() body: { actionType?: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.clansService.siegeAction(playerId, territoryId, body.actionType || 'BATTERING_RAM');
  }

  @Get('clans/war/tug-of-war')
  async getTugOfWar() {
    return await this.clansService.getTugOfWar();
  }

  @Post('clans/war/action')
  async warAction(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.clansService.pullWarAction(playerId);
  }
}
