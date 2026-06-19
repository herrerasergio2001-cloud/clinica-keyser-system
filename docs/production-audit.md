# Auditoría de producción — Clínica Keyser

Fecha de última actualización: 2026-06-19.

## Resumen ejecutivo

El sistema productivo de Clínica Keyser está desplegado en el VPS Hostinger `2.24.194.76` mediante Coolify y Docker Compose. La aplicación no depende de la computadora local: los contenedores, la base de datos y los volúmenes persistentes residen en el VPS.

Servicios activos definitivos:

- `web`: Next.js, publicado en `https://clinicakeyser.com` y `https://www.clinicakeyser.com`.
- `api`: NestJS, publicado en `https://api.clinicakeyser.com`.
- `postgres`: PostgreSQL 16 Alpine, interno y sin exposición pública.

Servicios no activos en producción:

- Orthanc/DICOM. El directorio `docker/orthanc/` queda como referencia histórica/local, pero no forma parte del `docker-compose.yml` productivo.

## URLs

- URL principal pública: `https://clinicakeyser.com`
- URL alternativa pública: `https://www.clinicakeyser.com`
- URL administrativa: `https://clinicakeyser.com/login`
- API pública: `https://api.clinicakeyser.com/api`
- Coolify: `http://2.24.194.76:8000`

## Dominio, proxy y SSL

Coolify genera las labels de Traefik para:

- `clinicakeyser.com`
- `www.clinicakeyser.com`
- `api.clinicakeyser.com`

Traefik/Coolify administra HTTPS y la renovación automática de certificados Let's Encrypt. Los puertos públicos requeridos son:

- `80/tcp`
- `443/tcp`

No se debe publicar PostgreSQL ni puertos DICOM a Internet.

Última verificación desde el VPS:

| Dominio | Emisor | Expira |
|---|---|---|
| `clinicakeyser.com` | Let's Encrypt YR2 | 2026-09-16 16:13:51 UTC |
| `www.clinicakeyser.com` | Let's Encrypt YR2 | 2026-09-16 16:13:49 UTC |
| `api.clinicakeyser.com` | Let's Encrypt YR1 | 2026-09-16 01:38:12 UTC |

Respuestas verificadas:

- `https://clinicakeyser.com/` → `200`
- `https://www.clinicakeyser.com/` → `200`
- `https://clinicakeyser.com/login` → `200`
- `https://clinicakeyser.com/pacientes` sin sesión → `307` hacia `/login?next=/pacientes`
- `https://api.clinicakeyser.com/api` → `404` esperado para raíz API sin endpoint

## Seguridad de acceso

El login no debe mostrar credenciales, correos de prueba ni contraseñas demo. La página pública `/` es informativa y el acceso administrativo queda en `/login`.

Las rutas internas están protegidas por middleware:

- `/panel`
- `/pacientes`
- `/expediente`
- `/recetas`
- `/usuarios`
- `/configuracion/*`
- `/farmacia/*`
- `/laboratorio/*`
- `/citas`

La autenticación emite cookies:

- `ck_access_token`: `HttpOnly`, `Secure`, `SameSite=Lax`, vida aproximada 15 minutos.
- `ck_refresh_token`: `HttpOnly`, `Secure`, `SameSite=Lax`, vida aproximada 7 días.

Las contraseñas se guardan con bcrypt costo 12. El script `database/scripts/reset-password.mjs` restablece contraseñas sin imprimirlas ni guardarlas en el repositorio.

## Base de datos

Motor:

- PostgreSQL 16 Alpine.

Ubicación:

- Contenedor Docker `postgres-*` en el VPS Hostinger `2.24.194.76`.
- Volumen persistente Docker `postgres_data`.

Conectividad:

- La API usa `postgres:5432` dentro de la red Docker.
- PostgreSQL no está expuesto públicamente.

Persistencia:

- Los datos sobreviven a reinicios y redespliegues mientras se conserve el volumen `postgres_data`.

Última verificación de datos:

- Usuarios activos: 5.
- Pacientes demo: 0.
- Productos demo: 0.
- Plantillas de laboratorio demo: 0.
- Migraciones Prisma aplicadas: 6.
- Última limpieza controlada: 19 de junio de 2026.

## Almacenamiento de archivos

