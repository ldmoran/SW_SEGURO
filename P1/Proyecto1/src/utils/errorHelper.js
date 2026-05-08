function renderError(res, req, statusCode, title, message) {
  return res.status(statusCode).render('pages/error', {
    title,
    status: statusCode,
    message,
    user: req.session?.user || null,
    csrfToken: req.csrfToken?.() || '',
    flash: null
  });
}

module.exports = {
  renderError
};
