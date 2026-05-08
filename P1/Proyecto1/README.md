# SecureFrame Gallery

Aplicacion web segura para galeria multimedia publica con deteccion automatizada de esteganografia, cuarentena de imagenes sospechosas y flujo de aprobacion por rol Supervisor.

## Funcionalidades implementadas

- RF01 Registro y autenticacion segura:
  - Registro de usuarios con validacion robusta de clave.
  - Hash de contrasenas con Argon2id (no reversible), usando salt y costo de memoria/tiempo para dificultar fuerza bruta.
  - Login con mensaje generico para reducir enumeracion de usuarios.
  - Rate limiting en rutas de autenticacion.
  - Sesiones seguras con cookie HttpOnly y almacenamiento en PostgreSQL.

- RF02 Gestion de albums:
  - Usuario autenticado solicita nuevo album con estado pendiente.
  - Supervisor revisa y aprueba/rechaza solicitudes.
  - Validacion estricta de entrada para mitigar Stored XSS.

- RF03 Subida de imagen y deteccion esteganografica:
  - Upload solo para albums aprobados.
  - Verificacion de tipo real via magic numbers (no solo extension).
  - Re-encoding con Sharp y limpieza de metadatos EXIF.
  - Analisis heuristico esteganografico:
    - Deteccion de trailing data EOF sospechosa.
    - Metricas de ruido y variacion en LSB.
  - Resultado:
    - Limpio: publica en galeria.
    - Sospechoso: envia a cuarentena.

- RF04 Revision manual de cuarentena:
  - Supervisor puede aprobar (publica) o rechazar (bloquea).
  - Se registra estado, fecha y responsable de revision.

- RF05 Visualizacion publica segura:
  - Galeria publica de albums aprobados.
  - Cabeceras de seguridad con Helmet:
    - CSP
    - X-Content-Type-Options: nosniff

## Stack

- Backend:
  - Node.js: entorno de ejecucion JavaScript del servidor.
  - Express: framework web para rutas, middlewares y manejo de peticiones HTTP.
  - EJS: motor de plantillas para renderizar vistas HTML del lado servidor.
- Base de datos:
  - PostgreSQL: almacenamiento relacional de usuarios, albums, imagenes, sesiones y estados de revision.
- Seguridad:
  - Helmet: aplica cabeceras de seguridad (por ejemplo CSP y X-Content-Type-Options).
  - CSRF (csurf): protege formularios y acciones sensibles contra ataques Cross-Site Request Forgery.
  - express-session: gestiona sesiones autenticadas en cookies seguras HttpOnly.
  - connect-pg-simple: guarda las sesiones en PostgreSQL en lugar de memoria local.
  - express-rate-limit: limita intentos repetidos (login/subidas) para reducir abuso y fuerza bruta.
  - Argon2id (argon2): algoritmo de hash de contrasenas (no cifrado reversible) para proteger credenciales almacenadas.
- Procesamiento de imagen:
  - Sharp: re-encoding y normalizacion de imagenes (resize, conversion a WEBP, limpieza de metadatos).
- Deteccion de tipo archivo:
  - file-type: valida el tipo real del archivo por firma binaria (magic numbers), no solo por extension.

## Estructura

- src/app.js: punto de entrada
- src/config/db.js: conexion PG y migracion de schema
- src/routes: rutas de auth, usuario, supervisor y publico
- src/services/stegAnalysis.js: analisis automatizado
- src/storage/clean: imagenes aprobadas
- src/storage/rejected: imagenes sospechosas/rechazadas
- sql/schema.sql: esquema SQL
- docs/plan_estrategico.md: memoria tecnica base del componente A

## Requisitos previos

- Node.js 20+
- PostgreSQL 14+

## Configuracion

1. Copiar variables de entorno:

   - Copia .env.example a .env

2. Ajustar credenciales de base de datos en .env:

- DATABASE_HOST=localhost
- DATABASE_PORT=5432
- DATABASE_NAME=secureframe
- DATABASE_USER=postgres
- DATABASE_PASSWORD=20042008d

3. Crear base de datos vacia en PostgreSQL:

- Nombre recomendado: secureframe

## Instalacion y ejecucion

1. Instalar dependencias:

- npm install

2. Ejecutar en desarrollo:

- npm run dev

3. Abrir en navegador:

- http://localhost:3000

Al iniciar, la aplicacion ejecuta automaticamente schema SQL y crea usuarios demo si no existen.

## Credenciales de prueba (requerido por la entrega)

- Usuario demo:
  - Correo: demo_user@secureframe.local
  - Clave: Usuario123!

- Supervisor demo:
  - Correo: demo_supervisor@secureframe.local
  - Clave: Supervisor123!

Las claves pueden cambiarse desde variables DEMO_USER_PASSWORD y DEMO_SUPERVISOR_PASSWORD.

## Justificacion tecnica del metodo de deteccion

Se implemento un analisis esteganografico heuristico compuesto por:

- Deteccion de anomalias EOF (trailing bytes despues de marcadores finales JPEG/PNG), util para descubrir payloads ocultos agregados al final del archivo.
- Analisis estadistico de LSB sobre imagen redecodificada, observando distribucion de bits y cambios de patron que pueden sugerir insercion encubierta.

Este enfoque no pretende ser forense definitivo, pero es adecuado para defensa en profundidad en un entorno academico, y cumple el requisito de analizar estructura/contenido real del archivo en lugar de confiar solo en extension o MIME declarado por cliente.

## Seguridad y buenas practicas aplicadas

- Validacion del lado servidor en entradas y formularios.
- Consultas SQL parametrizadas para evitar inyeccion SQL.
- Politicas CSP estrictas para reducir XSS.
- Limite de tamano de carga y rate limiting de subida.
- Sanitizacion por re-encoding de imagenes a WEBP.
- Rol de supervisor separado de usuario estandar (RBAC).

## Notas para defensa

- Mostrar flujo completo:
  1. Usuario crea album (pendiente).
  2. Supervisor aprueba.
  3. Usuario sube imagen.
  4. Sistema clasifica limpio o cuarentena.
  5. Supervisor revisa cuarentena.
  6. Visitante visualiza galeria publica.

## Limitaciones conocidas

- Deteccion esteganografica heuristica: puede tener falsos positivos/negativos.
- No incluye escaneo antimalware binario externo.
- No incluye cola asincroma distribuida (proceso actual sincrono).
