const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

router.get('/', (req, res) => {
  const db = getDB();
  const { status, zone } = req.query;
  let query = 'SELECT * FROM machines';
  const wheres = [], params = [];
  if (status) { wheres.push('status = ?'); params.push(status); }
  if (zone)   { wheres.push('zone = ?');   params.push(zone); }
  if (wheres.length) query += ' WHERE ' + wheres.join(' AND ');
  query += ' ORDER BY zone, name';
  res.json(db.prepare(query).all(...params));
});

router.get('/stats', (req, res) => {
  const db = getDB();
  const total       = db.prepare('SELECT COUNT(*) as cnt FROM machines').get().cnt;
  const operational = db.prepare("SELECT COUNT(*) as cnt FROM machines WHERE status = 'operational'").get().cnt;
  const fault       = db.prepare("SELECT COUNT(*) as cnt FROM machines WHERE status = 'fault'").get().cnt;
  const maintenance = db.prepare("SELECT COUNT(*) as cnt FROM machines WHERE status = 'maintenance'").get().cnt;
  const uptime      = total > 0 ? Math.round((operational / total) * 100) : 0;
  res.json({ total, operational, fault, maintenance, uptime });
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  res.json(machine);
});

router.patch('/:id/status', (req, res) => {
  const db = getDB();
  const { status, fault_code, fault_description } = req.body;
  db.prepare('UPDATE machines SET status = ?, fault_code = ?, fault_description = ? WHERE id = ?')
    .run(status, fault_code || null, fault_description || null, req.params.id);
  res.json({ success: true });
});

module.exports = router;
