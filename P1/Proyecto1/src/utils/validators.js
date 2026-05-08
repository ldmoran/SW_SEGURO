const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Usuario debe tener entre 3 y 30 caracteres.')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Usuario solo puede contener letras, numeros, guion, guion bajo y punto.'),
  body('email').trim().isEmail().withMessage('Correo invalido.').normalizeEmail(),
  body('password')
    .isLength({ min: 10, max: 80 })
    .withMessage('Clave debe tener al menos 10 caracteres.')
    .matches(/[A-Z]/)
    .withMessage('Clave requiere al menos una mayuscula.')
    .matches(/[a-z]/)
    .withMessage('Clave requiere al menos una minuscula.')
    .matches(/[0-9]/)
    .withMessage('Clave requiere al menos un numero.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Clave requiere al menos un simbolo.'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Las claves no coinciden.')
];

const loginValidation = [
  body('identifier').trim().isLength({ min: 3, max: 120 }),
  body('password').isLength({ min: 1, max: 120 })
];

const albumValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('Titulo invalido.')
    .matches(/^[\w\s.,!()\-áéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage('Titulo contiene caracteres no permitidos.'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 900 })
    .withMessage('Descripcion invalida.'),
  body('privacy').isIn(['publico', 'privado']).withMessage('Privacidad invalida.')
];

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).render('pages/error', {
    title: 'Solicitud invalida',
    status: 400,
    message: errors.array().map((e) => e.msg).join(' ')
  });
}

module.exports = {
  registerValidation,
  loginValidation,
  albumValidation,
  validateRequest
};
