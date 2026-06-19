# Architecture

Clinica Keyser uses a modular monolith. Each business area owns its controller, application service, repository, DTOs, and domain rules. Cross-cutting concerns such as Prisma, audit logging, and file storage are shared through dependency-injected services.

The local file storage provider implements a storage interface so an S3 provider can replace it without changing patient or EMR workflows.

The database schema is intentionally broad in milestone one so migrations can evolve from a stable domain map while application modules are generated one by one.

## Production topology

Production is intentionally small:

- `web`: Next.js public site and clinical UI.
- `api`: NestJS API.
- `postgres`: private PostgreSQL database with persistent volume.

Coolify manages build, deployment, Traefik routing and HTTPS. PostgreSQL is only reachable inside the Docker network. Orthanc/DICOM is not part of the active production deployment.
