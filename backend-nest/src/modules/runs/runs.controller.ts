import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('api/v1/runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  // ==========================================
  // 1. SENDA INFINITA UNIFICADA
  // ==========================================
  @Get('journey/state')
  async getJourneyState(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getJourneyState(playerId) };
  }

  @Post('journey/start')
  async startJourney(@Req() req: any, @Body() body: { zoneId: string; difficultyId: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.startJourney(playerId, body.zoneId, body.difficultyId);
  }

  @Post('journey/claim')
  async claimJourney(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.claimJourney(playerId);
  }

  @Post('journey/claim-afk')
  async claimAfk(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.claimAfk(playerId);
  }

  // ==========================================
  // 2. EXPEDICIONES DE GREMIO (12h, 24h, 48h)
  // ==========================================
  @Get('guild-expeditions')
  async getGuildExpeditions(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getGuildExpeditionsState(playerId) };
  }

  @Post('guild-expeditions/start')
  async startGuildExpedition(@Req() req: any, @Body() body: { expeditionId: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.startGuildExpedition(playerId, body.expeditionId);
  }

  @Post('guild-expeditions/claim')
  async claimGuildExpedition(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.claimGuildExpedition(playerId);
  }

  // ==========================================
  // 3. COLOSOS MUNDIALES (CHAOS CASTLE SALAS 1-5)
  // ==========================================
  @Get('raid/rooms')
  async getRaidRooms(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getChaosCastleRooms(playerId) };
  }

  @Post('raid/join')
  async joinRaidRoom(@Req() req: any, @Body() body: { roomId: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    return await this.runsService.joinRaidRoom(playerId, body.roomId);
  }

  @Post('raid/attack')
  async attackRaidRoom(@Req() req: any, @Body() body: { roomId?: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    const roomId = body.roomId || 'cc_room_1';
    return await this.runsService.attackChaosCastleBoss(playerId, roomId);
  }

  @Post('raid/claim')
  async claimRaidReward(@Req() req: any, @Body() body: { roomId?: string }) {
    const playerId = req.user?.id || 'usr_kaelen';
    const roomId = body.roomId || 'cc_room_1';
    return await this.runsService.claimRaidReward(playerId, roomId);
  }

  // ==========================================
  // RETROCOMPATIBILIDAD
  // ==========================================
  @Get('raid/boss')
  async getRaidBoss(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getChaosCastleRooms(playerId) };
  }

  @Get('expeditions')
  async getExpeditions(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getGuildExpeditionsState(playerId) };
  }

  @Post('catacombs/wave')
  async runCatacombs(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    return { status: 'success', data: await this.runsService.getJourneyState(playerId) };
  }
}
