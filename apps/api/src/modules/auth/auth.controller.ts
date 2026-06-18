import { Body, Controller, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Ip() ipAddress: string, @Req() request: Request) {
    return this.authService.login(dto, ipAddress, request.headers['user-agent']);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Ip() ipAddress: string, @Req() request: Request) {
    return this.authService.refresh(dto.refreshToken, ipAddress, request.headers['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: CurrentUser, @Body() dto: RefreshTokenDto, @Ip() ipAddress: string) {
    return this.authService.logout(user.sub, dto.refreshToken, ipAddress);
  }
}
