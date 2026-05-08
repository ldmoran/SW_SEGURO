const argon2 = require('argon2');
const { pool } = require('../config/db');

async function ensureDemoUsers() {
  const demoUsers = [
    {
      username: 'demo_user',
      email: 'demo_user@secureframe.local',
      role: 'usuario',
      password: process.env.DEMO_USER_PASSWORD || 'Usuario123!'
    },
    {
      username: 'demo_supervisor',
      email: 'demo_supervisor@secureframe.local',
      role: 'supervisor',
      password: process.env.DEMO_SUPERVISOR_PASSWORD || 'Supervisor123!'
    }
  ];

  for (const user of demoUsers) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
    if (existing.rowCount > 0) {
      continue;
    }

    const passwordHash = await argon2.hash(user.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1
    });

    await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [user.username, user.email, passwordHash, user.role]
    );
  }
}

module.exports = {
  ensureDemoUsers
};
