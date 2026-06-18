import { Injectable } from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { role: true, doctorProfile: true } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { role: true, doctorProfile: true } });
  }

  list() {
    return this.prisma.user.findMany({
      include: { role: true, doctorProfile: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(data: Omit<Prisma.UserCreateInput, 'role'> & { role: RoleName }) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: data.role } });
    const { role: _role, ...userData } = data;
    return this.prisma.user.create({
      data: { ...userData, role: { connect: { id: role.id } } },
      include: { role: true, doctorProfile: true },
    });
  }
}
