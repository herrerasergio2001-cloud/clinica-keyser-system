import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { StorageModule } from './shared/storage/storage.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { PublicSiteModule } from './modules/public-site/public-site.module';
import { ClinicalDocumentsModule } from './modules/clinical-documents/clinical-documents.module';
import { DigitalPrescriptionsModule } from './modules/digital-prescriptions/digital-prescriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: seconds(1), limit: 10 },
      { name: 'medium', ttl: seconds(60), limit: 100 },
    ]),
    PrismaModule,
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    MedicalRecordsModule,
    PharmacyModule,
    LaboratoryModule,
    PublicSiteModule,
    ClinicalDocumentsModule,
    DigitalPrescriptionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
