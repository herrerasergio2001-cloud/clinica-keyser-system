import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  it('generates sequential patient codes', async () => {
    const repository = {
      findDuplicateCandidates: jest.fn().mockResolvedValue([]),
      nextPatientCode: jest.fn().mockResolvedValue('CK-000008'),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'p1', ...data })),
    };
    const service = new PatientsService(repository as never, { record: jest.fn() } as never, { get: jest.fn() } as never, {} as never);

    const patient = await service.create({
      fullName: 'Test Patient',
      birthDate: '1990-01-01',
      gender: 'FEMALE',
    } as never);

    expect(patient.patientCode).toBe('CK-000008');
    expect(patient.patientId).toBe('CK-000008');
    expect(patient.expediente).toBe('CK-000008');
  });
});
