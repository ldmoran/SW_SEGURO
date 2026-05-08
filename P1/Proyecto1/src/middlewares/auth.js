function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Debes iniciar sesion.' };
    return res.redirect('/login');
  }
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).render('pages/error', {
        title: 'Acceso denegado',
        status: 403,
        message: 'No tienes permisos para acceder a este recurso.'
      });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
