import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SetupDto } from './setup.dto';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  async status() {
    return { needsSetup: await this.setupService.needsSetup() };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: SetupDto) {
    return this.setupService.createFirstAdmin(dto.username, dto.password, dto.email);
  }
}
