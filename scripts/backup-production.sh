#!/usr/bin/env sh
set -eu

PROJECT_FILTER="${PROJECT_FILTER:-e1dt2fi2dfqvc9dd67bs120q}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/clinic-keyser}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

POSTGRES_CONTAINER="$(docker ps --filter "name=postgres-${PROJECT_FILTER}" --format '{{.ID}}' | head -n 1)"
API_CONTAINER="$(docker ps --filter "name=api-${PROJECT_FILTER}" --format '{{.ID}}' | head -n 1)"

if [ -z "${POSTGRES_CONTAINER}" ]; then
  echo "No se encontró el contenedor PostgreSQL para ${PROJECT_FILTER}." >&2
  exit 1
fi

docker exec "${POSTGRES_CONTAINER}" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' \
  > "${BACKUP_DIR}/clinic_keyser_${TIMESTAMP}.dump"

if [ -n "${API_CONTAINER}" ]; then
  docker cp "${API_CONTAINER}:/app/storage" "${BACKUP_DIR}/api_storage" 2>/dev/null || true
fi

docker ps --format '{{.Names}} {{.Image}} {{.Status}}' > "${BACKUP_DIR}/containers.txt"
docker volume ls > "${BACKUP_DIR}/volumes.txt"
sha256sum "${BACKUP_DIR}/clinic_keyser_${TIMESTAMP}.dump" > "${BACKUP_DIR}/SHA256SUMS"

find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;

echo "Backup creado en ${BACKUP_DIR}"
