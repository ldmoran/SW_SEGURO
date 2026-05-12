require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const pgSession = require('connect-pg-simple')(session);

const { pool, runSchemaMigrations } = require('./config/db');
const { ensureDemoUsers } = require('./services/bootstrapService');
const { hardeningHeaders, csrfProtection } = require('./middlewares/security');

const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(hardeningHeaders);
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '500kb' }));

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'user_sessions'
    }),
    name: 'secureframe.sid',
    secret: process.env.SESSION_SECRET || 'cambia-esto-ya',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 4
    }
  })
);

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return csrfProtection(req, res, next);
  }
  if (req.is('multipart/form-data')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
  res.locals.flash = req.session.flash || null;
  req.session.flash = null;
  return next();
});

app.use('/assets', express.static(path.resolve(__dirname, 'public')));
app.use(
  '/media',
  express.static(path.resolve(__dirname, 'storage', 'clean'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=3600');
    }
  })
);

app.use(publicRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(supervisorRoutes);

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('pages/error', {
      title: 'Solicitud invalida',
      status: 403,
      message: 'Token CSRF invalido. Recarga la pagina e intenta de nuevo.',
      user: req.session?.user || null,
      csrfToken: '',
      flash: null
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).render('pages/error', {
      title: 'Carga muy grande',
      status: 413,
      message: 'El cuerpo de la solicitud excede el limite permitido.',
      user: req.session?.user || null,
      csrfToken: '',
      flash: null
    });
  }

  console.error(err);
  return res.status(500).render('pages/error', {
    title: 'Error interno',
    status: 500,
    message: 'Ocurrio un error inesperado en el servidor.',
    user: req.session?.user || null,
    csrfToken: '',
    flash: null
  });
});

async function start() {
  await runSchemaMigrations();
  await ensureDemoUsers();
  app.listen(PORT, () => {
    console.log(`SecureFrame Gallery escuchando en puerto ${PORT}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar la aplicacion:', error);
  process.exit(1);
});
