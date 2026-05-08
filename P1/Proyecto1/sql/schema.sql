CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(40) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('usuario', 'supervisor')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albums (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  privacy VARCHAR(20) NOT NULL CHECK (privacy IN ('publico', 'privado')),
  status VARCHAR(25) NOT NULL CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  review_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name VARCHAR(200) NOT NULL,
  stored_name VARCHAR(200) NOT NULL,
  mime_type VARCHAR(40) NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  status VARCHAR(25) NOT NULL CHECK (status IN ('aprobada', 'cuarentena', 'rechazada')),
  analysis_score INTEGER NOT NULL DEFAULT 0,
  analysis_reason TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_albums_owner ON albums(owner_id);
CREATE INDEX IF NOT EXISTS idx_albums_status ON albums(status);
CREATE INDEX IF NOT EXISTS idx_images_album ON images(album_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);
