const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { v4: uuid } = require('uuid');

router.get('/:memberId', (req, res) => {
  const db = getDB();
  const { weeks = 12 } = req.query;
  const rows = db.prepare(`
    SELECT * FROM vitals
    WHERE member_id = ?
      AND recorded_at >= date('now', '-' || (? * 7) || ' days')
    ORDER BY recorded_at ASC
  `).all(req.params.memberId, parseInt(weeks));
  res.json(rows);
});

router.get('/:memberId/summary', (req, res) => {
  const db = getDB();
  const summary = db.prepare(`
    SELECT
      ROUND(AVG(heart_rate_avg), 0) as avg_hr,
      MAX(heart_rate_max) as peak_hr,
      ROUND(AVG(cardio_duration_minutes), 0) as avg_cardio_mins,
      SUM(calories_burned) as total_calories,
      SUM(cardio_duration_minutes) as total_cardio_mins,
      COUNT(*) as sessions_tracked
    FROM vitals
    WHERE member_id = ?
      AND recorded_at >= date('now', '-90 days')
  `).get(req.params.memberId);
  res.json(summary);
});

router.post('/:memberId', (req, res) => {
  const db = getDB();
  const { heart_rate_avg, heart_rate_max, calories_burned, cardio_duration_minutes, steps } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO vitals (id,member_id,recorded_at,heart_rate_avg,heart_rate_max,calories_burned,cardio_duration_minutes,steps) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, req.params.memberId, new Date().toISOString(), heart_rate_avg, heart_rate_max, calories_burned, cardio_duration_minutes, steps);
  res.json({ id, success: true });
});

module.exports = router;
