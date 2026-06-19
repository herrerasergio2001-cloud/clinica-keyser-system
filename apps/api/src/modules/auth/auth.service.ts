import { UnauthorizedException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { AuditService } from '../audit/audit.service';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';

type AuthUser = User & { role: { name: string; permissions: string[] }; doctorProfile?: { fullName?: string | null; minsaCode?: string | null; isActive?: boolean | null } | null };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  setAuthCookies(response: Response, tokens: { accessToken: string; refreshToken: string }) {
    const common = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      domain: this.config.get<string>('AUTH_COOKIE_DOMAIN') ?? '.clinicakeyser.com',
      path: '/',
    };
    response.cookie('ck_access_token', tokens.accessToken, { ...common, maxAge: 15 * 60 * 1000 });
    response.cookie('ck_refresh_token', tokens.refreshToken, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  clearAuthCookies(response: Response) {
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      domain: this.config.get<string>('AUTH_COOKIE_DOMAIN') ?? '.clinicakeyser.com',
      path: '/',
    };
    response.clearCookie('ck_access_token', options);
    response.clearCookie('ck_refresh_token', options);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user);
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);
    await this.audit.record({ actorId: user.id, action: AuditAction.LOGIN, entity: 'User', entityId: user.id, ipAddress });
    return tokens;
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const sessions = await this.prisma.session.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    let session = null;
    for (const candidate of sessions) {
      if (await bcrypt.compare(refreshToken, candidate.refreshTokenHash)) {
        session = candidate;
        break;
      }
    }
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid refresh token');

    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const tokens = await this.issueTokens(user);
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);
    return tokens;
  }

  async logout(userId: string, refreshToken: string, ipAddress?: string) {
    const sessions = await this.prisma.session.findMany({ where: { userId, revokedAt: null } });
    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
        await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      }
    }
    await this.audit.record({ actorId: userId, action: AuditAction.LOGOUT, entity: 'User', entityId: userId, ipAddress });
    return { success: true };
  }

  private async issueTokens(user: AuthUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
      name: user.doctorProfile?.fullName ?? user.fullName,
      minsaCode: user.doctorProfile?.isActive ? user.doctorProfile?.minsaCode : undefined,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
    const refreshToken = await this.jwt.signAsync({ sub: user.id }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.session.create({ data: { userId, refreshTokenHash, ipAddress, userAgent, expiresAt } });
  }

  private verifyRefreshToken(refreshToken: string) {
    return this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
