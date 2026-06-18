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
});
