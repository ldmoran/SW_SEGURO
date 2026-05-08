const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME || 'secureframe',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '20042008d'
});

async function runSchemaMigrations() {
  const schemaPath = path.resolve(__dirname, '..', '..', 'sql', 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);
}

module.exports = {
  pool,
  runSchemaMigrations
};
