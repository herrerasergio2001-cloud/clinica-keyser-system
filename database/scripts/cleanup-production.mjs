import { PrismaClient, RoleName, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

const keepAccounts = [
  { email: 'admin@clinickeyser.com', name: 'Admin Clínica Keyser', role: RoleName.SUPER_ADMIN },
  { email: 'recepcion@clinickeyser.com', name: 'Recepción Clínica Keyser', role: RoleName.RECEPTION },
  { email: 'laboratorio@clinickeyser.com', name: 'Laboratorio Clínica Keyser', role: RoleName.LABORATORY },
  { email: 'farmacia@clinickeyser.com', name: 'Farmacia Clínica Keyser', role: RoleName.PHARMACY },
  { email: 'doctor@clinicakeyser.com', name: 'Médico por evento Clínica Keyser', role: RoleName.DOCTOR },
];

const demoPatients = [
  { patientCode: 'CK-000001', fullName: 'Maria Fernanda Lopez', idNumber: '001-010190-0001A' },
  { patientCode: 'CK-000002', fullName: 'Jose Ricardo Martinez', idNumber: '001-050585-0002B' },
];

const demoProductCodes = Array.from({ length: 10 }, (_, index) => `MED-${String(index + 1).padStart(4, '0')}`);
const demoLabTemplates = ['LAB-HEMATOLOGY', 'LAB-BIOCHEMISTRY', 'LAB-URINALYSIS', 'LAB-COPROLOGY'];
const demoPromotionSlugs = ['dia-de-la-madre', 'paquetes-pediatricos', 'campana-ultrasonido', 'campana-laboratorio', 'medicina-estetica'];
const demoNewsSlugs = ['campana-control-presion', 'servicio-muestras-domicilio', 'agenda-ultrasonido'];
const permissionsByRole = {
  [RoleName.SUPER_ADMIN]: ['*'],
  [RoleName.DOCTOR]: ['patients:read', 'patients:update', 'medical-records:*', 'appointments:*', 'reports:read', 'documents:*', 'prescriptions:*'],
  [RoleName.RECEPTION]: ['patients:*', 'medical-records:read', 'attachments:read', 'appointments:*', 'documents:read', 'orders:create'],
  [RoleName.PHARMACY]: ['pharmacy:*', 'inventory:*', 'pos:*'],
  [RoleName.LABORATORY]: ['laboratory:*', 'patients:read'],
};

function quote(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

async function main() {
  if (process.env.CONFIRM_PRODUCTION_CLEANUP !== 'CLINICA_KEYSER_20260619') {
    throw new Error('Defina CONFIRM_PRODUCTION_CLEANUP=CLINICA_KEYSER_20260619 para ejecutar esta limpieza.');
  }

  const users = await prisma.user.findMany({ include: { role: true, doctorProfile: true }, orderBy: { email: 'asc' } });
  const byEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));
  for (const account of keepAccounts) {
    if (!byEmail.has(account.email)) throw new Error(`No existe la cuenta base requerida: ${account.email}`);
  }

  const admin = byEmail.get('admin@clinickeyser.com');
  const doctor = byEmail.get('doctor@clinicakeyser.com');
  const keepEmails = new Set(keepAccounts.map((account) => account.email));
  const removedUsers = users.filter((user) => !keepEmails.has(user.email.toLowerCase()));
  const removedIds = removedUsers.map((user) => user.id);

  const existingDemoPatients = await prisma.patient.findMany({
    where: { patientCode: { in: demoPatients.map((patient) => patient.patientCode) } },
    select: { id: true, patientCode: true, fullName: true, idNumber: true },
  });
  for (const patient of existingDemoPatients) {
    const expected = demoPatients.find((item) => item.patientCode === patient.patientCode);
    if (!expected || patient.fullName !== expected.fullName || patient.idNumber !== expected.idNumber) {
      throw new Error(`Se detuvo la limpieza: ${patient.patientCode} no coincide exactamente con el paciente demo esperado.`);
    }
  }
  const demoPatientIds = existingDemoPatients.map((patient) => patient.id);

  const result = await prisma.$transaction(async (tx) => {
    const roles = await tx.role.findMany({ where: { name: { in: keepAccounts.map((account) => account.role) } } });
    const roleByName = new Map(roles.map((role) => [role.name, role.id]));
    for (const [roleName, permissions] of Object.entries(permissionsByRole)) {
      await tx.role.update({ where: { name: roleName }, data: { permissions } });
    }

    for (const account of keepAccounts) {
      const user = byEmail.get(account.email);
      await tx.user.update({
        where: { id: user.id },
        data: {
          fullName: account.name,
          roleId: roleByName.get(account.role),
          isActive: true,
          disabledAt: null,
          disabledBy: null,
          disableReason: null,
        },
      });
    }

    await tx.doctorProfile.updateMany({ where: { userId: admin.id }, data: { isActive: false } });
    await tx.doctorProfile.upsert({
      where: { userId: doctor.id },
      update: {
        fullName: 'Médico por evento Clínica Keyser',
        specialty: 'Médico por evento',
        isActive: true,
      },
      create: {
        userId: doctor.id,
        fullName: 'Médico por evento Clínica Keyser',
        specialty: 'Médico por evento',
        minsaCode: doctor.doctorProfile?.minsaCode ?? 'PENDIENTE',
        isActive: true,
      },
    });

    await tx.$executeRaw`
      UPDATE "AuditLog" audit
      SET
        "actorName" = COALESCE(audit."actorName", actor."fullName"),
        "actorEmail" = COALESCE(audit."actorEmail", actor.email)
      FROM "User" actor
      WHERE audit."actorId" = actor.id
    `;

    if (removedIds.length) {
      await tx.auditLog.updateMany({ where: { actorId: { in: removedIds } }, data: { actorId: null } });
      await tx.session.deleteMany({ where: { userId: { in: removedIds } } });

      const columns = await tx.$queryRaw`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (
            column_name ILIKE '%userId%'
            OR column_name ILIKE '%doctorId%'
            OR column_name ILIKE '%createdBy%'
            OR column_name ILIKE '%updatedBy%'
            OR column_name ILIKE '%deletedBy%'
            OR column_name ILIKE '%disabledBy%'
            OR column_name ILIKE '%voidedBy%'
            OR column_name ILIKE '%cancelledBy%'
            OR column_name ILIKE '%uploadedBy%'
            OR column_name ILIKE '%validatedBy%'
            OR column_name ILIKE '%reportingDoctorId%'
          )
          AND table_name NOT IN ('User', 'Session', 'AuditLog', 'DoctorProfile')
        ORDER BY table_name, column_name
      `;

      for (const column of columns) {
        const targetId = column.column_name.toLowerCase().includes('doctor') ? doctor.id : admin.id;
        const placeholders = removedIds.map((_, index) => `$${index + 2}`).join(', ');
        await tx.$executeRawUnsafe(
          `UPDATE ${quote(column.table_name)} SET ${quote(column.column_name)} = $1 WHERE ${quote(column.column_name)} IN (${placeholders})`,
          targetId,
          ...removedIds,
        );
      }

      await tx.doctorProfile.deleteMany({ where: { userId: { in: removedIds } } });
      await tx.user.deleteMany({ where: { id: { in: removedIds } } });
    }

    if (demoPatientIds.length) {
      await tx.pharmacySaleItem.deleteMany({ where: { sale: { patientId: { in: demoPatientIds } } } });
      await tx.pharmacySale.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.invoice.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.posSaleItem.deleteMany({ where: { sale: { patientId: { in: demoPatientIds } } } });
      await tx.posSale.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.labResultValue.deleteMany({ where: { result: { patientId: { in: demoPatientIds } } } });
      await tx.labResult.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.laboratoryResult.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.prescriptionItem.deleteMany({ where: { prescription: { patientId: { in: demoPatientIds } } } });
      await tx.prescription.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.labOrderItem.deleteMany({ where: { order: { patientId: { in: demoPatientIds } } } });
      await tx.labOrderExternal.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.labOrder.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.imagingOrder.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.ultrasoundReport.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.pacsStudy.deleteMany({ where: { patientDbId: { in: demoPatientIds } } });
      await tx.ultrasoundOrder.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.medicalCertificate.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.consentDocument.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.clinicalEvent.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.printableDocument.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.appointment.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.fileAttachment.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.patientAttachment.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.clinicalAlert.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.emergencyContact.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.medicalRecord.deleteMany({ where: { patientId: { in: demoPatientIds } } });
      await tx.patient.deleteMany({ where: { id: { in: demoPatientIds } } });
    }

    const demoProducts = await tx.product.findMany({ where: { productCode: { in: demoProductCodes } }, select: { id: true } });
    const productIds = demoProducts.map((product) => product.id);
    if (productIds.length) {
      await tx.pharmacySaleItem.deleteMany({ where: { productId: { in: productIds } } });
      await tx.posSaleItem.deleteMany({ where: { productId: { in: productIds } } });
      await tx.inventoryMovement.deleteMany({ where: { productId: { in: productIds } } });
      await tx.productBatch.deleteMany({ where: { productId: { in: productIds } } });
      await tx.product.deleteMany({ where: { id: { in: productIds } } });
    }

    await tx.labReagent.deleteMany({ where: { id: { startsWith: 'seed-reagent-' } } });
    await tx.labAnalyte.deleteMany({ where: { template: { code: { in: demoLabTemplates } } } });
    await tx.labTemplate.deleteMany({ where: { code: { in: demoLabTemplates } } });
    await tx.laboratoryTest.deleteMany({ where: { code: 'LAB-CBC' } });
    await tx.publicPromotion.deleteMany({ where: { slug: { in: demoPromotionSlugs } } });
    await tx.publicNews.deleteMany({ where: { slug: { in: demoNewsSlugs } } });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        actorName: 'Admin Clínica Keyser',
        actorEmail: 'admin@clinickeyser.com',
        action: AuditAction.DELETE,
        entity: 'ProductionCleanup',
        entityId: '2026-06-19',
        after: {
          removedUsers: removedUsers.map((user) => ({ email: user.email, name: user.fullName, role: user.role.name })),
          removedDemoPatients: existingDemoPatients,
          removedDemoProducts: productIds.length,
          removedDemoLabTemplates: demoLabTemplates,
          reason: 'Limpieza autorizada de cuentas duplicadas y datos de demostración',
        },
      },
    });

    return {
      removedUsers: removedUsers.length,
      removedDemoPatients: demoPatientIds.length,
      removedDemoProducts: productIds.length,
    };
  }, { maxWait: 20_000, timeout: 120_000 });

  const finalUsers = await prisma.user.findMany({
    where: { isActive: true },
    include: { role: true, doctorProfile: true },
    orderBy: { fullName: 'asc' },
  });
  console.log(JSON.stringify({ result, finalUsers: finalUsers.map((user) => ({ name: user.fullName, email: user.email, role: user.role.name, doctorCode: user.doctorProfile?.minsaCode ?? null })) }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
