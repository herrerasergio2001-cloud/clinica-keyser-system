import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePublicSettingsDto {
  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  slogan?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @IsOptional()
  @IsString()
  heroVideoUrl?: string;

  @IsOptional()
  @IsString()
  institutionalText?: string;

  @IsOptional()
  @IsString()
  institutionalImageUrl?: string;

  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @IsOptional()
  @IsString()
  aestheticPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsString()
  mapEmbedUrl?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @IsOptional()
  @IsString()
  aestheticFacebookUrl?: string;

  @IsOptional()
  @IsString()
  aestheticInstagramUrl?: string;

  @IsOptional()
  @IsString()
  aestheticTiktokUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;
}

export class PublicContentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PublicServiceDto extends PublicContentDto {
  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  whatsappText?: string;
}

export class PublicPromotionDto extends PublicContentDto {
  @IsOptional()
  @IsString()
  whatsappText?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class PublicNewsDto extends PublicContentDto {
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export class PublicFAQDto {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PublicGalleryImageDto {
  @IsString()
  title!: string;

  @IsString()
  altText!: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PublicTeamMemberDto {
  @IsString()
  name!: string;

  @IsString()
  specialty!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PublicTestimonialDto {
  id!: string;

  quote!: string;

  patientName!: string;

  service!: string;

  rating!: number;

  photoUrl?: string;
}

export class PublicPricingPlanDto {
  id!: string;

  name!: string;

  kicker!: string;

  description!: string;

  price!: string;

  currency!: string;

  unit!: string;

  category!: string;

  features!: string[];

  isFeatured!: boolean;
}

export class PublicProcedureDto {
  id!: string;

  name!: string;

  description!: string;

  specialty!: string;

  icon?: string;

  imageUrl?: string;
}

export class CreatePublicBookingRequestDto {
  @IsString()
  service!: string;

  @IsDateString()
  requestedDate!: string;

  @IsOptional()
  @IsString()
  requestedTime?: string;

  @IsString()
  patientName!: string;

  @IsString()
  patientPhone!: string;

  @IsEmail()
  patientEmail!: string;

  @IsOptional()
  @IsString()
  patientNotes?: string;
}

export class PublicBookingRequestResponseDto {
  id!: string;

  status!: string;

  respondedAt?: Date;

  responseNotes?: string;
}
