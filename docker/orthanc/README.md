# Orthanc para SonoScape

El archivo `orthanc.json` permite `C-ECHO` y `C-STORE` desde equipos no registrados para facilitar la verificacion inicial desde SonoScape.

En `DicomModalities` se deja una modalidad de referencia:

```json
"SONOSCAPE": ["SONOSCAPE", "IP_DEL_ULTRASONIDO", 104]
```

Cuando conozca la IP real del SonoScape, cambie `IP_DEL_ULTRASONIDO` por esa IP. El puerto `104` es el puerto DICOM habitual del equipo si Orthanc necesita consultar o enviar estudios hacia el SonoScape. Para recibir estudios desde SonoScape hacia Orthanc, lo critico es que el SonoScape apunte a:

- AE Title: `ORTHANC`
- IP: `192.168.0.19`
- Puerto: `4242`
