import { Body, Controller, Delete, Get, Header, Ip, Param, Patch, Post, Query, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  PublicFAQDto,
  PublicGalleryImageDto,
  PublicNewsDto,
  PublicPromotionDto,
  PublicServiceDto,
  PublicTeamMemberDto,
  UpdatePublicSettingsDto,
} from './dto/public-site.dto';
import { PublicSiteService } from './public-site.service';

@Controller()
export class PublicSiteController {
  constructor(private readonly publicSite: PublicSiteService) {}

  @Get('public/settings')
  settings() {
    return this.publicSite.settings();
  }

  @Get('public/services')
  services() {
    return this.publicSite.services();
  }

  @Get('public/promotions')
  promotions() {
    return this.publicSite.promotions();
  }

  @Get('public/news')
  news() {
    return this.publicSite.news();
  }

  @Get('public/faqs')
  faqs() {
    return this.publicSite.faqs();
  }

  @Get('public/gallery')
  gallery() {
    return this.publicSite.gallery();
  }

  @Get('public/team')
  team() {
    return this.publicSite.team();
  }

  @Get('public/media')
  @Header('Cache-Control', 'public, max-age=86400')
  media(@Query('key') key: string) {
    return new StreamableFile(this.publicSite.media(key), { type: mediaContentType(key) });
  }
}

function mediaContentType(key: string) {
  const extension = key.toLowerCase().split('.').pop();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'svg') return 'image/svg+xml';
  if (extension === 'mp4') return 'video/mp4';
  if (extension === 'webm') return 'video/webm';
  return 'image/jpeg';
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/public')
export class AdminPublicSiteController {
  constructor(private readonly publicSite: PublicSiteService) {}

  @Get()
  @Permissions('*')
  content() {
    return this.publicSite.adminContent();
  }

  @Patch('settings')
  @Permissions('*')
  updateSettings(@Body() dto: UpdatePublicSettingsDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updateSettings(dto, user, ipAddress);
  }

  @Post('upload')
  @Permissions('*')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.uploadMedia(file, user, ipAddress);
  }

  @Post('services')
  @Permissions('*')
  createService(@Body() dto: PublicServiceDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.createService(dto, user, ipAddress);
  }

  @Patch('services/:id')
  @Permissions('*')
  updateService(@Param('id') id: string, @Body() dto: PublicServiceDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updateService(id, dto, user, ipAddress);
  }

  @Delete('services/:id')
  @Permissions('*')
  deleteService(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.delete('service', id, user, ipAddress);
  }

  @Post('promotions')
  @Permissions('*')
  createPromotion(@Body() dto: PublicPromotionDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.createPromotion(dto, user, ipAddress);
  }

  @Patch('promotions/:id')
  @Permissions('*')
  updatePromotion(@Param('id') id: string, @Body() dto: PublicPromotionDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updatePromotion(id, dto, user, ipAddress);
  }

  @Delete('promotions/:id')
  @Permissions('*')
  deletePromotion(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.delete('promotion', id, user, ipAddress);
  }

  @Post('news')
  @Permissions('*')
  createNews(@Body() dto: PublicNewsDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.createNews(dto, user, ipAddress);
  }

  @Patch('news/:id')
  @Permissions('*')
  updateNews(@Param('id') id: string, @Body() dto: PublicNewsDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updateNews(id, dto, user, ipAddress);
  }

  @Delete('news/:id')
  @Permissions('*')
  deleteNews(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.delete('news', id, user, ipAddress);
  }

  @Post('faqs')
  @Permissions('*')
  createFaq(@Body() dto: PublicFAQDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.createFaq(dto, user, ipAddress);
  }

  @Patch('faqs/:id')
  @Permissions('*')
  updateFaq(@Param('id') id: string, @Body() dto: PublicFAQDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updateFaq(id, dto, user, ipAddress);
  }

  @Delete('faqs/:id')
  @Permissions('*')
  deleteFaq(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.delete('faq', id, user, ipAddress);
  }

  @Post('gallery')
  @Permissions('*')
  createGalleryImage(@Body() dto: PublicGalleryImageDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.createGalleryImage(dto, user, ipAddress);
  }

  @Patch('gallery/:id')
  @Permissions('*')
  updateGalleryImage(@Param('id') id: string, @Body() dto: PublicGalleryImageDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updateGalleryImage(id, dto, user, ipAddress);
  }

  @Delete('gallery/:id')
  @Permissions('*')
  deleteGalleryImage(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.delete('gallery', id, user, ipAddress);
  }

  @Post('team')
  @Permissions('*')
  createTeamMember(@Body() dto: PublicTeamMemberDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.createTeamMember(dto, user, ipAddress);
  }

  @Patch('team/:id')
  @Permissions('*')
  updateTeamMember(@Param('id') id: string, @Body() dto: PublicTeamMemberDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.updateTeamMember(id, dto, user, ipAddress);
  }

  @Delete('team/:id')
  @Permissions('*')
  deleteTeamMember(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.publicSite.delete('team', id, user, ipAddress);
  }
}
