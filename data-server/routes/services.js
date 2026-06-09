const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { v4: uuid } = require('uuid');

// GET /api/services
router.get('/', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM services ORDER BY category, price').all());
});

// GET /api/services/bookings?memberId=X
router.get('/bookings', (req, res) => {
  const db = getDB();
  const { memberId } = req.query;
  let query = `
    SELECT sb.*, s.name as service_name, s.duration_minutes, s.price,
           s.currency, s.color, s.provider, s.category
    FROM service_bookings sb
    JOIN services s ON sb.service_id = s.id
    WHERE 1=1
  `;
  const params = [];
  if (memberId) { query += ' AND sb.member_id = ?'; params.push(memberId); }
  query += ' ORDER BY sb.booking_datetime DESC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/services/availability?serviceId=X&date=YYYY-MM-DD
router.get('/availability', (req, res) => {
  const { serviceId, date } = req.query;
  // Return hard-coded available slots for the given date
  const allSlots = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
  const db = getDB();
  const taken = db.prepare(`
    SELECT strftime('%H:%M', booking_datetime) as slot
    FROM service_bookings
    WHERE service_id = ? AND date(booking_datetime) = ? AND status != 'cancelled'
  `).all(serviceId, date).map(r => r.slot);
  const available = allSlots.filter(s => !taken.includes(s));
  res.json({ date, available, taken });
});

// POST /api/services/book
router.post('/book', (req, res) => {
  const db = getDB();
  const { serviceId, memberId, bookingDatetime, notes } = req.body;

  // Check slot isn't taken
  const conflict = db.prepare(`
    SELECT id FROM service_bookings
    WHERE service_id = ? AND booking_datetime = ? AND status != 'cancelled'
  `).get(serviceId, bookingDatetime);
  if (conflict) return res.status(409).json({ error: 'Slot already booked' });

  const id = uuid();
  db.prepare('INSERT INTO service_bookings (id,service_id,member_id,booking_datetime,status,notes,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, serviceId, memberId, bookingDatetime, 'confirmed', notes || null, new Date().toISOString());

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  res.json({ id, success: true, service });
});

// DELETE /api/services/bookings/:id
router.delete('/bookings/:id', (req, res) => {
  const db = getDB();
  db.prepare("UPDATE service_bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
