const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middlewares/auth');
const { renderError } = require('../utils/errorHelper');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const featuredAlbums = await pool.query(
      `SELECT a.id, a.title, a.description, u.username AS owner,
              COUNT(i.id) FILTER (WHERE i.status = 'aprobada')::int AS image_count
       FROM albums a
       JOIN users u ON u.id = a.owner_id
       LEFT JOIN images i ON i.album_id = a.id
       WHERE a.status = 'aprobado' AND a.privacy = 'publico'
       GROUP BY a.id, a.title, a.description, u.username
       ORDER BY a.created_at DESC
       LIMIT 6`
    );

    return res.render('pages/home', {
      title: 'SecureFrame Gallery',
      featuredAlbums: featuredAlbums.rows
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/dashboard', requireAuth, async (req, res, next) => {
  const user = req.session.user;
  try {
    const albums = await pool.query(
      `SELECT id, title, description, privacy, status, created_at
       FROM albums
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    return res.render('pages/dashboard', {
      title: 'Panel de usuario',
      albums: albums.rows
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/gallery', async (req, res, next) => {
  try {
    const albums = await pool.query(
      `SELECT a.id, a.title, a.description, u.username AS owner,
              COUNT(i.id) FILTER (WHERE i.status = 'aprobada')::int AS image_count
       FROM albums a
       JOIN users u ON u.id = a.owner_id
       LEFT JOIN images i ON i.album_id = a.id
       WHERE a.status = 'aprobado' AND a.privacy = 'publico'
       GROUP BY a.id, a.title, a.description, u.username
       ORDER BY a.created_at DESC`
    );

    return res.render('pages/gallery', {
      title: 'Galeria publica',
      albums: albums.rows
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/gallery/album/:id', async (req, res, next) => {
  try {
    const album = await pool.query(
      `SELECT a.id, a.title, a.description, u.username AS owner
       FROM albums a
       JOIN users u ON u.id = a.owner_id
       WHERE a.id = $1
         AND a.status = 'aprobado'
         AND a.privacy = 'publico'`,
      [req.params.id]
    );

    if (album.rowCount === 0) {
      return renderError(res, req, 404, 'No encontrado', 'Album no encontrado o no disponible.');
    }

    const images = await pool.query(
      `SELECT id, stored_name, original_name, analysis_score, created_at
       FROM images
       WHERE album_id = $1 AND status = 'aprobada'
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    return res.render('pages/album_view', {
      title: `Album ${album.rows[0].title}`,
      album: album.rows[0],
      images: images.rows
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
