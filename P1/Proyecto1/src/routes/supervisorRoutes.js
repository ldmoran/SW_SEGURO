const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { renderError } = require('../utils/errorHelper');

const router = express.Router();

router.use(requireAuth, requireRole('supervisor'));

router.get('/supervisor/albums', async (req, res, next) => {
  try {
    const pendingAlbums = await pool.query(
      `SELECT a.id, a.title, a.description, a.privacy, a.created_at,
              u.username AS owner, u.email
       FROM albums a
       JOIN users u ON u.id = a.owner_id
       WHERE a.status = 'pendiente'
       ORDER BY a.created_at ASC`
    );

    return res.render('pages/supervisor_albums', {
      title: 'Revision de albums',
      pendingAlbums: pendingAlbums.rows
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/supervisor/albums/:id/review', async (req, res, next) => {
  const { action, note } = req.body;
  const status = action === 'approve' ? 'aprobado' : 'rechazado';

  try {
    await pool.query(
      `UPDATE albums
       SET status = $1,
           review_note = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [status, note || null, req.params.id]
    );

    req.session.flash = { type: 'success', message: `Album ${status}.` };
    return res.redirect('/supervisor/albums');
  } catch (error) {
    return next(error);
  }
});

router.get('/supervisor/quarantine', async (req, res, next) => {
  try {
    const images = await pool.query(
      `SELECT i.id, i.original_name, i.stored_name, i.analysis_score, i.analysis_reason, i.created_at,
              a.id AS album_id, a.title AS album_title, u.username AS uploader
       FROM images i
       JOIN albums a ON a.id = i.album_id
       JOIN users u ON u.id = i.uploader_id
       WHERE i.status = 'cuarentena'
       ORDER BY i.created_at ASC`
    );

    return res.render('pages/supervisor_quarantine', {
      title: 'Cuarentena de imagenes',
      images: images.rows
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/supervisor/quarantine/:id/review', async (req, res, next) => {
  const { action } = req.body;

  try {
    const imageResult = await pool.query(
      `SELECT stored_name, status
       FROM images
       WHERE id = $1`,
      [req.params.id]
    );

    if (imageResult.rowCount === 0) {
      return renderError(res, req, 404, 'No encontrado', 'Imagen no encontrada.');
    }

    const image = imageResult.rows[0];
    if (image.status !== 'cuarentena') {
      req.session.flash = { type: 'error', message: 'La imagen ya fue procesada.' };
      return res.redirect('/supervisor/quarantine');
    }

    const approve = action === 'approve';
    const nextStatus = approve ? 'aprobada' : 'rechazada';

    await pool.query(
      `UPDATE images
       SET status = $1,
           reviewed_at = NOW(),
           reviewed_by = $2
       WHERE id = $3`,
      [nextStatus, req.session.user.id, req.params.id]
    );

    const fromPath = path.resolve(__dirname, '..', 'storage', 'rejected', image.stored_name);
    const toFolder = approve ? 'clean' : 'rejected';
    const toPath = path.resolve(__dirname, '..', 'storage', toFolder, image.stored_name);

    if (approve) {
      try {
        await fs.rename(fromPath, toPath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }

    req.session.flash = {
      type: 'success',
      message: approve ? 'Imagen aprobada y publicada.' : 'Imagen rechazada y bloqueada.'
    };
    return res.redirect('/supervisor/quarantine');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
