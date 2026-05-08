# Plan Estrategico de Seguridad

## 1. Introduccion y costes de vulnerabilidad

Una vulnerabilidad de Path Traversal o File Upload Bypass en una galeria publica permite:

- Exfiltracion de datos sensibles.
- Almacenamiento y distribucion de payloads ocultos.
- Dano reputacional por contenido malicioso viral.
- Riesgo legal por incumplimiento de proteccion de datos.

Coste estimado cualitativo:

- Operativo: alto (caida de servicio, investigacion, remediacion).
- Reputacional: alto (perdida de confianza publica).
- Financiero: medio/alto (soporte, recuperacion, posibles sanciones).

## 2. Matriz de amenazas

### 2.1 Hardware

- Amenaza: agotamiento de CPU/RAM con imagenes enormes.
  - Impacto: denegacion de servicio.
  - Mitigacion: limite de tamano, resize controlado y rate limiting.

### 2.2 Codigo

- Amenaza: parser vulnerable de imagen.
  - Impacto: ejecucion inesperada/crash.
  - Mitigacion: libreria mantenida (Sharp), actualizaciones y pruebas.

- Amenaza: inyeccion SQL.
  - Impacto: acceso/modificacion no autorizada.
  - Mitigacion: consultas parametrizadas.

### 2.3 Diseno

- Amenaza: ausencia de segregacion de roles.
  - Impacto: usuarios aprueban su propio contenido.
  - Mitigacion: RBAC estricto Usuario/Supervisor.

- Amenaza: publicacion inmediata de uploads.
  - Impacto: difusion de contenido malicioso.
  - Mitigacion: pipeline de analisis + cuarentena.

### 2.4 Arquitectura

- Amenaza: almacenamiento y app en mismo host sin controles.
  - Impacto: mayor superficie de ataque y lateral movement.
  - Mitigacion: separacion logica de capas, politicas de permisos y respaldo.

## 3. Seguridad en SDLC

### 3.1 Requisitos

- Requisitos de confidencialidad, integridad y disponibilidad.
- Definicion de roles y casos de abuso.

### 3.2 Diseno

- Threat modeling de flujo upload y publicacion.
- Definicion de controles perimetrales y de contenido.

### 3.3 Desarrollo

- SAST con linters/analizadores de seguridad.
- Reglas de codificacion segura y revision por pares.

### 3.4 Pruebas

- DAST sobre endpoints de auth, upload y panel supervisor.
- Fuzzing basico sobre formatos de imagen y campos de formulario.
- Pruebas de regresion de seguridad.

### 3.5 Despliegue y operacion

- Variables secretas fuera del codigo.
- Logs de seguridad y monitoreo de intentos fallidos.
- Parches periodicos de dependencias.

## 4. Alineacion con frameworks

### 4.1 OWASP ASVS Nivel 2

- V2 Autenticacion: politicas de clave, rate limit, sesion segura.
- V4 Acceso: RBAC y validacion de autorizacion por recurso.
- V5 Validacion: validaciones server-side y restricciones de entrada.
- V12 Archivos: validacion real de tipo, sanitizacion y almacenamiento seguro.
- V14 Configuracion: cabeceras, CSP y hardening del servidor.

### 4.2 NIST SP 800-218 (SSDF)

- PS: preparacion de requisitos de seguridad.
- PW: practicas seguras de desarrollo e integracion.
- RV: revision y verificacion continua de controles.
- PO: respuesta operativa y mejora continua.

## 5. Coste de riesgo residual y plan de mejora

Riesgos residuales:

- Falsos negativos de analisis heuristico.
- Evasion por tecnicas esteganograficas avanzadas.

Mejoras propuestas:

- Incorporar motor forense especializado para esteganografia.
- Migrar analisis a pipeline asincrono con colas y workers.
- Integrar antivirus/antimalware y sandboxing de archivos.
- Agregar auditoria extendida y alertas SIEM.

## 6. Conclusiones

La solucion implementa defensa en profundidad para un escenario UGC sensible:

- No confia en metadatos del cliente.
- Controla acceso por rol.
- Inspecciona contenido antes de publicar.
- Mantiene flujo de supervision humana para casos sospechosos.

Este enfoque equilibra viabilidad tecnica academica y cobertura de riesgos principales del caso de uso.
