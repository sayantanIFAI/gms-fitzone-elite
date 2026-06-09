const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { v4: uuid } = require('uuid');

// GET /api/classes
router.get('/', (req, res) => {
  const db = getDB();
  const { trainerId } = req.query;
  let query = `
    SELECT c.*, m.name as trainer_name,
      (SELECT COUNT(*) FROM class_bookings cb WHERE cb.class_id = c.id AND cb.status IN ('booked','attended')) as total_bookings
    FROM classes c LEFT JOIN members m ON c.trainer_id = m.id
  `;
  const params = [];
  if (trainerId) { query += ' WHERE c.trainer_id = ?'; params.push(trainerId); }
  query += ' ORDER BY c.schedule_time';
  res.json(db.prepare(query).all(...params));
});

// GET /api/classes/upcoming – next 14 days
router.get('/upcoming', (req, res) => {
  const db = getDB();
  res.json(db.prepare(`
    SELECT c.*, m.name as trainer_name,
      (SELECT COUNT(*) FROM class_bookings cb WHERE cb.class_id = c.id AND cb.booking_date >= date('now') AND cb.status = 'booked') as booked_count
    FROM classes c LEFT JOIN members m ON c.trainer_id = m.id
    ORDER BY c.schedule_time
  `).all());
});

// GET /api/classes/member/:memberId – member's bookings
router.get('/member/:memberId', (req, res) => {
  const db = getDB();
  const { status } = req.query;
  let query = `
    SELECT cb.*, c.name as class_name, c.schedule_time, c.schedule_days,
           c.color, c.duration_minutes, c.location, c.category,
           m.name as trainer_name
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    LEFT JOIN members m ON c.trainer_id = m.id
    WHERE cb.member_id = ?
  `;
  const params = [req.params.memberId];
  if (status) { query += ' AND cb.status = ?'; params.push(status); }
  query += ' ORDER BY cb.booking_date DESC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/classes/:id/attendance – bookings per class (trainer view)
router.get('/:id/attendance', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT
      strftime('%Y-W%W', booking_date) as week,
      SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) as attended,
      SUM(CASE WHEN status = 'no-show'  THEN 1 ELSE 0 END) as no_show,
      COUNT(*) as total_booked
    FROM class_bookings
    WHERE class_id = ?
      AND booking_date >= date('now', '-84 days')
    GROUP BY week
    ORDER BY week ASC
  `).all(req.params.id);
  res.json(rows);
});

// GET /api/classes/:id/members – who is booked for this class
router.get('/:id/members', (req, res) => {
  const db = getDB();
  res.json(db.prepare(`
    SELECT m.id, m.name, m.avatar_color, cb.status, cb.booking_date
    FROM class_bookings cb
    JOIN members m ON cb.member_id = m.id
    WHERE cb.class_id = ?
    ORDER BY cb.booking_date DESC
    LIMIT 100
  `).all(req.params.id));
});

// GET /api/classes/trainer-attendance?trainerId=X – weekly attendance for trainer's classes
router.get('/trainer-attendance', (req, res) => {
  const db = getDB();
  const { trainerId } = req.query;
  if (!trainerId) return res.json([]);
  const rows = db.prepare(`
    SELECT c.name as class_name, c.color,
      strftime('%Y-W%W', cb.booking_date) as week,
      COUNT(*) as attended
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    WHERE c.trainer_id = ?
      AND cb.booking_date >= date('now', '-98 days')
    GROUP BY c.id, week
    ORDER BY week ASC, c.name
  `).all(trainerId);
  res.json(rows);
});

// POST /api/classes/:id/book
router.post('/:id/book', (req, res) => {
  const db = getDB();
  const { memberId, bookingDate } = req.body;
  const existing = db.prepare('SELECT id FROM class_bookings WHERE class_id = ? AND member_id = ? AND booking_date = ?').get(req.params.id, memberId, bookingDate);
  if (existing) return res.status(409).json({ error: 'Already booked for this session' });

  const cap = db.prepare('SELECT capacity FROM classes WHERE id = ?').get(req.params.id);
  const booked = db.prepare("SELECT COUNT(*) as cnt FROM class_bookings WHERE class_id = ? AND booking_date = ? AND status = 'booked'").get(req.params.id, bookingDate).cnt;
  if (booked >= cap.capacity) return res.status(409).json({ error: 'Class is fully booked' });

  const id = uuid();
  db.prepare('INSERT INTO class_bookings (id,class_id,member_id,booking_date,status,booked_at) VALUES (?,?,?,?,?,?)')
    .run(id, req.params.id, memberId, bookingDate, 'booked', new Date().toISOString());
  res.json({ id, success: true });
});

module.exports = router;
