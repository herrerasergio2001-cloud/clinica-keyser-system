# Expediente clínico simplificado

## Flujo definitivo

El expediente del paciente se organiza en seis pestañas:

1. **Historia clínica**: motivo de consulta, enfermedad actual, antecedentes, alergias, medicamentos actuales, hábitos, revisión por sistemas, examen físico, diagnóstico y plan inicial.
2. **Evoluciones**: notas libres independientes, ordenadas por fecha y hora.
3. **Procedimientos**: nombre, fecha, diagnóstico relacionado, médico responsable, descripción, observaciones y adjuntos.
4. **Archivos**: carga, vista, descarga y eliminación administrativa de PDF, JPG, PNG y DICOM.
5. **Órdenes**: laboratorio e imagenología con vista previa, descarga e impresión en PDF.
6. **Estudios**: laboratorio e imagenología, resultados, observaciones y archivos PDF/JPG/PNG.

La interfaz y el código activo ya no contienen formularios SOAP, mapas corporales, modelos anatómicos ni selección de regiones o capas anatómicas. Las notas históricas se convierten a texto libre durante la migración, conservando su contenido sin etiquetas SOAP. Los registros del antiguo mapa corporal se eliminan porque el módulo fue retirado completamente.

## Permisos

- **SUPER_ADMIN**: crear, editar, archivar y restaurar historia clínica, evoluciones, procedimientos y estudios; eliminar definitivamente pacientes, usuarios, órdenes y recetas con confirmación y motivo.
- **ADMIN**: editar o archivar contenido clínico existente cuando el rol todavía exista en una instalación anterior. No aparece como opción al crear usuarios nuevos.
- **DOCTOR**: crear historias, evoluciones, procedimientos y estudios. No puede editar ni archivar entradas ya guardadas.
- **RECEPTION**: lectura del expediente y gestión de pacientes. No puede modificar contenido clínico.
- **LABORATORY**: lectura del expediente, creación de estudios de laboratorio, carga de resultados y edición de estudios cuyo origen sea laboratorio.
- **PHARMACY**: sin acceso al expediente ni a notas clínicas.

Las evoluciones, procedimientos y estudios se archivan para preservar trazabilidad clínica. Las eliminaciones definitivas solicitadas para pacientes, usuarios, órdenes y recetas están restringidas a SUPER_ADMIN, requieren confirmación y motivo, y generan auditoría.

## Migración

En producción:

```bash
npm run prisma:generate
npm run prisma:deploy
```

La migración `20260619210000_simplified_clinical_record`:

- agrega el texto libre a evoluciones;
- convierte las notas anteriores a texto libre y elimina las columnas antiguas;
- elimina completamente la tabla del mapa corporal y el campo de región anatómica de órdenes de imagen;
- crea procedimientos y estudios diagnósticos;
- crea adjuntos clínicos para PDF, JPG y PNG;
- habilita lectura del expediente para el rol LABORATORY.

## Sesión y Recetario Digital

El frontend ahora renueva automáticamente el token de acceso antes de vencer y reintenta una solicitud que reciba HTTP 401. Solo redirige al login cuando el token de renovación también dejó de ser válido.

Esto evita que el Recetario Digital expulse al usuario cuando vence el token corto. El módulo incluye vista previa fiel, descarga autenticada de PDF e impresión desde el navegador.

- SUPER_ADMIN: crear, editar con historial de versiones, anular, eliminar definitivamente, consultar, descargar e imprimir.
- DOCTOR: crear, consultar, descargar e imprimir.
- PHARMACY: consultar e imprimir.
