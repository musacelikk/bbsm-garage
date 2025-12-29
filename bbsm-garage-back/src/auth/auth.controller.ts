import { Body, Controller, Get, Post, Put, Patch, Delete, UseGuards, Headers, Request, Query, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './auth.dto';
import { ChangePasswordDto } from './change-password.dto';
import { UpdateProfileDto } from './update-profile.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { SelectMembershipPlanDto } from './dto/select-membership-plan.dto';
import { ToggleUserActiveDto } from './dto/toggle-user-active.dto';
import { AddMembershipDto } from './dto/add-membership.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { AdminResponseDto } from './dto/admin-response.dto';
import { MembershipRequestResponseDto } from './dto/membership-request-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { OneriService } from '../oneri/oneri.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oneriService: OneriService,
  ) {}

  @Get()
  getAll() {
    return this.authService.findAll();
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  setOne(@Body() authDto: AuthDto) {
    return this.authService.addOne(authDto);
  }

  @Throttle({ default: { limit: 10, ttl: 300000 } })
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
  @Get('membership')
  async getMembership(@Request() req) {
    const username = req.user.username;
    return this.authService.getMembership(username);
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

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-code')
  async verifyCode(@Body() body: { username: string; code: string }) {
    if (!body.username || !body.code) {
      throw new Error('Kullanıcı adı ve kod gereklidir');
    }
    return this.authService.verifyEmailCode(body.username, body.code);
  }

  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('resend-verification-code')
  async resendVerificationCode(@Body() body: { username: string }) {
    if (!body.username) {
      throw new Error('Kullanıcı adı gereklidir');
    }
    return this.authService.resendVerificationCodeForRegistration(body.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Request() req) {
    const username = req.user.username;
    return this.authService.resendVerificationEmail(username);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.email) {
      throw new Error('Email adresi gereklidir');
    }
    return this.authService.requestPasswordReset(resetPasswordDto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('request-password-reset')
  async requestPasswordResetForAuthenticated(@Request() req) {
    const username = req.user.username;
    return this.authService.requestPasswordResetForAuthenticatedUser(username);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.token || !resetPasswordDto.newPassword) {
      throw new Error('Token ve yeni şifre gereklidir');
    }
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @Post('admin/control')
  async adminControl(@Body() authDto: AuthDto) {
    return this.authService.findAdmin(authDto);
  }

  @Get('admin/users')
  async getAdminUsers(@Headers('authorization') authorization: string) {
    try {
      return await this.authService.getAllUsersForAdmin(authorization);
    } catch (error) {
      throw error;
    }
  }

  @Put('admin/users/:id/toggle-active')
  async toggleUserActive(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() toggleUserActiveDto: ToggleUserActiveDto
  ) {
    const userId = parseInt(id);
    return this.authService.toggleUserActive(authorization, userId, toggleUserActiveDto.isActive);
  }

  @Post('admin/users/:id/add-membership')
  async addMembership(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() addMembershipDto: AddMembershipDto
  ) {
    const userId = parseInt(id);
    const customDate = addMembershipDto.customDate ? new Date(addMembershipDto.customDate) : undefined;
    return this.authService.addMembership(authorization, userId, addMembershipDto.months, customDate);
  }

  @Delete('admin/users/:id')
  async deleteUser(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() deleteUserDto: DeleteUserDto
  ) {
    const userId = parseInt(id);
    return this.authService.deleteUser(authorization, userId, deleteUserDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('select-membership-plan')
  async selectMembershipPlan(@Request() req, @Body() selectMembershipPlanDto: SelectMembershipPlanDto) {
    const username = req.user.username;
    return this.authService.selectMembershipPlan(username, selectMembershipPlanDto.months);
  }

  @Get('admin/membership-requests')
  async getAllMembershipRequests(@Headers('authorization') authorization: string) {
    return this.authService.getAllMembershipRequests(authorization);
  }

  @Post('admin/membership-requests/:id/approve')
  async approveMembershipRequest(
    @Headers('authorization') authorization: string,
    @Param('id') id: string
  ) {
    const requestId = parseInt(id);
    return this.authService.approveMembershipRequest(authorization, requestId);
  }

  @Post('admin/membership-requests/:id/reject')
  async rejectMembershipRequest(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() membershipRequestResponseDto: MembershipRequestResponseDto
  ) {
    const requestId = parseInt(id);
    return this.authService.rejectMembershipRequest(authorization, requestId, membershipRequestResponseDto.reason);
  }

  @Get('admin/oneriler')
  async getAllOneriler(@Headers('authorization') authorization: string) {
    return this.authService.getAllOneriler(authorization);
  }

  @Patch('admin/oneriler/:id/approve')
  async approveOneri(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() adminResponseDto: AdminResponseDto
  ) {
    const oneriId = parseInt(id);
    return this.authService.approveOneri(authorization, oneriId, adminResponseDto.adminResponse);
  }

  @Patch('admin/oneriler/:id/reject')
  async rejectOneri(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() adminResponseDto: AdminResponseDto
  ) {
    const oneriId = parseInt(id);
    return this.authService.rejectOneri(authorization, oneriId, adminResponseDto.adminResponse);
  }
}
