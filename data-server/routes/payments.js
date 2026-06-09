const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

router.get('/', (req, res) => {
  const db = getDB();
  const { memberId, status } = req.query;
  let query = `
    SELECT p.*, m.name as member_name, m.email, m.membership_type, m.avatar_color, m.access_locked
    FROM payments p
    JOIN members m ON p.member_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (memberId) { query += ' AND p.member_id = ?'; params.push(memberId); }
  if (status)   { query += ' AND p.status = ?';    params.push(status); }
  query += ' ORDER BY p.due_date DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/defaulters', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT
      m.id, m.name, m.email, m.membership_type, m.avatar_color, m.access_locked,
      m.mandate_ref, m.phone,
      COUNT(p.id) as failed_count,
      MAX(p.due_date) as last_due,
      SUM(p.amount) as total_owed,
      p.currency,
      GROUP_CONCAT(DISTINCT p.failure_code) as failure_codes,
      MAX(p.attempts) as max_attempts
    FROM payments p
    JOIN members m ON p.member_id = m.id
    WHERE p.status = 'failed'
    GROUP BY m.id
    ORDER BY failed_count DESC, last_due DESC
  `).all();
  res.json(rows);
});

router.get('/stats', (req, res) => {
  const db = getDB();
  const totalRevenue  = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'paid' AND due_date >= date('now', 'start of month')").get().total;
  const successCount  = db.prepare("SELECT COUNT(*) as cnt FROM payments WHERE status = 'paid' AND due_date >= date('now', '-30 days')").get().cnt;
  const failedCount   = db.prepare("SELECT COUNT(*) as cnt FROM payments WHERE status = 'failed' AND due_date >= date('now', '-30 days')").get().cnt;
  const totalAttempts = successCount + failedCount;
  const successRate   = totalAttempts > 0 ? Math.round((successCount / totalAttempts) * 100) : 100;
  res.json({ totalRevenue, successCount, failedCount, successRate });
});

module.exports = router;
