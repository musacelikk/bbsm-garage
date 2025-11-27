import { Body, Controller, Get, Post, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getAll() {
    return this.authService.findAll();
  }

  @Post()
  setOne(@Body() authDto: AuthDto) {
    return this.authService.addOne(authDto);
  }

  @Post('control')
  async setController(@Body() authDto: AuthDto) {
    return this.authService.findUserPass(authDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('refresh')
  async refresh(@Headers('authorization') authorization: string) {
    const token = authorization.replace('Bearer ', '');
    return this.authService.refreshToken(token);
  }
}
