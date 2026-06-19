import { PrismaClient, RoleName, Gender, InventoryMovementType, MedicalRecordStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissionsByRole: Record<RoleName, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['reports:*', 'patients:read', 'appointments:read'],
  DOCTOR: ['patients:read', 'patients:update', 'medical-records:*', 'appointments:*', 'reports:read', 'documents:*', 'prescriptions:*'],
  ASSISTANT: ['patients:read', 'medical-records:read', 'attachments:read', 'appointments:*'],
  RECEPTION: ['patients:*', 'medical-records:read', 'attachments:read', 'appointments:*', 'documents:read'],
  CASHIER: ['pos:*', 'billing:*', 'patients:read'],
  PHARMACY: ['pharmacy:*', 'inventory:*', 'pos:*'],
  LABORATORY: ['laboratory:*', 'patients:read'],
  ACCOUNTING: ['accounting:*', 'billing:read', 'reports:*'],
};

async function main() {
  const roles = await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: { permissions: permissionsByRole[name] },
        create: {
          name,
          description: name.replaceAll('_', ' ').toLowerCase(),
          permissions: permissionsByRole[name],
        },
      }),
    ),
  );

  const roleByName = new Map(roles.map((role) => [role.name, role]));
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedAdminEmail || !seedAdminPassword) {
    throw new Error('Defina SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD para crear el administrador inicial.');
  }

  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Administrador Clínica Keyser';
  const adminPasswordHash = await bcrypt.hash(seedAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    update: { fullName: adminName, roleId: roleByName.get(RoleName.SUPER_ADMIN)!.id },
    create: {
      email: seedAdminEmail,
      fullName: adminName,
      passwordHash: adminPasswordHash,
      roleId: roleByName.get(RoleName.SUPER_ADMIN)!.id,
    },
  });
  const doctor = admin;
  const superAdmin = admin;
  const sergio = admin;

  await prisma.doctorProfile.upsert({
    where: { userId: admin.id },
    update: {
      fullName: adminName,
      specialty: process.env.SEED_ADMIN_SPECIALTY ?? 'Medicina general',
      minsaCode: process.env.SEED_ADMIN_MINSA_CODE ?? null,
      phone: process.env.SEED_ADMIN_PHONE ?? null,
      isActive: true,
    },
    create: {
      userId: admin.id,
      fullName: adminName,
      specialty: process.env.SEED_ADMIN_SPECIALTY ?? 'Medicina general',
      minsaCode: process.env.SEED_ADMIN_MINSA_CODE ?? null,
      phone: process.env.SEED_ADMIN_PHONE ?? null,
      isActive: true,
    },
  });

  await prisma.clinicSettings.upsert({
    where: { id: 'clinic-keyser-settings' },
    update: {
      clinicName: 'Clínica Keyser',
      logoUrl: '/clinica-keyser-logo.jpg',
      printLogoUrl: '/clinica-keyser-logo.jpg',
      primaryColor: '#1f2f66',
      secondaryColor: '#ef2f32',
      accentColor: '#087f8c',
      address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua',
      phoneMain: '8495-2200',
      phoneAesthetic: '7650-7993',
      whatsapp: '50584952200',
      schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
    },
    create: {
      id: 'clinic-keyser-settings',
      clinicName: 'Clínica Keyser',
      logoUrl: '/clinica-keyser-logo.jpg',
      printLogoUrl: '/clinica-keyser-logo.jpg',
      primaryColor: '#1f2f66',
      secondaryColor: '#ef2f32',
      accentColor: '#087f8c',
      address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua',
      phoneMain: '8495-2200',
      phoneAesthetic: '7650-7993',
      whatsapp: '50584952200',
      schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
    },
  });

  const categories = await Promise.all(
    [
      ['Medicina general', '#0f766e', 'stethoscope'],
      ['Pediatria', '#2563eb', 'baby'],
      ['Ginecologia', '#db2777', 'venus'],
      ['Estetica', '#7c3aed', 'sparkles'],
      ['Ultrasonido', '#0891b2', 'scan'],
      ['Psicologia', '#16a34a', 'brain'],
      ['Cardiologia', '#dc2626', 'heart-pulse'],
      ['Cirugia', '#ea580c', 'scissors'],
      ['Laboratorio', '#4f46e5', 'flask-conical'],
    ].map(([name, color, icon]) =>
      prisma.patientCategory.upsert({
        where: { name },
        update: { color, icon },
        create: { name, color, icon },
      }),
    ),
  );
  const generalMedicine = categories.find((category) => category.name === 'Medicina general')!;
  const ultrasound = categories.find((category) => category.name === 'Ultrasonido')!;

  const maria = await prisma.patient.upsert({
    where: { patientCode: 'CK-000001' },
    update: {
      patientId: 'CK-000001',
      expediente: 'CK-000001',
      occupation: 'Comerciante',
      city: 'Managua',
      clinicalStatus: 'Seguimiento',
      categoryId: generalMedicine.id,
      assignedDoctorId: doctor.id,
    },
    create: {
      patientId: 'CK-000001',
      expediente: 'CK-000001',
      patientCode: 'CK-000001',
      fullName: 'Maria Fernanda Lopez',
      idNumber: '001-010190-0001A',
      birthDate: new Date('1990-01-01'),
      gender: Gender.FEMALE,
      phone: '+505 8888 1111',
      email: 'maria@example.com',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      occupation: 'Comerciante',
      civilStatus: 'Casada',
      emergencyContact: 'Carlos Lopez +505 8888 2222',
      allergies: 'Penicilina',
      bloodType: 'O+',
      chronicDiseases: 'Hipertension',
      currentMedications: 'Losartan 50 mg diario',
      clinicalStatus: 'Seguimiento',
      categoryId: generalMedicine.id,
      assignedDoctorId: doctor.id,
    },
  });

  await prisma.patient.upsert({
    where: { patientCode: 'CK-000002' },
    update: {
      patientId: 'CK-000002',
      expediente: 'CK-000002',
      city: 'Masaya',
      categoryId: ultrasound.id,
      assignedDoctorId: doctor.id,
    },
    create: {
      patientId: 'CK-000002',
      expediente: 'CK-000002',
      patientCode: 'CK-000002',
      fullName: 'Jose Ricardo Martinez',
      idNumber: '001-050585-0002B',
      birthDate: new Date('1985-05-05'),
      gender: Gender.MALE,
      phone: '+505 8777 3333',
      address: 'Masaya, Nicaragua',
      city: 'Masaya',
      emergencyContact: 'Lucia Martinez +505 8777 4444',
      bloodType: 'A+',
      categoryId: ultrasound.id,
      assignedDoctorId: doctor.id,
    },
  });

  await prisma.clinicalAlert.upsert({
    where: { id: 'seed-alert-maria-allergy' },
    update: {},
    create: {
      id: 'seed-alert-maria-allergy',
      patientId: maria.id,
      type: 'ALLERGY',
      title: 'Alergia importante: penicilina',
      severity: 'HIGH',
    },
  });

  await prisma.emergencyContact.upsert({
    where: { id: 'seed-emergency-maria-carlos' },
    update: { phone: '+505 8888 2222' },
    create: {
      id: 'seed-emergency-maria-carlos',
      patientId: maria.id,
      fullName: 'Carlos Lopez',
      relationship: 'Esposo',
      phone: '+505 8888 2222',
      isPrimary: true,
    },
  });

  await prisma.counter.upsert({
    where: { key: 'patient_code' },
    update: { value: 2 },
    create: { key: 'patient_code', value: 2 },
  });

  const record = await prisma.medicalRecord.upsert({
    where: { recordNumber: 'EXP-000001' },
    update: {},
    create: {
      patientId: maria.id,
      doctorId: doctor.id,
      recordNumber: 'EXP-000001',
      consultationDate: new Date('2026-05-18T09:00:00.000Z'),
      reasonForVisit: 'Control de hipertension y cefalea ocasional.',
      chiefComplaint: 'Dolor de cabeza intermitente desde hace tres dias.',
      currentIllness: 'Paciente refiere cefalea frontal leve, sin fiebre, sin vomitos, con cifras tensionales elevadas en casa.',
      personalPathologicalHistory: 'Hipertension arterial diagnosticada hace 3 anos.',
      personalNonPathologicalHistory: 'Niega tabaco. Consumo ocasional de cafe.',
      surgicalHistory: 'Cesarea en 2015.',
      traumaticHistory: 'Niega traumatismos relevantes.',
      allergicHistory: 'Alergia a penicilina.',
      gynecologicalObstetricHistory: 'G2P2A0. FUR no recordada.',
      familyHistory: 'Madre con diabetes mellitus tipo 2.',
      toxicHabits: 'Cafe ocasional. Niega tabaco y alcohol.',
      currentMedications: 'Losartan 50 mg diario.',
      reviewOfSystems: 'Niega dolor toracico, disnea, edema o sintomas neurologicos focales.',
      diagnosisText: 'Hipertension arterial en seguimiento. Cefalea tensional probable.',
      treatmentPlan: 'Ajustar adherencia terapeutica, control de presion arterial y seguimiento.',
      recommendations: 'Dieta baja en sal, actividad fisica moderada y registro de presion arterial.',
      nextAppointmentDate: new Date('2026-06-18T09:00:00.000Z'),
      status: MedicalRecordStatus.COMPLETED,
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
      clinicalHistory: {
        create: {
          patientId: maria.id,
          doctorId: doctor.id,
          personalPathologicalHistory: 'Hipertension arterial diagnosticada hace 3 anos.',
          personalNonPathologicalHistory: 'Niega tabaco. Consumo ocasional de cafe.',
          surgicalHistory: 'Cesarea en 2015.',
          traumaticHistory: 'Niega traumatismos relevantes.',
          allergicHistory: 'Alergia a penicilina.',
          gynecologicalObstetricHistory: 'G2P2A0. FUR no recordada.',
          familyHistory: 'Madre con diabetes mellitus tipo 2.',
          toxicHabits: 'Cafe ocasional. Niega tabaco y alcohol.',
          currentMedications: 'Losartan 50 mg diario.',
          reviewOfSystems: 'Niega dolor toracico, disnea, edema o sintomas neurologicos focales.',
          createdById: superAdmin.id,
          updatedById: superAdmin.id,
        },
      },
      vitalSigns: {
        create: {
          patientId: maria.id,
          doctorId: doctor.id,
          bloodPressure: '145/90',
          heartRate: 82,
          respiratoryRate: 18,
          temperature: 36.7,
          oxygenSaturation: 98,
          weight: 72.5,
          height: 1.62,
          bmi: 27.62,
          glucose: 96,
          createdById: superAdmin.id,
          updatedById: superAdmin.id,
        },
      },
      physicalExam: {
        create: {
          patientId: maria.id,
          doctorId: doctor.id,
          generalAppearance: 'Paciente alerta, orientada, hidratada, sin dificultad respiratoria.',
          heent: 'Pupilas isocoricas, mucosas hidratadas, orofaringe sin exudados.',
          headAndNeck: 'Normocefala, pupilas isocoricas, cuello sin adenopatias.',
          cardiovascular: 'Ruidos cardiacos ritmicos, sin soplos.',
          respiratory: 'Murmullo vesicular conservado, sin estertores.',
          cardiopulmonary: 'Ruidos cardiacos ritmicos, murmullo vesicular conservado.',
          abdomen: 'Blando, depresible, no doloroso.',
          musculoskeletal: 'Movilidad conservada.',
          neurological: 'Sin deficit neurologico focal.',
          skin: 'Sin lesiones agudas.',
          extremities: 'Sin edema.',
          otherFindings: 'Sin otros hallazgos.',
          createdById: superAdmin.id,
          updatedById: superAdmin.id,
        },
      },
      diagnoses: {
        create: [
          {
            patientId: maria.id,
            doctorId: doctor.id,
            mainDiagnosis: 'Hipertension esencial primaria',
            secondaryDiagnoses: 'Cefalea tensional',
            icd10Code: 'I10',
            clinicalImpression: 'Presion arterial no controlada probablemente por adherencia irregular.',
            differentialDiagnosis: 'Migraña, sinusitis, cefalea secundaria.',
            createdById: superAdmin.id,
            updatedById: superAdmin.id,
          },
        ],
      },
      prescriptions: {
        create: [
          {
            patientId: maria.id,
            doctorId: doctor.id,
            medicationName: 'Losartan',
            dose: '50 mg',
            route: 'VO',
            frequency: 'Cada 12 horas',
            duration: '30 dias',
            instructions: 'Tomar con agua, mantener registro de presion arterial.',
            nonPharmacologicalRecommendations: 'Reducir sal, caminar 30 minutos 5 veces por semana.',
            requestedLabTests: 'Creatinina, potasio, perfil lipidico.',
            requestedImagingStudies: 'No requerido por ahora.',
            referral: 'Control con medicina interna si persiste PA elevada.',
            createdById: superAdmin.id,
            updatedById: superAdmin.id,
          },
        ],
      },
      evolutionNotes: {
        create: [
          {
            patientId: maria.id,
            doctorId: doctor.id,
            noteDate: new Date('2026-05-18T09:30:00.000Z'),
            subjective: 'Refiere mejoria parcial tras reposo.',
            objective: 'PA 140/88, sin signos de alarma.',
            assessment: 'Hipertension en ajuste terapeutico.',
            plan: 'Continuar tratamiento, control en 4 semanas.',
            doctorName: 'Doctor Sergio Herrera',
            createdById: superAdmin.id,
            updatedById: superAdmin.id,
          },
        ],
      },
    },
  });

  await prisma.counter.upsert({
    where: { key: 'medical_record_number' },
    update: { value: 1 },
    create: { key: 'medical_record_number', value: record.recordNumber === 'EXP-000001' ? 1 : 0 },
  });

  await prisma.vaccineRecord.upsert({
    where: { id: 'seed-vaccine-maria-influenza' },
    update: {},
    create: {
      id: 'seed-vaccine-maria-influenza',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      vaccineName: 'Influenza',
      appliedAt: new Date('2026-05-18T10:00:00.000Z'),
      nextDoseAt: new Date('2027-05-18T10:00:00.000Z'),
      lotNumber: 'VAC-2026-001',
      observations: 'Aplicada sin reacciones inmediatas.',
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });

  await prisma.bodyMapFinding.upsert({
    where: { id: 'seed-body-maria-thorax' },
    update: {},
    create: {
      id: 'seed-body-maria-thorax',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      view: 'anterior',
      region: 'Tórax',
      description: 'Sin dolor torácico actual. Auscultación sin hallazgos agregados.',
      hasPain: false,
      hasInflammation: false,
      hasLesion: false,
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });

  await prisma.dentalFinding.upsert({
    where: { id: 'seed-dental-maria-11' },
    update: {},
    create: {
      id: 'seed-dental-maria-11',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      toothNumber: '11',
      status: 'Sano',
      description: 'Pieza sin lesión visible.',
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });

  await prisma.labOrder.upsert({
    where: { id: 'seed-lab-maria-profile' },
    update: {},
    create: {
      id: 'seed-lab-maria-profile',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      orderType: 'Perfil lipídico, creatinina y potasio',
      reason: 'Control de hipertensión arterial.',
      priority: 'ROUTINE',
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });

  await prisma.imagingOrder.upsert({
    where: { id: 'seed-image-maria-eco' },
    update: {},
    create: {
      id: 'seed-image-maria-eco',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      studyType: 'Ultrasonido abdominal',
      reason: 'Dolor abdominal ocasional a correlacionar si persiste.',
      priority: 'ROUTINE',
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });

  const pharmacyProducts = [
    ['MED-0001', '7401000000010', 'Acetaminofen 500mg', 'Acetaminofen', 'Caja 100 tabletas', '500 mg', 'Tableta', 'Analgesicos', 'Laboratorios Demo', 'Distribuidora Medica', 'tableta', 250, 40, 0.08, 0.15, 10, 0.12],
    ['MED-0002', '7401000000027', 'Ibuprofeno 400mg', 'Ibuprofeno', 'Caja 50 tabletas', '400 mg', 'Tableta', 'Antiinflamatorios', 'Farma Centro', 'Distribuidora Medica', 'tableta', 120, 30, 0.1, 0.22, 10, 0.18],
    ['MED-0003', '7401000000034', 'Amoxicilina 500mg', 'Amoxicilina', 'Caja 21 capsulas', '500 mg', 'Capsula', 'Antibioticos', 'Laboratorios Demo', 'Proveedor Norte', 'capsula', 80, 25, 0.18, 0.35, 12, 0.3],
    ['MED-0004', '7401000000041', 'Loratadina 10mg', 'Loratadina', 'Caja 100 tabletas', '10 mg', 'Tableta', 'Antialergicos', 'Farma Centro', 'Proveedor Norte', 'tableta', 200, 35, 0.05, 0.12, 20, 0.1],
    ['MED-0005', '7401000000058', 'Omeprazol 20mg', 'Omeprazol', 'Caja 30 capsulas', '20 mg', 'Capsula', 'Gastrointestinal', 'MedPharma', 'Distribuidora Salud', 'capsula', 160, 30, 0.09, 0.2, 15, 0.16],
    ['MED-0006', '7401000000065', 'Metformina 850mg', 'Metformina', 'Caja 30 tabletas', '850 mg', 'Tableta', 'Antidiabeticos', 'MedPharma', 'Distribuidora Salud', 'tableta', 90, 25, 0.07, 0.18, 15, 0.14],
    ['MED-0007', '7401000000072', 'Losartan 50mg', 'Losartan potasico', 'Caja 30 tabletas', '50 mg', 'Tableta', 'Antihipertensivos', 'CardioLab', 'Distribuidora Medica', 'tableta', 140, 30, 0.08, 0.19, 15, 0.15],
    ['MED-0008', '7401000000089', 'Salbutamol inhalador', 'Salbutamol', 'Inhalador 200 dosis', '100 mcg/dosis', 'Inhalador', 'Respiratorio', 'RespiraLab', 'Proveedor Norte', 'unidad', 28, 8, 4.5, 7.5, 6, 6.8],
    ['MED-0009', '7401000000096', 'Suero oral', 'Sales de rehidratacion oral', 'Sobre', '20.5 g', 'Polvo', 'Hidratacion', 'Laboratorios Demo', 'Distribuidora Salud', 'sobre', 220, 40, 0.12, 0.25, 25, 0.2],
    ['MED-0010', '7401000000102', 'Diclofenac gel', 'Diclofenac sodico', 'Tubo 30 g', '1%', 'Gel', 'Topicos', 'Farma Centro', 'Distribuidora Medica', 'unidad', 45, 12, 1.2, 2.5, 6, 2.1],
  ] as const;

  const products = [];
  for (const [productCode, barcode, name, activeIngredient, presentation, concentration, pharmaceuticalForm, category, manufacturer, supplier, unit, quantity, minimumStock, costPrice, salePrice, wholesaleMinQuantity, wholesalePrice] of pharmacyProducts) {
    products.push(
      await prisma.product.upsert({
        where: { productCode },
        update: { barcode, name, activeIngredient, presentation, concentration, pharmaceuticalForm, category, manufacturer, supplier, unit, quantity, minimumStock, costPrice, salePrice, wholesaleMinQuantity, wholesalePrice, status: 'ACTIVE' },
        create: { productCode, barcode, name, activeIngredient, presentation, concentration, pharmaceuticalForm, category, manufacturer, supplier, unit, quantity, minimumStock, costPrice, salePrice, wholesaleMinQuantity, wholesalePrice, status: 'ACTIVE' },
      }),
    );
  }

  const productByCode = new Map(products.map((product) => [product.productCode, product]));
  const batches = [
    ['seed-batch-med-0001-a', 'MED-0001', 'LOT-ACT-001', '2026-06-30', 120, 120, 0.08, 0.15, 'Distribuidora Medica', 'Lote proximo a vencer para alerta de 60 dias.'],
    ['seed-batch-med-0002-a', 'MED-0002', 'LOT-IBU-001', '2026-07-20', 60, 60, 0.1, 0.22, 'Distribuidora Medica', 'Rotacion FEFO.'],
    ['seed-batch-med-0003-a', 'MED-0003', 'LOT-AMX-001', '2026-08-15', 50, 50, 0.18, 0.35, 'Proveedor Norte', 'Controlar alergias antes de dispensar.'],
    ['seed-batch-med-0008-a', 'MED-0008', 'LOT-SAL-001', '2026-09-10', 20, 20, 4.5, 7.5, 'Proveedor Norte', 'Inventario critico respiratorio.'],
    ['seed-batch-med-0010-a', 'MED-0010', 'LOT-DIC-001', '2026-11-30', 25, 25, 1.2, 2.5, 'Distribuidora Medica', 'Lote demo.'],
  ] as const;

  for (const [id, productCode, batchNumber, expiresAt, initialQuantity, availableQuantity, costPrice, salePrice, supplier, observations] of batches) {
    const product = productByCode.get(productCode)!;
    const batch = await prisma.productBatch.upsert({
      where: { id },
      update: { productId: product.id, batchNumber, expiresAt: new Date(expiresAt), initialQuantity, availableQuantity, costPrice, salePrice, supplier, observations },
      create: { id, productId: product.id, batchNumber, expiresAt: new Date(expiresAt), initialQuantity, availableQuantity, costPrice, salePrice, supplier, observations },
    });
    await prisma.inventoryMovement.upsert({
      where: { id: `seed-move-${id}` },
      update: { productId: product.id, batchId: batch.id, quantity: availableQuantity, unitCost: costPrice, stockAfter: availableQuantity },
      create: {
        id: `seed-move-${id}`,
        productId: product.id,
        batchId: batch.id,
        type: InventoryMovementType.PURCHASE,
        quantity: availableQuantity,
        unitCost: costPrice,
        reason: 'Inventario inicial demo',
        reference: 'SEED',
        stockBefore: 0,
        stockAfter: availableQuantity,
        createdById: superAdmin.id,
      },
    });
  }

  const labTemplates = [
    {
      code: 'LAB-HEMATOLOGY',
      name: 'Biometria hematica',
      category: 'Hematologia',
      description: 'Plantilla base para biometria hematica completa.',
      analytes: [
        ['Hemoglobina', 'HGB', 'g/dL', 12, 17.5],
        ['Hematocrito', 'HCT', '%', 36, 52],
        ['Eritrocitos', 'RBC', '10^6/uL', 4.2, 5.9],
        ['Leucocitos', 'WBC', '10^3/uL', 4, 10],
        ['Plaquetas', 'PLT', '10^3/uL', 150, 450],
        ['Neutrofilos', 'NEU', '%', 40, 70],
        ['Linfocitos', 'LYM', '%', 20, 45],
        ['Monocitos', 'MON', '%', 2, 10],
        ['Eosinofilos', 'EOS', '%', 1, 6],
        ['Basofilos', 'BAS', '%', 0, 2],
        ['VCM', 'MCV', 'fL', 80, 100],
        ['HCM', 'MCH', 'pg', 27, 33],
        ['CHCM', 'MCHC', 'g/dL', 32, 36],
        ['RDW', 'RDW', '%', 11.5, 14.5],
      ],
    },
    {
      code: 'LAB-BIOCHEMISTRY',
      name: 'Bioquimica sanguinea',
      category: 'Bioquimica',
      description: 'Glucosa, funcion renal, lipidos y perfil hepatico basico.',
      analytes: [
        ['Glucosa', 'GLU', 'mg/dL', 70, 100],
        ['Urea', 'UREA', 'mg/dL', 15, 45],
        ['Creatinina', 'CREA', 'mg/dL', 0.6, 1.3],
        ['Acido urico', 'URIC', 'mg/dL', 3.4, 7],
        ['Colesterol total', 'CHOL', 'mg/dL', 0, 200],
        ['HDL', 'HDL', 'mg/dL', 40, 90],
        ['LDL', 'LDL', 'mg/dL', 0, 130],
        ['Trigliceridos', 'TRI', 'mg/dL', 0, 150],
        ['AST/TGO', 'AST', 'U/L', 0, 40],
        ['ALT/TGP', 'ALT', 'U/L', 0, 41],
        ['Bilirrubina total', 'BT', 'mg/dL', 0.2, 1.2],
        ['Bilirrubina directa', 'BD', 'mg/dL', 0, 0.3],
        ['Bilirrubina indirecta', 'BI', 'mg/dL', 0.1, 0.9],
        ['Proteinas totales', 'PROT', 'g/dL', 6, 8.3],
        ['Albumina', 'ALB', 'g/dL', 3.5, 5.2],
      ],
    },
    {
      code: 'LAB-URINALYSIS',
      name: 'Uroanalisis',
      category: 'Uroanalisis',
      description: 'Examen fisico, quimico y microscopico de orina.',
      analytes: [
        ['Color', 'COLOR', '', null, null, 'Amarillo claro'],
        ['Aspecto', 'ASPECT', '', null, null, 'Transparente'],
        ['Densidad', 'DENS', '', 1.005, 1.03],
        ['pH', 'PH', '', 5, 8],
        ['Proteinas', 'PRO', '', null, null, 'Negativo'],
        ['Glucosa', 'UGLU', '', null, null, 'Negativo'],
        ['Cetonas', 'KET', '', null, null, 'Negativo'],
        ['Bilirrubina', 'UBIL', '', null, null, 'Negativo'],
        ['Urobilinogeno', 'URO', '', null, null, 'Normal'],
        ['Nitritos', 'NIT', '', null, null, 'Negativo'],
        ['Leucocitos', 'ULEU', 'campo', 0, 5],
        ['Eritrocitos', 'URBC', 'campo', 0, 3],
        ['Celulas epiteliales', 'EPI', 'campo', 0, 5],
        ['Bacterias', 'BAC', '', null, null, 'Ausentes'],
        ['Cristales', 'CRY', '', null, null, 'Ausentes'],
        ['Cilindros', 'CYL', '', null, null, 'Ausentes'],
      ],
    },
    {
      code: 'LAB-COPROLOGY',
      name: 'Coprologia',
      category: 'Coprologia',
      description: 'Examen coproparasitoscopico simple.',
      analytes: [
        ['Color', 'SCOLOR', '', null, null, 'Cafe'],
        ['Consistencia', 'CONS', '', null, null, 'Formada'],
        ['Moco', 'MUC', '', null, null, 'Negativo'],
        ['Sangre', 'BLOOD', '', null, null, 'Negativo'],
        ['Restos alimenticios', 'FOOD', '', null, null, 'Escasos'],
        ['Parasitos', 'PAR', '', null, null, 'No se observan'],
        ['Huevos', 'EGG', '', null, null, 'No se observan'],
        ['Quistes', 'CYST', '', null, null, 'No se observan'],
        ['Leucocitos', 'SLEU', 'campo', 0, 5],
        ['Eritrocitos', 'SRBC', 'campo', 0, 3],
        ['Flora bacteriana', 'FLORA', '', null, null, 'Normal'],
      ],
    },
  ];

  for (const templateData of labTemplates) {
    const template = await prisma.labTemplate.upsert({
      where: { code: templateData.code },
      update: { name: templateData.name, category: templateData.category, description: templateData.description, isActive: true },
      create: { code: templateData.code, name: templateData.name, category: templateData.category, description: templateData.description, isActive: true },
    });
    for (const [index, analyte] of templateData.analytes.entries()) {
      const [name, code, unit, referenceMin, referenceMax, referenceText] = analyte;
      await prisma.labAnalyte.upsert({
        where: { id: `seed-analyte-${templateData.code}-${code}` },
        update: { templateId: template.id, name, code, unit, referenceMin, referenceMax, referenceText: referenceText ?? null, sortOrder: index + 1 },
        create: { id: `seed-analyte-${templateData.code}-${code}`, templateId: template.id, name, code, unit, referenceMin, referenceMax, referenceText: referenceText ?? null, sortOrder: index + 1 },
      });
    }
  }

  const reagents = [
    ['seed-reagent-hgb', 'Reactivo hemoglobina', 'Sysmex', 'Frasco 500 ml', 'REAG-HGB-001', '2026-07-30', 4, 'frasco', 'Analizador hematologia', 'Biometria hematica', 2, 'Vigilar consumo semanal.'],
    ['seed-reagent-diluent', 'Diluyente hematologico', 'Sysmex', 'Galon 20 L', 'REAG-DIL-002', '2026-08-20', 3, 'galon', 'Analizador hematologia', 'Biometria hematica', 2, 'Inventario demo.'],
    ['seed-reagent-glucose', 'Reactivo glucosa', 'BioSystems', 'Kit 4x50 ml', 'REAG-GLU-003', '2026-06-25', 2, 'kit', 'Quimica sanguinea', 'Glucosa', 2, 'Proximo a vencer.'],
    ['seed-reagent-crea', 'Reactivo creatinina', 'BioSystems', 'Kit 2x50 ml', 'REAG-CREA-004', '2026-10-15', 5, 'kit', 'Quimica sanguinea', 'Creatinina', 2, 'Stock suficiente.'],
    ['seed-reagent-urine', 'Tiras reactivas orina', 'Combur', 'Frasco 100 tiras', 'REAG-URI-005', '2026-09-05', 1, 'frasco', 'Manual', 'Uroanalisis', 2, 'Bajo stock.'],
  ] as const;

  for (const [id, name, brand, presentation, batchNumber, expiresAt, quantity, unit, equipment, associatedTest, minimumStock, observations] of reagents) {
    const reagent = await prisma.labReagent.upsert({
      where: { id },
      update: { name, brand, presentation, batchNumber, expiresAt: new Date(expiresAt), quantity, unit, equipment, associatedTest, minimumStock, observations },
      create: { id, name, brand, presentation, batchNumber, expiresAt: new Date(expiresAt), quantity, unit, equipment, associatedTest, minimumStock, observations },
    });
    await prisma.labReagentMovement.upsert({
      where: { id: `seed-reagent-move-${id}` },
      update: { quantity },
      create: { id: `seed-reagent-move-${id}`, reagentId: reagent.id, type: 'ENTRY', quantity, observation: 'Inventario inicial demo', createdById: superAdmin.id },
    });
  }

  const hematologyTemplate = await prisma.labTemplate.findUniqueOrThrow({ where: { code: 'LAB-HEMATOLOGY' }, include: { analytes: true } });
  const chemistryTemplate = await prisma.labTemplate.findUniqueOrThrow({ where: { code: 'LAB-BIOCHEMISTRY' }, include: { analytes: true } });
  const labOrderCbc = await prisma.labOrder.upsert({
    where: { id: 'seed-lab-order-cbc-maria' },
    update: { status: 'COMPLETED' },
    create: {
      id: 'seed-lab-order-cbc-maria',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      orderType: 'Biometria hematica',
      reason: 'Control general y seguimiento de hipertension.',
      priority: 'NORMAL',
      status: 'COMPLETED',
      observations: 'Paciente en ayunas.',
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });
  const labOrderChemistry = await prisma.labOrder.upsert({
    where: { id: 'seed-lab-order-chemistry-maria' },
    update: { status: 'COMPLETED' },
    create: {
      id: 'seed-lab-order-chemistry-maria',
      medicalRecordId: record.id,
      patientId: maria.id,
      doctorId: doctor.id,
      orderType: 'Bioquimica sanguinea',
      reason: 'Evaluacion metabolica y renal.',
      priority: 'URGENT',
      status: 'COMPLETED',
      observations: 'Procesar creatinina y glucosa con prioridad.',
      createdById: superAdmin.id,
      updatedById: superAdmin.id,
    },
  });

  const demoResults = [
    {
      id: 'seed-result-cbc-maria',
      orderId: labOrderCbc.id,
      template: hematologyTemplate,
      observations: 'Biometria sin datos criticos.',
      values: { HGB: '13.4', HCT: '40', RBC: '4.5', WBC: '7.2', PLT: '260', NEU: '58', LYM: '33', MON: '6', EOS: '2', BAS: '1', MCV: '88', MCH: '30', MCHC: '34', RDW: '13' },
    },
    {
      id: 'seed-result-chemistry-maria',
      orderId: labOrderChemistry.id,
      template: chemistryTemplate,
      observations: 'Glucosa discretamente elevada; correlacionar clinicamente.',
      values: { GLU: '108', UREA: '28', CREA: '0.8', URIC: '4.9', CHOL: '196', HDL: '48', LDL: '118', TRI: '142', AST: '24', ALT: '27', BT: '0.7', BD: '0.2', BI: '0.5', PROT: '7.2', ALB: '4.3' },
    },
  ];

  for (const item of demoResults) {
    const result = await prisma.labResult.upsert({
      where: { id: item.id },
      update: { orderId: item.orderId, status: 'VALIDATED', observations: item.observations, validatedById: superAdmin.id },
      create: { id: item.id, orderId: item.orderId, patientId: maria.id, templateId: item.template.id, medicalRecordId: record.id, status: 'VALIDATED', observations: item.observations, validatedById: superAdmin.id, createdById: superAdmin.id },
    });
    await prisma.labResultValue.deleteMany({ where: { resultId: result.id } });
    await prisma.labResultValue.createMany({
      data: item.template.analytes.map((analyte) => {
        const value = item.values[analyte.code as keyof typeof item.values] ?? '';
        const numericValue = Number(value);
        const flag = Number.isFinite(numericValue) && analyte.referenceMax !== null && numericValue > Number(analyte.referenceMax) ? 'HIGH' : Number.isFinite(numericValue) && analyte.referenceMin !== null && numericValue < Number(analyte.referenceMin) ? 'LOW' : 'NORMAL';
        return { resultId: result.id, analyteId: analyte.id, value, numericValue: Number.isFinite(numericValue) ? numericValue : null, flag, unit: analyte.unit, reference: analyte.referenceText ?? (analyte.referenceMin !== null && analyte.referenceMax !== null ? `${analyte.referenceMin} - ${analyte.referenceMax}` : null) };
      }),
    });
  }

  await prisma.laboratoryTest.upsert({
    where: { code: 'LAB-CBC' },
    update: {},
    create: {
      code: 'LAB-CBC',
      name: 'Biometria Hematica Completa',
      category: 'Hematology',
      price: 12,
      template: {
        fields: [
          { key: 'wbc', label: 'WBC', unit: '10^3/uL', min: 4, max: 10 },
          { key: 'rbc', label: 'RBC', unit: '10^6/uL', min: 4.2, max: 5.9 },
          { key: 'hgb', label: 'Hemoglobin', unit: 'g/dL', min: 12, max: 17.5 },
          { key: 'plt', label: 'Platelets', unit: '10^3/uL', min: 150, max: 450 },
        ],
      },
    },
  });

  await prisma.publicSiteSettings.upsert({
    where: { id: 'clinic-keyser-public-settings' },
    update: {
      clinicName: 'Clínica Keyser',
      slogan: 'Atención médica integral en Chinandega.',
      logoUrl: '/clinic-media/logo.png',
      heroImageUrl: '/clinic-media/fachada.jpg',
      institutionalText: 'Cuidamos de cada paciente con atención cercana, criterio médico y el respaldo de un equipo comprometido con su bienestar.',
      institutionalImageUrl: '/clinic-media/consulta-medica.jpg',
      primaryPhone: '8495-2200',
      aestheticPhone: '7650-7993',
      whatsapp: '50584952200',
      address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.',
      schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
      instagramUrl: 'https://www.instagram.com/clinicakeyser',
      aestheticTiktokUrl: 'https://www.tiktok.com/@centro_estetico_keyser',
      primaryColor: '#1f2f66',
      secondaryColor: '#ef2f32',
      accentColor: '#087f8c',
    },
    create: {
      id: 'clinic-keyser-public-settings',
      clinicName: 'Clínica Keyser',
      slogan: 'Atención médica integral en Chinandega.',
      logoUrl: '/clinic-media/logo.png',
      heroImageUrl: '/clinic-media/fachada.jpg',
      institutionalText: 'Cuidamos de cada paciente con atención cercana, criterio médico y el respaldo de un equipo comprometido con su bienestar.',
      institutionalImageUrl: '/clinic-media/consulta-medica.jpg',
      primaryPhone: '8495-2200',
      aestheticPhone: '7650-7993',
      whatsapp: '50584952200',
      address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.',
      schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
      instagramUrl: 'https://www.instagram.com/clinicakeyser',
      aestheticTiktokUrl: 'https://www.tiktok.com/@centro_estetico_keyser',
      primaryColor: '#1f2f66',
      secondaryColor: '#ef2f32',
      accentColor: '#087f8c',
    },
  });

  const publicServices = [
    ['medicina-general', 'Medicina General', 'Atención médica integral para toda la familia.', 'Evaluación clínica, prevención y seguimiento personalizado.', 'stethoscope', 'Consulta'],
    ['medicina-interna', 'Medicina Interna', 'Valoración integral del paciente adulto.', 'Diagnóstico y seguimiento de condiciones médicas complejas.', 'activity', 'Especialidad'],
    ['ginecologia', 'Ginecología', 'Cuidado integral de la salud femenina.', 'Consulta, prevención y seguimiento ginecológico.', 'venus', 'Especialidad'],
    ['neurologia-pediatrica', 'Neurología Pediátrica', 'Atención especializada para niñas, niños y adolescentes.', 'Valoración neurológica pediátrica con enfoque familiar.', 'brain', 'Especialidad'],
    ['cirugia', 'Cirugía', 'Valoración quirúrgica y seguimiento clínico.', 'Evaluación y orientación según criterio médico.', 'scissors', 'Especialidad'],
    ['ortopedia', 'Ortopedia', 'Evaluación de dolor, lesiones y movilidad.', 'Atención de condiciones musculoesqueléticas.', 'bone', 'Especialidad'],
    ['odontologia', 'Odontología', 'Prevención y atención integral de la salud bucal.', 'Valoración y tratamientos odontológicos.', 'tooth', 'Especialidad'],
    ['psicologia', 'Psicología', 'Acompañamiento profesional para el bienestar emocional.', 'Atención psicológica personalizada.', 'brain', 'Salud mental'],
    ['cardiologia', 'Cardiología', 'Evaluación y seguimiento de la salud cardiovascular.', 'Consulta y apoyo diagnóstico cardiovascular.', 'heart-pulse', 'Especialidad'],
    ['ultrasonido', 'Ultrasonidos', 'Estudios de imagen con atención profesional.', 'Ultrasonidos realizados con criterio clínico y atención cercana.', 'scan', 'Diagnóstico'],
    ['sistema-orion', 'Sistema Orión', 'Gestión segura del expediente clínico.', 'Tecnología para organizar y proteger la información médica.', 'shield', 'Tecnología'],
  ] as const;

  await prisma.publicService.updateMany({
    where: { slug: { notIn: publicServices.map(([slug]) => slug) } },
    data: { isActive: false },
  });

  for (const [index, service] of publicServices.entries()) {
    const [slug, title, description, content, icon, category] = service;
    await prisma.publicService.upsert({
      where: { slug },
      update: { title, description, content, icon, category, isActive: true, sortOrder: index + 1 },
      create: { slug, title, description, content, icon, category, isActive: true, sortOrder: index + 1, whatsappText: `Hola Clínica Keyser, quisiera información sobre ${title}.` },
    });
  }

  const galleryImages = [
    ['keyser-gallery-facade', 'Fachada', 'Fachada principal de Clínica Keyser', '/clinic-media/fachada.jpg', 'Fachada'],
    ['keyser-gallery-reception', 'Recepción principal', 'Recepción y área de espera de Clínica Keyser', '/clinic-media/recepcion-principal.jpg', 'Recepción'],
    ['keyser-gallery-consultation', 'Consulta médica', 'Atención médica personalizada en Clínica Keyser', '/clinic-media/consulta-medica.jpg', 'Consultorios'],
    ['keyser-gallery-waiting', 'Área de espera', 'Área de espera de Clínica Keyser', '/clinic-media/sala-espera.jpg', 'Área de espera'],
    ['keyser-gallery-specialties', 'Área de especialidades', 'Pasillo de consultorios y atención especializada', '/clinic-media/pasillo-laboratorio.jpg', 'Atención especializada'],
    ['keyser-gallery-corridor', 'Instalaciones', 'Instalaciones interiores de Clínica Keyser', '/clinic-media/area-espera.jpg', 'Instalaciones'],
  ] as const;

  for (const [index, image] of galleryImages.entries()) {
    const [id, title, altText, imageUrl, category] = image;
    await prisma.publicGalleryImage.upsert({
      where: { id },
      update: { title, altText, imageUrl, category, isActive: true, sortOrder: index + 1 },
      create: { id, title, altText, imageUrl, category, isActive: true, sortOrder: index + 1 },
    });
  }

  await prisma.publicTeamMember.upsert({
    where: { id: 'keyser-team-medical' },
    update: {
      name: 'Equipo médico Clínica Keyser',
      specialty: 'Atención integral y especialidades médicas',
      description: 'Profesionales comprometidos con una atención cercana, ética y personalizada.',
      imageUrl: '/clinic-media/consulta-medica.jpg',
      isActive: true,
      sortOrder: 1,
    },
    create: {
      id: 'keyser-team-medical',
      name: 'Equipo médico Clínica Keyser',
      specialty: 'Atención integral y especialidades médicas',
      description: 'Profesionales comprometidos con una atención cercana, ética y personalizada.',
      imageUrl: '/clinic-media/consulta-medica.jpg',
      isActive: true,
      sortOrder: 1,
    },
  });

  const publicPromotions = [
    ['dia-de-la-madre', 'Promociones del Día de la Madre', 'Campañas especiales para cuidar la salud de mamá.', 'Promoción demo administrable desde el panel privado.', 'Campañas', '2026-05-01', '2026-05-31'],
    ['paquetes-pediatricos', 'Paquetes pediátricos', 'Controles y orientación para niñas y niños.', 'Paquete demo con valoración clínica y seguimiento.', 'Pediatría', '2026-05-01', '2026-08-31'],
    ['campana-ultrasonido', 'Campañas de ultrasonido', 'Fechas especiales para estudios de ultrasonido.', 'Campaña demo para agenda por WhatsApp.', 'Ultrasonido', '2026-05-01', '2026-12-31'],
    ['campana-laboratorio', 'Campañas de laboratorio', 'Paquetes de laboratorio para chequeo general.', 'Campaña demo de exámenes básicos.', 'Laboratorio', '2026-05-01', '2026-12-31'],
    ['medicina-estetica', 'Medicina estética', 'Valoraciones y campañas de cuidado facial.', 'Promoción demo para centro estético.', 'Estética', '2026-05-01', '2026-12-31'],
  ] as const;

  for (const [index, promotion] of publicPromotions.entries()) {
    const [slug, title, description, content, category, startDate, endDate] = promotion;
    await prisma.publicPromotion.upsert({
      where: { slug },
      update: { title, description, content, category, startDate: new Date(startDate), endDate: new Date(endDate), isActive: true, sortOrder: index + 1 },
      create: { slug, title, description, content, category, startDate: new Date(startDate), endDate: new Date(endDate), isActive: true, sortOrder: index + 1, whatsappText: `Hola Clínica Keyser, deseo información sobre ${title}.` },
    });
  }

  const publicNews = [
    ['campana-control-presion', 'Campaña de control de presión arterial', 'Recomendamos controles periódicos para pacientes con hipertensión o factores de riesgo.', 'Prevención'],
    ['servicio-muestras-domicilio', 'Toma de muestras a domicilio', 'Clínica Keyser coordina toma de muestras para pacientes que necesitan atención en casa.', 'Laboratorio'],
    ['agenda-ultrasonido', 'Agenda de ultrasonido disponible', 'Puede solicitar información por WhatsApp para coordinar su estudio.', 'Ultrasonido'],
  ] as const;

  for (const [index, news] of publicNews.entries()) {
    const [slug, title, description, category] = news;
    await prisma.publicNews.upsert({
      where: { slug },
      update: { title, description, category, isActive: true, publishedAt: new Date(Date.UTC(2026, 4, 1 + index)) },
      create: { slug, title, description, category, content: description, isActive: true, publishedAt: new Date(Date.UTC(2026, 4, 1 + index)) },
    });
  }

  const publicFaqs = [
    ['¿Necesito cita previa?', 'Recomendamos agendar por WhatsApp para confirmar disponibilidad del servicio y horario.'],
    ['¿Realizan ultrasonidos?', 'Sí. Puede solicitar información por WhatsApp para confirmar el tipo de ultrasonido y disponibilidad.'],
    ['¿Tienen laboratorio?', 'Sí. Contamos con laboratorio clínico y toma de muestras para exámenes frecuentes.'],
    ['¿Aceptan tarjeta?', 'Puede consultar métodos de pago disponibles directamente con recepción al momento de agendar.'],
    ['¿Dónde están ubicados?', 'Estamos de Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.'],
    ['¿Tienen atención pediátrica?', 'Sí. Tenemos atención pediátrica y seguimiento para niñas y niños.'],
    ['¿Realizan servicios a domicilio?', 'Sí. Coordinamos servicios a domicilio para toma de muestras según disponibilidad.'],
  ] as const;

  for (const [index, faq] of publicFaqs.entries()) {
    const [question, answer] = faq;
    await prisma.publicFAQ.upsert({
      where: { id: `seed-public-faq-${index + 1}` },
      update: { question, answer, isActive: true, sortOrder: index + 1 },
      create: { id: `seed-public-faq-${index + 1}`, question, answer, isActive: true, sortOrder: index + 1, category: 'General' },
    });
  }

  const documentTemplates = [
    ['PRESCRIPTION', 'Receta médica', 'Plantilla institucional para receta médica'],
    ['LAB_ORDER_EXTERNAL', 'Orden de laboratorio externa', 'Plantilla para exámenes de laboratorio externos'],
    ['IMAGING_ORDER', 'Orden de imagen', 'Plantilla para ultrasonido, rayos X y otros estudios'],
    ['MEDICAL_HISTORY', 'Historia clínica imprimible', 'Formato limpio de expediente clínico'],
    ['CERTIFICATE', 'Certificado médico', 'Certificado, constancia, incapacidad, informe o referencia'],
  ] as const;

  for (const [type, name, description] of documentTemplates) {
    await prisma.documentTemplate.upsert({
      where: { id: `seed-template-${type}` },
      update: { name, description, type, isActive: true },
      create: { id: `seed-template-${type}`, type, name, description, isActive: true },
    });
  }

  const printable = await prisma.printableDocument.upsert({
    where: { id: 'seed-printable-prescription-maria' },
    update: { doctorId: sergio.id, patientId: maria.id, medicalRecordId: record.id },
    create: {
      id: 'seed-printable-prescription-maria',
      type: 'PRESCRIPTION',
      title: 'Receta médica demo',
      patientId: maria.id,
      doctorId: sergio.id,
      medicalRecordId: record.id,
      createdById: sergio.id,
    },
  });

  const prescription = await prisma.prescription.upsert({
    where: { id: 'seed-prescription-sergio-maria' },
    update: {
      patientId: maria.id,
      doctorId: sergio.id,
      medicalRecordId: record.id,
      prescriptionNumber: 'RX-000001',
      diagnosis: 'Hipertensión arterial en seguimiento',
      recommendationsGeneral: 'Control de presión arterial, dieta baja en sal y seguimiento según indicación médica.',
      printableDocumentId: printable.id,
    },
    create: {
      id: 'seed-prescription-sergio-maria',
      patientId: maria.id,
      doctorId: sergio.id,
      medicalRecordId: record.id,
      prescriptionNumber: 'RX-000001',
      diagnosis: 'Hipertensión arterial en seguimiento',
      medicationName: 'Losartán',
      concentration: '50 mg',
      presentation: 'Tableta',
      dose: '1 tableta',
      route: 'Vía oral',
      frequency: 'Cada 12 horas',
      duration: '30 días',
      instructions: 'Tomar con agua. Registrar presión arterial.',
      recommendationsGeneral: 'Control de presión arterial, dieta baja en sal y seguimiento según indicación médica.',
      printableDocumentId: printable.id,
      createdById: sergio.id,
      updatedById: sergio.id,
    },
  });

  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: prescription.id } });
  await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescription.id,
      medicationName: 'Losartán',
      concentration: '50 mg',
      presentation: 'Tableta',
      dose: '1 tableta',
      route: 'Vía oral',
      frequency: 'Cada 12 horas',
      duration: '30 días',
      instructions: 'Tomar con agua. Registrar presión arterial.',
      sortOrder: 1,
    },
  });

  await prisma.dicomConfiguration.upsert({
    where: { id: 'dicom-default' },
    update: {
      orthancUrl: process.env.ORTHANC_URL ?? 'http://192.168.0.36:8042',
      orthancDicomPort: Number(process.env.ORTHANC_DICOM_PORT ?? 4242),
      orthancAet: process.env.ORTHANC_AET ?? 'ORTHANC',
      orthancUser: process.env.ORTHANC_USER ?? null,
      orthancPassword: process.env.ORTHANC_PASSWORD ?? null,
      sonoscapeAet: process.env.SONOSCAPE_AET ?? null,
      worklistDirectory: process.env.WORKLIST_DIRECTORY ?? null,
      ohifUrl: process.env.OHIF_URL ?? null,
      integrationEnabled: process.env.DICOM_INTEGRATION_ENABLED === 'true',
      updatedBy: superAdmin.id,
    },
    create: {
      id: 'dicom-default',
      orthancUrl: process.env.ORTHANC_URL ?? 'http://192.168.0.36:8042',
      orthancDicomPort: Number(process.env.ORTHANC_DICOM_PORT ?? 4242),
      orthancAet: process.env.ORTHANC_AET ?? 'ORTHANC',
      orthancUser: process.env.ORTHANC_USER ?? null,
      orthancPassword: process.env.ORTHANC_PASSWORD ?? null,
      sonoscapeAet: process.env.SONOSCAPE_AET ?? null,
      worklistDirectory: process.env.WORKLIST_DIRECTORY ?? null,
      ohifUrl: process.env.OHIF_URL ?? null,
      integrationEnabled: process.env.DICOM_INTEGRATION_ENABLED === 'true',
      updatedBy: superAdmin.id,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
