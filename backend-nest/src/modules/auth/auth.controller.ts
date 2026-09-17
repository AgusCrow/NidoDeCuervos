import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CharacterCreateDto, LoginDto } from './dto/character-create.dto';
import { BalanceService } from '../balance/balance.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly balanceService: BalanceService,
  ) {}

  @Get('creation-config')
  getCreationConfig() {
    const classesConfig = this.balanceService.getSection('classes');
    return {
      status: 'success',
      data: {
        pointBuy: classesConfig.point_buy,
        classes: classesConfig.classes,
      },
    };
  }

  @Post('create-character')
  async createCharacter(@Body() dto: CharacterCreateDto) {
    const result = await this.authService.registerCharacter(dto);
    return {
      status: 'success',
      ...result,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      status: 'success',
      ...result,
    };
  }
}
