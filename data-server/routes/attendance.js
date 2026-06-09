const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { v4: uuid } = require('uuid');

// GET /api/attendance?memberId=X&days=90
router.get('/', (req, res) => {
  const db = getDB();
  const { memberId, days = 90 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  const sinceStr = since.toISOString();

  let query = 'SELECT a.*, m.name as member_name FROM attendance a JOIN members m ON a.member_id = m.id WHERE a.check_in >= ?';
  const params = [sinceStr];
  if (memberId) { query += ' AND a.member_id = ?'; params.push(memberId); }
  query += ' ORDER BY a.check_in DESC';

  res.json(db.prepare(query).all(...params));
});

// GET /api/attendance/weekly?memberId=X&weeks=12
router.get('/weekly', (req, res) => {
  const db = getDB();
  const { memberId, weeks = 12 } = req.query;
  if (!memberId) return res.json([]);
  const rows = db.prepare(`
    SELECT
      strftime('%Y-W%W', check_in) as week,
      COUNT(*) as visits
    FROM attendance
    WHERE member_id = ?
      AND check_in >= date('now', '-' || (? * 7) || ' days')
    GROUP BY week
    ORDER BY week ASC
  `).all(memberId, parseInt(weeks));

  // Fill missing weeks with 0
  const result = [];
  for (let i = parseInt(weeks) - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    const week = String(getWeekNumber(d)).padStart(2,'0');
    const key  = `${year}-W${week}`;
    const found = rows.find(r => r.week === key);
    result.push({
      week: key,
      label: formatWeekLabel(d),
      visits: found ? found.visits : 0,
    });
  }
  res.json(result);
});

// GET /api/attendance/stats?memberId=X
router.get('/stats', (req, res) => {
  const db = getDB();
  const { memberId } = req.query;

  const thisMonth = db.prepare(`
    SELECT COUNT(*) as cnt FROM attendance
    WHERE member_id = ? AND check_in >= date('now', 'start of month')
  `).get(memberId).cnt;

  const lastMonth = db.prepare(`
    SELECT COUNT(*) as cnt FROM attendance
    WHERE member_id = ?
      AND check_in >= date('now', 'start of month', '-1 month')
      AND check_in < date('now', 'start of month')
  `).get(memberId).cnt;

  const last14Days = db.prepare(`
    SELECT COUNT(*) as cnt FROM attendance
    WHERE member_id = ? AND check_in >= date('now', '-14 days')
  `).get(memberId).cnt;

  const prev14Days = db.prepare(`
    SELECT COUNT(*) as cnt FROM attendance
    WHERE member_id = ?
      AND check_in >= date('now', '-28 days')
      AND check_in < date('now', '-14 days')
  `).get(memberId).cnt;

  const totalAll = db.prepare(`SELECT COUNT(*) as cnt FROM attendance WHERE member_id = ?`).get(memberId).cnt;

  const lastVisit = db.prepare(`SELECT MAX(check_in) as last FROM attendance WHERE member_id = ?`).get(memberId)?.last;

  res.json({ thisMonth, lastMonth, last14Days, prev14Days, totalAll, lastVisit });
});

// POST /api/attendance/checkin
router.post('/checkin', (req, res) => {
  const db = getDB();
  const { memberId, accessPoint = 'main_entrance' } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO attendance (id,member_id,check_in,access_point) VALUES (?,?,?,?)')
    .run(id, memberId, new Date().toISOString(), accessPoint);
  res.json({ id, success: true });
});

function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

function formatWeekLabel(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

module.exports = router;
