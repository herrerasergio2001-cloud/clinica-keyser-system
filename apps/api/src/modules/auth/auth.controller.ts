import { Body, Controller, Ip, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Ip() ipAddress: string, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.login(dto, ipAddress, request.headers['user-agent']);
    this.authService.setAuthCookies(response, tokens);
    return tokens;
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Ip() ipAddress: string, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.refresh(dto.refreshToken, ipAddress, request.headers['user-agent']);
    this.authService.setAuthCookies(response, tokens);
    return tokens;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: CurrentUser, @Body() dto: RefreshTokenDto, @Ip() ipAddress: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logout(user.sub, dto.refreshToken, ipAddress);
    this.authService.clearAuthCookies(response);
    return result;
  }
}
