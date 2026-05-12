const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.'
});

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Has alcanzado el limite temporal de subidas.'
});

const hardeningHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

const csrfProtection = csrf({ cookie: false });

module.exports = {
  authLimiter,
  uploadLimiter,
  hardeningHeaders,
  csrfProtection
};
