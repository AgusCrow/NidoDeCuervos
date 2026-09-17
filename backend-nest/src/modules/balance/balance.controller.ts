import { Controller, Get, Put, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { BalanceService } from './balance.service';

@Controller('api/v1/dm/balance')
export class DmBalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  getAllConfigs() {
    return {
      status: 'success',
      data: this.balanceService.getAllConfigs(),
    };
  }

  @Get('audit-logs')
  async getAuditLogs() {
    const logs = await this.balanceService.getAuditLogs(50);
    return {
      status: 'success',
      count: logs.length,
      data: logs,
    };
  }

  @Get(':section')
  getSectionConfig(@Param('section') section: string) {
    return {
      status: 'success',
      section,
      data: this.balanceService.getSection(section),
    };
  }

  @Put(':section')
  async updateSectionConfig(
    @Param('section') section: string,
    @Body() newConfig: any,
    @Req() req: any
  ) {
    const dmUser = req.user || { id: 'usr_dm_master', username: 'dungeon_master_admin' };
    const result = await this.balanceService.updateSection(section, newConfig, dmUser);
    return {
      status: 'success',
      ...result,
    };
  }

  @Post(':section/reset')
  async resetSectionConfig(
    @Param('section') section: string,
    @Req() req: any
  ) {
    const dmUser = req.user || { id: 'usr_dm_master', username: 'dungeon_master_admin' };
    const result = await this.balanceService.resetSection(section, dmUser);
    return {
      status: 'success',
      ...result,
    };
  }
}
