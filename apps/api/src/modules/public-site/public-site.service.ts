import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import { join, normalize } from 'path';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { FileStorage } from '../../shared/storage/file-storage';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  PublicFAQDto,
  PublicGalleryImageDto,
  PublicNewsDto,
  PublicPromotionDto,
  PublicServiceDto,
  PublicTeamMemberDto,
  UpdatePublicSettingsDto,
} from './dto/public-site.dto';

type PublicModel = 'service' | 'promotion' | 'news' | 'faq' | 'gallery' | 'team';

@Injectable()
export class PublicSiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject('FileStorage') private readonly storage: FileStorage,
  ) {}

  async settings() {
    const existing = await this.prisma.publicSiteSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) return existing;
    return this.prisma.publicSiteSettings.create({ data: {} });
  }

  services(includeInactive = false) {
    return this.prisma.publicService.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  promotions(includeInactive = false) {
    const now = new Date();
    return this.prisma.publicPromotion.findMany({
      where: includeInactive
        ? undefined
        : {
            isActive: true,
            OR: [{ startDate: null }, { startDate: { lte: now } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
          },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }, { title: 'asc' }],
    });
  }

  news(includeInactive = false) {
    return this.prisma.publicNews.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  faqs(includeInactive = false) {
    return this.prisma.publicFAQ.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { question: 'asc' }],
    });
  }

  gallery(includeInactive = false) {
    return this.prisma.publicGalleryImage.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  team(includeInactive = false) {
    return this.prisma.publicTeamMember.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async adminContent() {
    const [settings, services, promotions, news, faqs, gallery, team] = await Promise.all([
      this.settings(),
      this.services(true),
      this.promotions(true),
      this.news(true),
      this.faqs(true),
      this.gallery(true),
      this.team(true),
    ]);
    return { settings, services, promotions, news, faqs, gallery, team };
  }

  async updateSettings(dto: UpdatePublicSettingsDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.settings();
    const settings = await this.prisma.publicSiteSettings.update({ where: { id: before.id }, data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicSiteSettings', entityId: settings.id, ipAddress, before, after: settings });
    return settings;
  }

  async createService(dto: PublicServiceDto, actor: CurrentUser, ipAddress?: string) {
    const service = await this.prisma.publicService.create({ data: { ...dto, slug: await this.uniqueSlug('service', dto.slug ?? dto.title) } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicService', entityId: service.id, ipAddress, after: service });
    return service;
  }

  async updateService(id: string, dto: PublicServiceDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.publicService.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Servicio público no encontrado');
    const service = await this.prisma.publicService.update({ where: { id }, data: { ...dto, slug: dto.slug ? await this.uniqueSlug('service', dto.slug, id) : undefined } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicService', entityId: id, ipAddress, before, after: service });
    return service;
  }

  async createPromotion(dto: PublicPromotionDto, actor: CurrentUser, ipAddress?: string) {
    const promotion = await this.prisma.publicPromotion.create({ data: { ...this.promotionData(dto), slug: await this.uniqueSlug('promotion', dto.slug ?? dto.title) } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicPromotion', entityId: promotion.id, ipAddress, after: promotion });
    return promotion;
  }

  async updatePromotion(id: string, dto: PublicPromotionDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.publicPromotion.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Promoción no encontrada');
    const promotion = await this.prisma.publicPromotion.update({ where: { id }, data: { ...this.promotionData(dto), slug: dto.slug ? await this.uniqueSlug('promotion', dto.slug, id) : undefined } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicPromotion', entityId: id, ipAddress, before, after: promotion });
    return promotion;
  }

  async createNews(dto: PublicNewsDto, actor: CurrentUser, ipAddress?: string) {
    const item = await this.prisma.publicNews.create({ data: { ...this.newsData(dto), slug: await this.uniqueSlug('news', dto.slug ?? dto.title) } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicNews', entityId: item.id, ipAddress, after: item });
    return item;
  }

  async updateNews(id: string, dto: PublicNewsDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.publicNews.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Noticia no encontrada');
    const item = await this.prisma.publicNews.update({ where: { id }, data: { ...this.newsData(dto), slug: dto.slug ? await this.uniqueSlug('news', dto.slug, id) : undefined } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicNews', entityId: id, ipAddress, before, after: item });
    return item;
  }

  async createFaq(dto: PublicFAQDto, actor: CurrentUser, ipAddress?: string) {
    const faq = await this.prisma.publicFAQ.create({ data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicFAQ', entityId: faq.id, ipAddress, after: faq });
    return faq;
  }

  async updateFaq(id: string, dto: PublicFAQDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.publicFAQ.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Pregunta frecuente no encontrada');
    const faq = await this.prisma.publicFAQ.update({ where: { id }, data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicFAQ', entityId: id, ipAddress, before, after: faq });
    return faq;
  }

  async createGalleryImage(dto: PublicGalleryImageDto, actor: CurrentUser, ipAddress?: string) {
    const item = await this.prisma.publicGalleryImage.create({ data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicGalleryImage', entityId: item.id, ipAddress, after: item });
    return item;
  }

  async updateGalleryImage(id: string, dto: PublicGalleryImageDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.publicGalleryImage.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Imagen de galería no encontrada');
    const item = await this.prisma.publicGalleryImage.update({ where: { id }, data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicGalleryImage', entityId: id, ipAddress, before, after: item });
    return item;
  }

  async createTeamMember(dto: PublicTeamMemberDto, actor: CurrentUser, ipAddress?: string) {
    const item = await this.prisma.publicTeamMember.create({ data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicTeamMember', entityId: item.id, ipAddress, after: item });
    return item;
  }

  async updateTeamMember(id: string, dto: PublicTeamMemberDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.publicTeamMember.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Integrante del equipo no encontrado');
    const item = await this.prisma.publicTeamMember.update({ where: { id }, data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'PublicTeamMember', entityId: id, ipAddress, before, after: item });
    return item;
  }

  async delete(kind: PublicModel, id: string, actor: CurrentUser, ipAddress?: string) {
    const delegates = {
      service: this.prisma.publicService,
      promotion: this.prisma.publicPromotion,
      news: this.prisma.publicNews,
      faq: this.prisma.publicFAQ,
      gallery: this.prisma.publicGalleryImage,
      team: this.prisma.publicTeamMember,
    } as const;
    const delegate = delegates[kind] as unknown as {
      findUnique(args: { where: { id: string } }): Promise<unknown>;
      delete(args: { where: { id: string } }): Promise<unknown>;
    };
    const before = await delegate.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Contenido público no encontrado');
    const deleted = await delegate.delete({ where: { id } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: `Public${kind}`, entityId: id, ipAddress, before });
    return deleted;
  }

  async uploadMedia(file: Express.Multer.File, actor: CurrentUser, ipAddress?: string) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP o SVG y videos MP4 o WEBM');
    }
    const stored = await this.storage.save(file, 'public-site');
    const mediaUrl = `/api/public/media?key=${encodeURIComponent(stored.storageKey)}`;
    const after = { ...stored, mediaUrl, imageUrl: mediaUrl };
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PublicSiteMedia', ipAddress, after });
    return after;
  }

  media(key: string) {
    if (!key.startsWith('public-site/')) throw new BadRequestException('Archivo no permitido');
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    const fullPath = normalize(join(root, key));
    const normalizedRoot = normalize(join(root, 'public-site'));
    if (!fullPath.startsWith(normalizedRoot) || !existsSync(fullPath)) throw new NotFoundException('Archivo no encontrado');
    return createReadStream(fullPath);
  }

  private promotionData(dto: PublicPromotionDto) {
    const { slug, startDate, endDate, ...data } = dto;
    void slug;
    return {
      ...data,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
  }

  private newsData(dto: PublicNewsDto) {
    const { slug, publishedAt, ...data } = dto;
    void slug;
    return {
      ...data,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    };
  }

  private async uniqueSlug(kind: PublicModel, value: string, currentId?: string) {
    const base = this.slugify(value);
    let candidate = base;
    let suffix = 2;
    while (await this.slugExists(kind, candidate, currentId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'contenido';
  }

  private async slugExists(kind: PublicModel, slug: string, currentId?: string) {
    if (kind === 'service') {
      const found = await this.prisma.publicService.findUnique({ where: { slug } });
      return Boolean(found && found.id !== currentId);
    }
    if (kind === 'promotion') {
      const found = await this.prisma.publicPromotion.findUnique({ where: { slug } });
      return Boolean(found && found.id !== currentId);
    }
    if (kind === 'news') {
      const found = await this.prisma.publicNews.findUnique({ where: { slug } });
      return Boolean(found && found.id !== currentId);
    }
    return false;
  }
}
