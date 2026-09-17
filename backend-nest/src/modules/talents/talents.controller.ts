import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TalentsService } from './talents.service';

@Controller('api/v1/talents')
export class TalentsController {
  constructor(private readonly talentsService: TalentsService) {}

  @Get(':playerId')
  async getPlayerTalents(@Param('playerId') playerId: string) {
    return this.talentsService.getPlayerTalents(playerId);
  }

  @Post(':playerId/allocate')
  async allocateTalent(
    @Param('playerId') playerId: string,
    @Body('nodeId') nodeId: string,
  ) {
    return this.talentsService.allocateTalent(playerId, nodeId);
  }

  @Post(':playerId/reset')
  async resetTalents(@Param('playerId') playerId: string) {
    return this.talentsService.resetTalents(playerId);
  }
}
