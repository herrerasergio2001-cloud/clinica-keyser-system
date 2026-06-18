import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const users = await this.users.list();
    return users.map((user) => this.toResponse(user));
  }

  async create(dto: CreateUserDto, actor?: CurrentUser, ipAddress?: string) {
    this.assertCanManageUsers(actor);
    await this.validateUserPayload(dto);
    const duplicate = await this.users.findByEmail(dto.email);
    if (duplicate) throw new ConflictException('Ya existe un usuario con este correo');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
      isActive: dto.isActive ?? true,
    });
    await this.upsertDoctorProfileIfNeeded(user.id, dto);
    if (actor) await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'User', entityId: user.id, ipAddress, after: user });
    const created = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { role: true, doctorProfile: true } });
    return this.toResponse(created);
  }

  async update(id: string, dto: UpdateUserDto, actor: CurrentUser, ipAddress?: string) {
    this.assertCanManageUsers(actor);
    await this.validateUserPayload(dto);
    const before = await this.prisma.user.findUnique({ where: { id }, include: { role: true, doctorProfile: true } });
    if (!before) throw new NotFoundException('Usuario no encontrado');
    if (dto.email && dto.email !== before.email) {
      const duplicate = await this.users.findByEmail(dto.email);
      if (duplicate) throw new ConflictException('Ya existe un usuario con este correo');
    }
    const role = dto.role ? await this.prisma.role.findUniqueOrThrow({ where: { name: dto.role } }) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        isActive: dto.isActive,
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 12) : undefined,
        roleId: role?.id,
      },
      include: { role: true, doctorProfile: true },
    });
    await this.upsertDoctorProfileIfNeeded(id, { ...dto, role: dto.role ?? before.role.name });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'User', entityId: id, ipAddress, before, after: user });
    const updated = await this.prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true, doctorProfile: true } });
    return this.toResponse(updated);
  }

  async deactivate(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!before) throw new NotFoundException('Usuario no encontrado');
    const user = await this.prisma.user.update({ where: { id }, data: { isActive: false, disabledAt: new Date(), disabledBy: actor.sub, disableReason: dto.reason }, include: { role: true, doctorProfile: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.USER_DISABLED, entity: 'User', entityId: id, ipAddress, before, after: { user, reason: dto.reason } });
    return this.toResponse(user);
  }

  async enable(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!before) throw new NotFoundException('Usuario no encontrado');
    const user = await this.prisma.user.update({ where: { id }, data: { isActive: true, disabledAt: null, disabledBy: null, disableReason: null }, include: { role: true, doctorProfile: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.USER_ENABLED, entity: 'User', entityId: id, ipAddress, before, after: { user, reason: dto.reason } });
    return this.toResponse(user);
  }

  private toResponse<T extends { passwordHash: string }>(user: T) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private assertCanManageUsers(actor?: CurrentUser) {
    if (!actor?.permissions?.includes('*')) throw new ForbiddenException('Solo SUPER_ADMIN puede crear o editar usuarios');
  }

  private async validateUserPayload(dto: Partial<CreateUserDto & UpdateUserDto>) {
    if (dto.role === RoleName.DOCTOR) {
      if (!dto.professionalName?.trim()) throw new BadRequestException('El nombre profesional es obligatorio para médicos');
      if (!dto.minsaCode?.trim()) throw new BadRequestException('El código MINSA es obligatorio para médicos');
      if (!dto.specialty?.trim()) throw new BadRequestException('La especialidad es obligatoria para médicos');
    }
  }

  private async upsertDoctorProfileIfNeeded(userId: string, dto: Partial<CreateUserDto & UpdateUserDto>) {
    if (dto.role !== RoleName.DOCTOR && dto.role !== RoleName.SUPER_ADMIN) return;
    await this.prisma.doctorProfile.upsert({
      where: { userId },
      update: {
        fullName: dto.professionalName ?? dto.fullName,
        specialty: dto.specialty,
        minsaCode: dto.minsaCode,
        phone: dto.phone,
        isActive: dto.isActive ?? true,
      },
      create: {
        userId,
        fullName: dto.professionalName ?? dto.fullName ?? 'Médico',
        specialty: dto.specialty,
        minsaCode: dto.minsaCode,
        phone: dto.phone,
        isActive: dto.isActive ?? true,
      },
    });
  }
}
