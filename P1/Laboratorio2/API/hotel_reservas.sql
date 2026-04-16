-- Script compatible con pgAdmin.
-- 1) Ejecuta esta sentencia (una sola vez) conectado a la BD postgres:
-- CREATE DATABASE hotel_reservas;
-- 2) Luego abre Query Tool sobre la BD hotel_reservas y ejecuta solo las tablas de abajo.

CREATE TABLE IF NOT EXISTS hoteles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  estrellas INT,
  telefono VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  fecha_entrada DATE NOT NULL,
  fecha_salida DATE NOT NULL,
  num_huespedes INT DEFAULT 1,
  hotel_id INT NOT NULL REFERENCES hoteles(id),
  cliente_id INT NOT NULL REFERENCES clientes(id)
);
