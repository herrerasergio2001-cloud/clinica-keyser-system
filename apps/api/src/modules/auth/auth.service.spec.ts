import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('rejects inactive users', async () => {
    const service = new AuthService(
      { findByEmail: jest.fn().mockResolvedValue({ isActive: false }) } as never,
      new JwtService(),
      { getOrThrow: jest.fn(), get: jest.fn() } as never,
      {} as never,
      {} as never,
    );

    await expect(service.login({ email: 'x@y.com', password: 'Password123!' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    const prisma = { session: { create: jest.fn() } };
    const audit = { record: jest.fn() };
    const service = new AuthService(
      {
        findByEmail: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'doctor@clinicakeyser.com',
          passwordHash,
          isActive: true,
          role: { name: 'DOCTOR', permissions: ['patients:read'] },
        }),
      } as never,
      { signAsync: jest.fn().mockResolvedValueOnce('access').mockResolvedValueOnce('refresh') } as never,
      { getOrThrow: jest.fn().mockReturnValue('secret'), get: jest.fn() } as never,
      prisma as never,
      audit as never,
    );

    await expect(service.login({ email: 'doctor@clinicakeyser.com', password: 'Password123!' })).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('refreshes the matching session when a user has several active sessions', async () => {
    const validRefreshToken = 'valid-refresh-token';
    const prisma = {
      session: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'other-session', refreshTokenHash: await bcrypt.hash('another-token', 4) },
          { id: 'matching-session', refreshTokenHash: await bcrypt.hash(validRefreshToken, 4) },
        ]),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    const service = new AuthService(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'doctor@clinicakeyser.com',
          isActive: true,
          role: { name: 'DOCTOR', permissions: ['medical-records:*'] },
        }),
      } as never,
      {
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1' }),
        signAsync: jest.fn().mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh'),
      } as never,
      { getOrThrow: jest.fn().mockReturnValue('secret'), get: jest.fn() } as never,
      prisma as never,
      { record: jest.fn() } as never,
    );

    await expect(service.refresh(validRefreshToken)).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'matching-session' },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
