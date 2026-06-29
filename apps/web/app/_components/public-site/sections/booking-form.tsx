'use client';

import { useState, FormEvent } from 'react';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { SectionLabel } from '../ui/section-label';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type FormStep = 1 | 2 | 3 | 4;

export function BookingForm() {
  const [step, setStep] = useState<FormStep>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    service: '',
    requestedDate: '',
    requestedTime: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientNotes: '',
  });

  const steps = [
    { num: 1, label: 'Servicio' },
    { num: 2, label: 'Fecha y hora' },
    { num: 3, label: 'Tu información' },
    { num: 4, label: 'Confirmación' },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/api/public/booking-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('No se pudo procesar la solicitud');
      }

      setSuccess(true);
      setStep(4);
      setTimeout(() => {
        setStep(1);
        setFormData({
          service: '',
          requestedDate: '',
          requestedTime: '',
          patientName: '',
          patientPhone: '',
          patientEmail: '',
          patientNotes: '',
        });
        setSuccess(false);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  const isStep1Valid = formData.service;
  const isStep2Valid = formData.requestedDate && formData.requestedTime;
  const isStep3Valid = formData.patientName && formData.patientEmail && formData.patientPhone;

  return (
    <section id="reserva" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <SectionLabel>Reserva tu cita</SectionLabel>
        <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-5xl">
          Agenda tu atención
        </h2>

        {success ? (
          <div className="mt-10 rounded-[16px] bg-green-50 border-2 border-green-200 p-8 text-center">
            <div className="flex justify-center mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="font-display text-2xl font-medium text-green-900 mb-2">
              ¡Solicitud enviada!
            </h3>
            <p className="text-green-800">
              Nos pondremos en contacto pronto para confirmar tu cita.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 flex gap-2">
              {steps.map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition ${
                      s.num === step
                        ? 'bg-[#ef2f32] text-white'
                        : s.num < step
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {s.num < step ? <Check className="h-5 w-5" /> : s.num}
                  </div>
                  {s.num < steps.length && (
                    <div
                      className={`h-1 w-8 transition ${
                        s.num < step ? 'bg-green-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              {error && (
                <div className="rounded-[12px] bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    ¿Qué servicio deseas?
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      required
                      className="h-12 rounded-xl border border-slate-200 px-4 text-[#1b2a57] outline-none focus:border-[#ef2f32]"
                    >
                      <option value="">Selecciona un servicio...</option>
                      <option value="Consulta general">Consulta general</option>
                      <option value="Consulta especializada">Consulta especializada</option>
                      <option value="Tratamiento estético">Tratamiento estético</option>
                      <option value="Procedimiento quirúrgico">Procedimiento quirúrgico</option>
                      <option value="Laboratorio">Laboratorio clínico</option>
                    </select>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Fecha
                    <input
                      type="date"
                      value={formData.requestedDate}
                      onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                      required
                      className="h-12 rounded-xl border border-slate-200 px-4 text-[#1b2a57] outline-none focus:border-[#ef2f32]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Hora
                    <input
                      type="time"
                      value={formData.requestedTime}
                      onChange={(e) => setFormData({ ...formData, requestedTime: e.target.value })}
                      required
                      className="h-12 rounded-xl border border-slate-200 px-4 text-[#1b2a57] outline-none focus:border-[#ef2f32]"
                    />
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Nombre completo
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                      className="h-12 rounded-xl border border-slate-200 px-4 text-[#1b2a57] outline-none focus:border-[#ef2f32]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Correo
                    <input
                      type="email"
                      value={formData.patientEmail}
                      onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                      required
                      className="h-12 rounded-xl border border-slate-200 px-4 text-[#1b2a57] outline-none focus:border-[#ef2f32]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Teléfono
                    <input
                      type="tel"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      required
                      className="h-12 rounded-xl border border-slate-200 px-4 text-[#1b2a57] outline-none focus:border-[#ef2f32]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-600">
                    Notas adicionales
                    <textarea
                      value={formData.patientNotes}
                      onChange={(e) => setFormData({ ...formData, patientNotes: e.target.value })}
                      className="h-24 rounded-xl border border-slate-200 px-4 py-3 text-[#1b2a57] outline-none focus:border-[#ef2f32] resize-none"
                      placeholder="Cuéntanos sobre tu situación..."
                    />
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="rounded-[16px] bg-slate-50 p-8 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Servicio</p>
                      <p className="mt-1 text-lg font-medium text-[#1b2a57]">{formData.service}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Fecha y hora</p>
                      <p className="mt-1 text-lg font-medium text-[#1b2a57]">
                        {new Date(formData.requestedDate).toLocaleDateString()} a las {formData.requestedTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Paciente</p>
                      <p className="mt-1 text-lg font-medium text-[#1b2a57]">{formData.patientName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Contacto</p>
                      <p className="mt-1 text-lg font-medium text-[#1b2a57]">{formData.patientEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as FormStep)}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-[12px] font-semibold text-sm bg-slate-100 text-[#1f2f66] hover:bg-slate-200 disabled:opacity-70"
                  >
                    Atrás
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1 && isStep1Valid) setStep(2);
                      else if (step === 2 && isStep2Valid) setStep(3);
                      else if (step === 3 && isStep3Valid) setStep(4);
                    }}
                    disabled={
                      (step === 1 && !isStep1Valid) ||
                      (step === 2 && !isStep2Valid) ||
                      (step === 3 && !isStep3Valid)
                    }
                    className="flex-1 py-3 px-4 rounded-[12px] font-semibold text-sm bg-[#ef2f32] text-white hover:bg-[#d62a2f] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-[12px] font-semibold text-sm bg-[#ef2f32] text-white hover:bg-[#d62a2f] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Confirmar cita
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
