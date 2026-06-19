# Clinica Keyser ERP / EMR

Sistema modular para Clinica Keyser con API NestJS, frontend Next.js, PostgreSQL, Prisma y base RIS/PACS para ultrasonido.

## Requisitos

- Node.js 22 o compatible
- npm
- Docker Desktop o Docker Engine con Docker Compose

## Configuracion Inicial

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables de entorno:

```bash
cp .env.example .env
```

3. Levantar PostgreSQL:

```bash
npm run db:up
```

4. Validar y generar Prisma:

```bash
npm run prisma:validate
npm run prisma:generate
```

5. Recrear base local, aplicar migraciones y cargar datos iniciales:

```bash
npm run prisma:reset
npm run seed
```

6. Iniciar backend y frontend:

```bash
npm run dev
```

## URLs Locales

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- PostgreSQL: localhost:5432

## Acceso inicial

El seed no publica ni reutiliza contraseñas de prueba. Para crear el administrador
inicial debe definir `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` antes de ejecutar el seed. En una
instalación existente, restablezca la contraseña mediante el script seguro
`database/scripts/reset-password.mjs`.

## Scripts

- `npm run db:up`: levanta solo PostgreSQL con Docker Compose.
- `npm run db:down`: detiene los servicios de Docker Compose.
- `npm run prisma:validate`: valida `database/prisma/schema.prisma`.
- `npm run prisma:generate`: genera el cliente Prisma.
- `npm run prisma:migrate`: aplica migraciones en modo desarrollo.
- `npm run prisma:deploy`: aplica migraciones en modo despliegue.
- `npm run prisma:reset`: resetea la base local y aplica todas las migraciones.
- `npm run seed`: carga datos iniciales idempotentes.
- `npm run dev`: inicia API y web juntos.
- `npm run build`: compila API y web.

## Docker Compose

El servicio `postgres` usa:

- Base de datos: `clinic_keyser`
- Usuario: `clinic`
- Password: valor fuerte definido en `.env` o en Coolify
- Puerto local: solo en desarrollo
- Volumen persistente: `postgres_data`

Cuando el API corre fuera de Docker usa:

```env
DATABASE_URL=postgresql://clinic:<password-local>@localhost:5432/clinic_keyser?schema=public
```

Cuando el API corre dentro de Docker Compose, `docker-compose.yml` sobrescribe `DATABASE_URL` para usar el host interno:

```env
DATABASE_URL=postgresql://clinic:<password-docker>@postgres:5432/clinic_keyser?schema=public
```

## RIS/PACS

Orthanc/DICOM no forma parte del despliegue activo de producción. Los archivos en
`docker/orthanc/` se conservan únicamente como referencia histórica o para pruebas
locales futuras. No exponga puertos DICOM públicamente sin una revisión de red y
autenticación específica.

## Producción

Ver `docs/production-audit.md` para arquitectura de despliegue, respaldos,
recuperación ante fallos, dominios y checklist operativo.

## Verificacion Recomendada

```bash
npm install
docker compose up -d postgres
npx prisma validate --schema=./database/prisma/schema.prisma
npx prisma generate --schema=./database/prisma/schema.prisma
npx prisma migrate reset --schema=./database/prisma/schema.prisma --force
npm run seed
npm run dev
```

Si `migrate reset` no es conveniente en un ambiente con datos reales, use:

```bash
npx prisma migrate deploy --schema=./database/prisma/schema.prisma
npm run seed
```

## Notas de Migraciones

La migracion `20260521142931_safe_delete_final` es defensiva: verifica que existan columnas como `status`, `isDeleted` o `isActive` antes de crear indices. Esto permite reconstruir la base desde cero aunque esas columnas se agreguen en una migracion posterior.
