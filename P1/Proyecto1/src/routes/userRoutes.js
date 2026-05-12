const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { requireAuth } = require('../middlewares/auth');
const { uploadLimiter, csrfProtection } = require('../middlewares/security');
const { albumValidation, validateRequest } = require('../utils/validators');
const { analyzeImageBuffer } = require('../services/stegAnalysis');
const { renderError } = require('../utils/errorHelper');

const router = express.Router();
const maxUploadBytes = Number(process.env.MAX_UPLOAD_MB || 6) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes }
});

router.get('/albums/new', requireAuth, (req, res) => {
  res.render('pages/album_new', {
    title: 'Solicitar album'
  });
});

router.post('/albums', requireAuth, albumValidation, validateRequest, async (req, res, next) => {
  const { title, description, privacy } = req.body;
  try {
    const isSupervisor = req.session.user.role === 'supervisor';
    const status = isSupervisor ? 'aprobado' : 'pendiente';
    
    await pool.query(
      `INSERT INTO albums (owner_id, title, description, privacy, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.user.id, title, description, privacy, status]
    );

    const message = isSupervisor 
      ? 'Album creado y aprobado automaticamente.' 
      : 'Album enviado a revision.';
    
    req.session.flash = {
      type: 'success',
      message: message
    };
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
});

router.get('/albums/:id/upload', requireAuth, async (req, res, next) => {
  try {
    const album = await pool.query(
      `SELECT id, title, status
       FROM albums
       WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.session.user.id]
    );

    if (album.rowCount === 0) {
      return renderError(res, req, 404, 'No encontrado', 'Album no disponible para este usuario.');
    }

    if (album.rows[0].status !== 'aprobado') {
      return renderError(res, req, 403, 'Accion bloqueada', 'Solo puedes subir imagenes a albumes aprobados.');
    }

    return res.render('pages/upload', {
      title: 'Subir imagen segura',
      album: album.rows[0],
      maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 6)
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/albums/:id/privacy', requireAuth, async (req, res, next) => {
  const { privacy } = req.body;

  if (!privacy || !['publico', 'privado'].includes(privacy)) {
    req.session.flash = { type: 'error', message: 'Privacidad invalida.' };
    return res.redirect('/dashboard');
  }

  try {
    const album = await pool.query(
      `SELECT id, status, owner_id FROM albums WHERE id = $1`,
      [req.params.id]
    );

    if (album.rowCount === 0) {
      return renderError(res, req, 404, 'No encontrado', 'Album no existe.');
    }

    if (album.rows[0].owner_id !== req.session.user.id) {
      return renderError(res, req, 403, 'Accion bloqueada', 'No tienes permiso para editar este album.');
    }

    if (album.rows[0].status !== 'aprobado') {
      req.session.flash = { type: 'error', message: 'Solo puedes cambiar privacidad de albums aprobados.' };
      return res.redirect('/dashboard');
    }

    await pool.query(
      `UPDATE albums SET privacy = $1, updated_at = NOW() WHERE id = $2`,
      [privacy, req.params.id]
    );

    req.session.flash = {
      type: 'success',
      message: `Album ahora es ${privacy}.`
    };
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/albums/:id/upload',
  requireAuth,
  uploadLimiter,
  upload.single('image'),
  csrfProtection,
  async (req, res, next) => {
    try {
      const album = await pool.query(
        `SELECT id, title, status
         FROM albums
         WHERE id = $1 AND owner_id = $2`,
        [req.params.id, req.session.user.id]
      );

      if (album.rowCount === 0 || album.rows[0].status !== 'aprobado') {
        return renderError(res, req, 403, 'Accion bloqueada', 'No tienes permiso para subir en este album.');
      }

      if (!req.file || !req.file.buffer) {
        req.session.flash = { type: 'error', message: 'Debes seleccionar una imagen valida.' };
        return res.redirect(`/albums/${req.params.id}/upload`);
      }

      const detectedType = await FileType.fromBuffer(req.file.buffer);
      const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];

      if (!detectedType || !allowedMime.includes(detectedType.mime)) {
        req.session.flash = { type: 'error', message: 'Formato invalido. Solo se acepta JPG, PNG o WEBP reales.' };
        return res.redirect(`/albums/${req.params.id}/upload`);
      }

      const analysis = await analyzeImageBuffer(req.file.buffer, detectedType.mime);
      const normalizedBuffer = await sharp(req.file.buffer)
        .withMetadata(false)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();

      const filename = `${uuidv4()}.webp`;
      const targetFolder = analysis.suspicious ? 'rejected' : 'clean';
      const fullPath = path.resolve(__dirname, '..', 'storage', targetFolder, filename);

      await fs.writeFile(fullPath, normalizedBuffer);

      const imageStatus = analysis.suspicious ? 'cuarentena' : 'aprobada';
      await pool.query(
        `INSERT INTO images
          (album_id, uploader_id, original_name, stored_name, mime_type, size_bytes, status, analysis_score, analysis_reason, analysis_json)
         VALUES
          ($1, $2, $3, $4, 'image/webp', $5, $6, $7, $8, $9::jsonb)`,
        [
          req.params.id,
          req.session.user.id,
          req.file.originalname,
          filename,
          normalizedBuffer.length,
          imageStatus,
          analysis.score,
          analysis.reason,
          JSON.stringify(analysis.details)
        ]
      );

      if (analysis.suspicious) {
        req.session.flash = {
          type: 'error',
          message: 'Imagen enviada a cuarentena por analisis esteganografico.'
        };
      } else {
        req.session.flash = {
          type: 'success',
          message: 'Imagen analizada y publicada correctamente.'
        };
      }

      return res.redirect('/dashboard');
    } catch (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        req.session.flash = { type: 'error', message: 'Archivo demasiado grande.' };
        return res.redirect(`/albums/${req.params.id}/upload`);
      }
      return next(error);
    }
  }
);

router.post('/albums/:id/delete', requireAuth, csrfProtection, async (req, res, next) => {
  try {
    const albumResult = await pool.query(
      `SELECT id, title
       FROM albums
       WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.session.user.id]
    );

    if (albumResult.rowCount === 0) {
      return renderError(res, req, 404, 'No encontrado', 'Album no disponible para este usuario.');
    }

    const imagesResult = await pool.query(
      `SELECT stored_name, status
       FROM images
       WHERE album_id = $1`,
      [req.params.id]
    );

    for (const image of imagesResult.rows) {
      const folders = image.status === 'aprobada' ? ['clean'] : ['rejected'];
      for (const folder of folders) {
        const filePath = path.resolve(__dirname, '..', 'storage', folder, image.stored_name);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }
    }

    await pool.query(
      `DELETE FROM albums
       WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.session.user.id]
    );

    req.session.flash = { type: 'success', message: 'Album eliminado correctamente.' };
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
