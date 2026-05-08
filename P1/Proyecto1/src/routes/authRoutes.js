const express = require('express');
const argon2 = require('argon2');
const { pool } = require('../config/db');
const { authLimiter } = require('../middlewares/security');
const {
  registerValidation,
  loginValidation,
  validateRequest
} = require('../utils/validators');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('pages/register', { title: 'Registro' });
});

router.post('/register', authLimiter, registerValidation, validateRequest, async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exists.rowCount > 0) {
      req.session.flash = { type: 'error', message: 'No se pudo registrar la cuenta.' };
      return res.redirect('/register');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1
    });

    await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'usuario')`,
      [username, email, passwordHash]
    );

    req.session.flash = { type: 'success', message: 'Registro completado. Ya puedes iniciar sesion.' };
    return res.redirect('/login');
  } catch (error) {
    return next(error);
  }
});

router.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Iniciar sesion' });
});

router.post('/login', authLimiter, loginValidation, validateRequest, async (req, res, next) => {
  const { identifier, password } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT id, username, email, password_hash, role
       FROM users
       WHERE email = $1 OR username = $1`,
      [identifier]
    );

    const genericError = 'Credenciales invalidas.';
    if (userResult.rowCount === 0) {
      req.session.flash = { type: 'error', message: genericError };
      return res.redirect('/login');
    }

    const user = userResult.rows[0];
    const validPassword = await argon2.verify(user.password_hash, password);

    if (!validPassword) {
      req.session.flash = { type: 'error', message: genericError };
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    req.session.flash = { type: 'success', message: `Bienvenido ${user.username}.` };
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('secureframe.sid');
    res.redirect('/');
  });
});

module.exports = router;
