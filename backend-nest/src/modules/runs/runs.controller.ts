import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('api/v1/runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  // Senda Infinita
  @Get('journey/state')
  async getJourneyState(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getJourneyState(playerId) };
  }

  @Post('journey/tick')
  async tickJourney(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.tickJourney(playerId) };
  }

  @Post('journey/select-biome')
  async selectBiome(@Req() req: any, @Body() body: { biomeId: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.selectBiome(playerId, body.biomeId || 'bosque_sombras');
  }

  @Post('journey/claim-afk')
  async claimAfk(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.claimAfk(playerId);
  }

  // Catacumbas
  @Post('catacombs/wave')
  async runCatacombs(@Req() req: any, @Body() body: { floor?: number }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.runCatacombsWave(playerId, body.floor || 1) };
  }

  // Expediciones
  @Get('expeditions')
  async getExpeditions() {
    return { status: 'success', data: this.runsService.getExpeditionsList() };
  }

  @Post('expeditions/claim/:id')
  async claimExpedition(@Req() req: any, @Param('id') expId: string) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.claimExpeditionReward(playerId, expId);
  }

  // Colosos / Raid
  @Get('raid/boss')
  async getRaidBoss() {
    return { status: 'success', data: await this.runsService.getRaidBossState() };
  }

  @Post('raid/attack')
  async attackRaidBoss(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    const playerName = req.user?.name || 'Kaelen el Pícaro';
    return await this.runsService.attackRaidBoss(playerId, playerName);
  }
}
