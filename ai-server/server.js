const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/churn',           require('./routes/churn'));
app.use('/api/machine-health',  require('./routes/machineHealth'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/insights',        require('./routes/insights'));

app.get('/health', (_, res) => res.json({
  status: 'ok',
  server: 'ai-server',
  port: 3002,
  claudeEnabled: !!process.env.ANTHROPIC_API_KEY,
}));

app.listen(3002, () => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  console.log('');
  console.log('  🤖  GMS AI Analytics Server');
  console.log('  ─────────────────────────────');
  console.log('  Running on http://localhost:3002');
  console.log(`  Claude API: ${hasKey ? '✅ Enabled' : '⚡ Rule-based mode'}`);
  console.log('');
});
