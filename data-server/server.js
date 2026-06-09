const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

initDB();

app.use('/api/members',        require('./routes/members'));
app.use('/api/attendance',     require('./routes/attendance'));
app.use('/api/classes',        require('./routes/classes'));
app.use('/api/machines',       require('./routes/machines'));
app.use('/api/payments',       require('./routes/payments'));
app.use('/api/vitals',         require('./routes/vitals'));
app.use('/api/records',        require('./routes/personalRecords'));
app.use('/api/services',       require('./routes/services'));

app.get('/health', (_, res) => res.json({ status: 'ok', server: 'data-server', port: 3001 }));

app.listen(3001, () => {
  console.log('');
  console.log('  🗄️  GMS Data Server');
  console.log('  ─────────────────────────────');
  console.log('  Running on http://localhost:3001');
  console.log('');
});