La API usa almacenamiento local en:

- Contenedor: `/app/storage`
- Volumen Docker: `api_storage`

Este volumen debe incluirse en respaldos cuando haya adjuntos clínicos.

## Respaldo automático

Script incluido:

```bash
scripts/backup-production.sh
```

Uso recomendado en el VPS:

```bash
chmod +x scripts/backup-production.sh
BACKUP_ROOT=/var/backups/clinic-keyser ./scripts/backup-production.sh
```

Programación sugerida con cron:

```cron
15 2 * * * cd /path/al/repositorio && BACKUP_ROOT=/var/backups/clinic-keyser ./scripts/backup-production.sh >> /var/log/clinic-keyser-backup.log 2>&1
```

El script crea:

- Dump PostgreSQL en formato custom.
- Copia de `/app/storage` si existe.
- Inventario de contenedores y volúmenes.
- SHA256 del dump.

Retención por defecto:

- 14 días.

Recomendación: sincronizar `/var/backups/clinic-keyser` a almacenamiento externo cifrado o snapshot del proveedor.

## Recuperación ante fallos

1. Levantar infraestructura base con Coolify/Docker Compose.
2. Confirmar que los contenedores estén detenidos o que la base destino esté vacía.
3. Restaurar dump:

```bash
POSTGRES_CONTAINER="$(docker ps --filter name=postgres-e1dt2fi2dfqvc9dd67bs120q -q | head -n 1)"
docker exec -i "$POSTGRES_CONTAINER" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl' < clinic_keyser_YYYYMMDDTHHMMSSZ.dump
```

4. Restaurar archivos:

```bash
API_CONTAINER="$(docker ps --filter name=api-e1dt2fi2dfqvc9dd67bs120q -q | head -n 1)"
docker cp api_storage "$API_CONTAINER:/app/storage"
```

5. Redesplegar desde Coolify.
6. Verificar:

```bash
curl -I https://clinicakeyser.com
curl -I https://api.clinicakeyser.com/api
```

## Variables obligatorias de producción

Definir en Coolify:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_API_URL=https://api.clinicakeyser.com`
- `CORS_ORIGIN=https://clinicakeyser.com,https://www.clinicakeyser.com`
- `AUTH_COOKIE_DOMAIN=.clinicakeyser.com`

Para inicializar una base nueva:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- Opcionales: `SEED_ADMIN_NAME`, `SEED_ADMIN_SPECIALTY`, `SEED_ADMIN_MINSA_CODE`, `SEED_ADMIN_PHONE`

## GitHub

Repositorio activo:

- `herrerasergio2001-cloud/clinica-keyser-system`

Rama activa:

- `main`

Coolify despliega automáticamente desde `main`.

## Checklist operativo

Ver estado de contenedores:

```bash
docker ps --format '{{.Names}} {{.Status}}'
```

Ver logs:

```bash
docker logs --tail 200 coolify-proxy
docker logs --tail 200 "$(docker ps --filter name=api-e1dt2fi2dfqvc9dd67bs120q -q | head -n 1)"
docker logs --tail 200 "$(docker ps --filter name=web-e1dt2fi2dfqvc9dd67bs120q -q | head -n 1)"
```

Verificar base:

```bash
POSTGRES_CONTAINER="$(docker ps --filter name=postgres-e1dt2fi2dfqvc9dd67bs120q -q | head -n 1)"
docker exec "$POSTGRES_CONTAINER" sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Restablecer contraseña:

```bash
read -s -p "Nueva contraseña: " NEW_PASSWORD; echo
API_CONTAINER="$(docker ps --filter name=api-e1dt2fi2dfqvc9dd67bs120q -q | head -n 1)"
printf '%s' "$NEW_PASSWORD" | docker exec -i "$API_CONTAINER" node /app/database/scripts/reset-password.mjs usuario@dominio.com
unset NEW_PASSWORD
```

## Pendientes recomendados

- Configurar backup externo cifrado fuera del VPS.
- Definir monitoreo externo de disponibilidad para `clinicakeyser.com` y `api.clinicakeyser.com`.
- Revisar y desactivar usuarios duplicados o de seed que no correspondan a personal real.
- Completar migración del frontend para depender solo de cookies HTTP-only y retirar `localStorage` como compatibilidad heredada.
