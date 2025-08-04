import express from 'express';

const router = express.Router();

// GET /api/ping
router.get('/ping', (req, res) => {
  res.json({ ok: true });
});

export default router; 