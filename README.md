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
- Orthanc local: http://localhost:8042
- Orthanc red local: http://192.168.0.19:8042
- PostgreSQL: localhost:5432

## Credenciales Iniciales

El seed crea estos usuarios principales:

- Administrador RIS/PACS: `admin@clinickeyser.com` / `admin123`
- Medico: `medico@clinickeyser.com` / `medico123`
- Recepcion: `recepcion@clinickeyser.com` / `recepcion123`
- Farmacia: `farmacia@clinickeyser.com` / `farmacia123`
- Laboratorio: `laboratorio@clinickeyser.com` / `laboratorio123`

Los usuarios demo heredados usan `Password123!`.

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
- Password: `clinic`
- Puerto local: `5432`
- Volumen persistente: `postgres_data`

Cuando el API corre fuera de Docker usa:

```env
DATABASE_URL=postgresql://clinic:clinic@localhost:5432/clinic_keyser?schema=public
```

Cuando el API corre dentro de Docker Compose, `docker-compose.yml` sobrescribe `DATABASE_URL` para usar el host interno:

```env
DATABASE_URL=postgresql://clinic:clinic@postgres:5432/clinic_keyser?schema=public
```

## RIS/PACS

El seed crea una configuracion DICOM inicial en la tabla `DicomConfiguration`. Puede ajustarse desde variables de entorno antes de correr `npm run seed`:

```env
ORTHANC_URL=http://192.168.0.19:8042
ORTHANC_DICOM_PORT=4242
ORTHANC_AET=ORTHANC
ORTHANC_USER=admin
ORTHANC_PASSWORD=1234
SONOSCAPE_AET=SONOSCAPE
WORKLIST_DIRECTORY=./docker/orthanc/worklists
OHIF_URL=
DICOM_INTEGRATION_ENABLED=false
```

No se recomienda guardar contrasenas reales en el repositorio. Use `.env` local o variables del entorno de despliegue.

## Configuracion SonoScape PACS

En el SonoScape, configure el PACS de almacenamiento asi:

- Service Type: `Almacenamiento`
- Service Name: `ORTHANC`
- AE Title PACS: `ORTHANC`
- IP servidor: `192.168.0.19`
- Puerto DICOM: `4242`
- Puerto web Orthanc: `8042`
- URL Orthanc: http://192.168.0.19:8042

Orthanc se levanta desde Docker Compose con:

- Web HTTP: `8042:8042`
- DICOM: `4242:4242`
- AE Title: `ORTHANC`
- `DicomAlwaysAllowEcho`: `true`
- `DicomCheckCalledAet`: `false`
- `DicomCheckModalityHost`: `false`

La configuracion esta en `docker/orthanc/orthanc.json`. Si conoce la IP real del SonoScape, reemplace `IP_DEL_ULTRASONIDO` en:

```json
"SONOSCAPE": ["SONOSCAPE", "IP_DEL_ULTRASONIDO", 104]
```

Luego reinicie Orthanc:

```bash
docker compose restart orthanc
```

Para revisar estado y logs:

```bash
docker compose config
docker compose ps
docker logs clinica-keyser-orthanc --tail=100
```

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
