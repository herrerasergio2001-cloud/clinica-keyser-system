import { ConfigService } from '@nestjs/config';
import { DigitalPrescriptionsService } from './digital-prescriptions.service';

describe('DigitalPrescriptionsService', () => {
  it('generates a valid PDF without requiring a logo or signature file', async () => {
    const prisma = {
      digitalPrescription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rx-1',
          code: 'TD-2026-000001',
          patientName: 'Paciente de prueba',
          patientAge: '35',
          diagnosis: 'Control clínico',
          indications: 'Tomar según indicación médica.',
          medications: ['Medicamento 1, una tableta cada 12 horas'],
          studies: ['Biometría hemática'],
          doctorName: 'Médico Eventual',
          doctorCode: 'MINSA-001',
          doctor: { doctorProfile: null },
          status: 'ACTIVE',
          version: 1,
          createdAt: new Date('2026-06-19T14:30:00.000Z'),
          versions: [],
        }),
      },
      clinicSettings: {
        findFirst: jest.fn().mockResolvedValue({
          clinicName: 'Clínica Keyser',
          address: 'Chinandega, Nicaragua',
          phoneMain: '0000-0000',
          primaryColor: '#1f2f66',
          secondaryColor: '#ef2f32',
        }),
      },
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new DigitalPrescriptionsService(prisma as never, audit as never, config);

    const pdf = await service.pdf('rx-1', {
      sub: 'admin-1',
      email: 'admin@clinicakeyser.com',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(1000);
    expect(audit.record).toHaveBeenCalled();
  });
});
