# API REST - Reservas de Hotel

Este proyecto es una API REST desarrollada con Node.js, Express y PostgreSQL para gestionar hoteles, clientes y reservas.

Pasos para ejecutarla facilmente.

## Integrantes

- David Moran
- Alison Miranda
- Gabriel Vivanco

## Requisitos

- Node.js 18 o superior
- PostgreSQL instalado (yo use pgAdmin para administrarlo)

## Como ejecutar el proyecto

1. Instalar dependencias

Ejecutar en la carpeta API:

npm install

2. Configurar la base de datos

- Crear la base de datos con el nombre hotel_reservas.
- Abrir la base en pgAdmin.
- Ejecutar el script hotel_reservas.sql para crear las tablas.

3. Configurar variables de entorno

Crear un archivo .env en la carpeta API con este contenido (ajustar usuario y contraseña segun tu equipo):

PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_reservas
DB_USER=postgres
DB_PASSWORD=tu_contrasena

4. Levantar el servidor

Para desarrollo:

npm run dev

Para modo normal:

npm start

## Puerto de escucha

La API corre por defecto en el puerto 3000.

URL base:
http://localhost:3000

Health check:
GET /health

## Endpoints principales

Hoteles:
- GET /api/hoteles
- GET /api/hoteles/:id
- POST /api/hoteles
- PUT /api/hoteles/:id

Clientes:
- GET /api/clientes
- GET /api/clientes/:id
- POST /api/clientes
- PUT /api/clientes/:id

Reservas:
- GET /api/reservas
- GET /api/reservas/:id
- POST /api/reservas
- PUT /api/reservas/:id

## Notas

- Las respuestas de error se devuelven en formato JSON con la estructura: { "error": "mensaje" }.
- Si la conexion a la base falla, revisar datos del .env y que PostgreSQL este encendido.
