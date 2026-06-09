const axios = require('axios');

const OLLAMA_URL  = process.env.OLLAMA_URL  || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

let _ollamaAvailable = null; // null = unchecked, true/false = cached result

async function isOllamaAvailable() {
  if (_ollamaAvailable !== null) return _ollamaAvailable;
  try {
    await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 2000 });
    _ollamaAvailable = true;
  } catch {
    _ollamaAvailable = false;
  }
  return _ollamaAvailable;
}

// Reset cache every 30 s so a newly-started Ollama is detected quickly
setInterval(() => { _ollamaAvailable = null; }, 30_000);

async function callLLM(prompt, maxTokens = 300) {
  if (!(await isOllamaAvailable())) return null;
  try {
    const { data } = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        stream: false,
        options: { num_predict: maxTokens, temperature: 0.7 },
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for FitZone Elite, a UK gym. Be concise — 2-3 sentences maximum. Use a warm, professional tone.',
          },
          { role: 'user', content: prompt },
        ],
      },
      { timeout: 30_000 }
    );
    return data?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[Ollama] callLLM error:', err.message);
    return null;
  }
}

module.exports = { callLLM, isOllamaAvailable, OLLAMA_MODEL, OLLAMA_URL };
