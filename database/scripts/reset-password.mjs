import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Uso: node database/scripts/reset-password.mjs correo@dominio.com');
  process.exit(1);
}

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.trim();

if (password.length < 12) {
  console.error('La contraseña debe tener al menos 12 caracteres.');
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { email },
      data: { passwordHash, isActive: true, disabledAt: null, disabledBy: null, disableReason: null },
      select: { id: true, email: true },
    });
    await tx.session.updateMany({
      where: { userId: updated.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return updated;
  });
  console.log(`Contraseña actualizada para ${user.email}.`);
} catch {
  console.error('No se encontró el usuario o no fue posible actualizarlo.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
