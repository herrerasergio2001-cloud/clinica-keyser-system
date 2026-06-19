export const samplePatient = {
  id: '',
  fullName: 'Paciente',
  patientCode: 'Sin código',
  age: 'Edad no registrada',
  sex: 'No registrado',
  birthDate: '',
  idNumber: '',
  phone: '',
  address: '',
  occupation: '',
  emergencyContact: '',
  bloodType: '',
  allergies: '',
  chronicDiseases: '',
};

export const sampleRecord = {
  id: '',
  recordNumber: 'Pendiente',
  consultationDate: new Date().toISOString().slice(0, 10),
  status: 'Borrador',
  reasonForVisit: '',
  chiefComplaint: '',
  currentIllness: '',
  diagnosis: '',
  icd10: '',
  plan: '',
};

export const tabs = [
  'Datos del paciente',
  'Historia clinica',
  'Signos vitales',
  'Examen fisico',
  'Diagnosticos',
  'Tratamiento',
  'Evolucion',
  'Archivos adjuntos',
];
