const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

router.get('/', (req, res) => {
  const db = getDB();
  const { role } = req.query;
  let query = 'SELECT * FROM members';
  const params = [];
  if (role) { query += ' WHERE role = ?'; params.push(role); }
  query += ' ORDER BY name';
  res.json(db.prepare(query).all(...params));
});

router.get('/stats', (req, res) => {
  const db = getDB();
  const total    = db.prepare('SELECT COUNT(*) as cnt FROM members WHERE role = ?').get('member').cnt;
  const active   = db.prepare("SELECT COUNT(*) as cnt FROM members WHERE role = 'member' AND payment_status = 'active'").get().cnt;
  const defaulted= db.prepare("SELECT COUNT(*) as cnt FROM members WHERE payment_status = 'defaulted'").get().cnt;
  const locked   = db.prepare("SELECT COUNT(*) as cnt FROM members WHERE access_locked = 1").get().cnt;
  const trainers = db.prepare("SELECT COUNT(*) as cnt FROM members WHERE role = 'trainer'").get().cnt;
  res.json({ total, active, defaulted, locked, trainers });
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

router.patch('/:id', (req, res) => {
  const db = getDB();
  const { payment_status, access_locked } = req.body;
  db.prepare('UPDATE members SET payment_status = ?, access_locked = ? WHERE id = ?')
    .run(payment_status, access_locked ? 1 : 0, req.params.id);
  res.json({ success: true });
});

module.exports = router;
