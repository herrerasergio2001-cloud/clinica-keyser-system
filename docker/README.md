# Docker

The active production deployment is defined by the root `docker-compose.yml` and contains only:

- `postgres`
- `api`
- `web`

Coolify builds this compose file and manages Traefik/HTTPS. The `docker/orthanc` folder is retained as historical/local DICOM reference only and is not active in production.
