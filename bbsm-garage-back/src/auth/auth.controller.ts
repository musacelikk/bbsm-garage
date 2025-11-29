import { Body, Controller, Get, Post, Put, UseGuards, Headers, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './auth.dto';
import { ChangePasswordDto } from './change-password.dto';
import { UpdateProfileDto } from './update-profile.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getAll() {
    return this.authService.findAll();
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 kayıt / 1 dakika (spam kayıt koruması)
  @Post()
  setOne(@Body() authDto: AuthDto) {
    return this.authService.addOne(authDto);
  }

  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 deneme / 5 dakika (brute force koruması)
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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const username = req.user.username;
    return this.authService.getProfile(username);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const username = req.user.username;
    return this.authService.changePassword(
      username,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const username = req.user.username;
    return this.authService.updateProfile(username, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    const username = req.user.username;
    const tenantId = req.user.tenant_id;
    return this.authService.logout(tenantId, username);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Request() req) {
    const username = req.user.username;
    return this.authService.resendVerificationEmail(username);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 istek / 1 dakika (spam koruması)
  @Post('forgot-password')
  async forgotPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.email) {
      throw new Error('Email adresi gereklidir');
    }
    return this.authService.requestPasswordReset(resetPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 istek / 1 dakika
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.token || !resetPasswordDto.newPassword) {
      throw new Error('Token ve yeni şifre gereklidir');
    }
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}
