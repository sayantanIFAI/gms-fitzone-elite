const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { v4: uuid } = require('uuid');

// GET /api/records/:memberId – all PRs grouped by exercise
router.get('/:memberId', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT * FROM personal_records
    WHERE member_id = ?
    ORDER BY exercise, recorded_at ASC
  `).all(req.params.memberId);
  res.json(rows);
});

// GET /api/records/:memberId/latest – most recent PR per exercise
router.get('/:memberId/latest', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT pr.* FROM personal_records pr
    INNER JOIN (
      SELECT exercise, MAX(recorded_at) as latest
      FROM personal_records WHERE member_id = ?
      GROUP BY exercise
    ) maxpr ON pr.exercise = maxpr.exercise AND pr.recorded_at = maxpr.latest
    WHERE pr.member_id = ?
    ORDER BY pr.exercise
  `).all(req.params.memberId, req.params.memberId);
  res.json(rows);
});

// GET /api/records/:memberId/exercise/:exercise – history for one exercise
router.get('/:memberId/exercise/:exercise', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT * FROM personal_records
    WHERE member_id = ? AND exercise = ?
    ORDER BY recorded_at ASC
  `).all(req.params.memberId, req.params.exercise);
  res.json(rows);
});

// POST /api/records/:memberId
router.post('/:memberId', (req, res) => {
  const db = getDB();
  const { exercise, weight_kg, reps, notes } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO personal_records (id,member_id,exercise,weight_kg,reps,recorded_at,notes) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.params.memberId, exercise, weight_kg, reps, new Date().toISOString(), notes || null);
  res.json({ id, success: true });
});

module.exports = router;
