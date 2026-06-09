const express = require('express');
const cors    = require('cors');
const { isOllamaAvailable, OLLAMA_MODEL, OLLAMA_URL } = require('./llm');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/churn',           require('./routes/churn'));
app.use('/api/machine-health',  require('./routes/machineHealth'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/insights',        require('./routes/insights'));

app.get('/health', async (_, res) => {
  const ollamaUp = await isOllamaAvailable();
  res.json({
    status: 'ok',
    server: 'ai-server',
    port: 3002,
    llm: ollamaUp ? `ollama/${OLLAMA_MODEL}` : 'rule-based',
    ollamaUrl: OLLAMA_URL,
  });
});

app.listen(3002, async () => {
  const ollamaUp = await isOllamaAvailable();
  console.log('');
  console.log('  🤖  GMS AI Analytics Server');
  console.log('  ─────────────────────────────');
  console.log('  Running on http://localhost:3002');
  if (ollamaUp) {
    console.log(`  LLM: ✅ Ollama running — model: ${OLLAMA_MODEL}`);
    console.log(`  Endpoint: ${OLLAMA_URL}`);
  } else {
    console.log('  LLM: ⚡ Rule-based mode (Ollama not detected)');
    console.log(`  To enable local AI: install Ollama + run: ollama pull ${OLLAMA_MODEL}`);
  }
  console.log('');
});
