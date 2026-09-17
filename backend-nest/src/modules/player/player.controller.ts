import { Controller, Get, Post, Req } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('api/v1/players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    const profile = await this.playerService.getPlayerProfile(playerId);
    return { status: 'success', data: profile };
  }

  @Post('daily-claim')
  async claimDaily(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    const result = await this.playerService.claimDailyMedal(playerId);
    return { status: 'success', data: result };
  }

  @Get('leaderboard')
  async getLeaderboard() {
    const data = await this.playerService.getLeaderboards();
    return { status: 'success', data };
  }

  @Get('inventory')
  async getInventory(@Req() req: any) {
    const playerId = req.user?.id || 'usr_kaelen';
    const items = await this.playerService.getInventory(playerId);
    return { status: 'success', count: items.length, data: items };
  }
}
