const express = require('express');
const router = express.Router();
const axios = require('axios');

const DATA = 'http://localhost:3001/api';

// GET /api/recommendations/:memberId
router.get('/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const [memberRes, statsRes, vitalRes, recordsRes, classesRes] = await Promise.all([
      axios.get(`${DATA}/members/${memberId}`),
      axios.get(`${DATA}/attendance/stats?memberId=${memberId}`),
      axios.get(`${DATA}/vitals/${memberId}/summary`),
      axios.get(`${DATA}/records/${memberId}/latest`),
      axios.get(`${DATA}/classes/member/${memberId}?status=attended`),
    ]);

    const member   = memberRes.data;
    const stats    = statsRes.data;
    const vitals   = vitalRes.data;
    const records  = recordsRes.data;
    const attended = classesRes.data;

    const churnScore = computeChurnScore(stats);
    const insights   = buildInsights(member, stats, vitals, records, attended, churnScore);

    let aiMessage = null;
    if (process.env.ANTHROPIC_API_KEY) {
      aiMessage = await getClaudeRec(member, stats, vitals, records, churnScore);
    } else {
      aiMessage = buildRuleRec(member, stats, vitals, records, churnScore);
    }

    res.json({ insights, aiMessage, churnScore, riskLevel: churnScore >= 75 ? 'high' : churnScore >= 40 ? 'medium' : 'low' });
  } catch (err) {
    console.error('Recommendations error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function computeChurnScore(stats) {
  let score = 0;
  if (stats.last14Days === 0) score += 50;
  else if (stats.last14Days === 1) score += 25;
  if (stats.prev14Days > 0 && stats.last14Days < stats.prev14Days) {
    score += Math.round(((stats.prev14Days - stats.last14Days) / stats.prev14Days) * 30);
  }
  if (stats.lastVisit) {
    const days = Math.floor((Date.now() - new Date(stats.lastVisit)) / 86400000);
    if (days > 21) score += 20;
    else if (days > 14) score += 10;
  }
  return Math.min(score, 100);
}

function buildInsights(member, stats, vitals, records, attended, churnScore) {
  const tips = [];
  if (churnScore >= 75) {
    tips.push({ type: 'warning', icon: '⚠️', text: `You haven't visited in a while, ${member.name.split(' ')[0]}! Your AI coach has prepared a comeback plan for you.` });
  }
  if (vitals?.avg_cardio_mins && vitals.avg_cardio_mins < 30) {
    tips.push({ type: 'info', icon: '❤️', text: `Your average cardio session is ${vitals.avg_cardio_mins} mins. The NHS recommends 150 mins of moderate activity per week — try adding 10 mins to each session.` });
  }
  if (records.length > 0) {
    const bench = records.find(r => r.exercise === 'Bench Press');
    if (bench) tips.push({ type: 'success', icon: '💪', text: `Your Bench Press is at ${bench.weight_kg}kg × ${bench.reps} reps. Based on your progression, a 2.5kg increase next session is achievable.` });
  }
  if (attended.length >= 20) {
    tips.push({ type: 'success', icon: '🏆', text: `You've attended ${attended.length} classes — you're in the top 15% of members for class consistency!` });
  }
  return tips;
}

function buildRuleRec(member, stats, vitals, records, churnScore) {
  const firstName = member.name.split(' ')[0];
  if (churnScore >= 75) {
    return `${firstName}, we've noticed you've been away for a while. Your personalised comeback plan includes 3 lighter HIIT sessions this week to ease back in, plus a free recovery massage session — just book through the Wellness tab. We're here to support you!`;
  }
  if (churnScore >= 40) {
    return `${firstName}, your visits have dropped slightly recently. Remember, consistency is the key to your goals. Why not book a HIIT Blast this week and get back into your rhythm?`;
  }
  const bench = records.find(r => r.exercise === 'Bench Press');
  if (bench) {
    return `${firstName}, you're making brilliant progress! Your ${bench.exercise} is up to ${bench.weight_kg}kg. Keep focusing on progressive overload — the AI recommends hitting a new PR attempt in the next 7–10 days.`;
  }
  return `${firstName}, you're showing great consistency. Keep up your current schedule and consider adding a stretching or yoga session to support recovery.`;
}

async function getClaudeRec(member, stats, vitals, records, churnScore) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const context = `
Member: ${member.name} (${member.membership_type} membership)
Last 14 days visits: ${stats.last14Days}, Previous 14 days: ${stats.prev14Days}
Avg cardio: ${vitals?.avg_cardio_mins || 'N/A'} mins, Avg HR: ${vitals?.avg_hr || 'N/A'} bpm
Personal bests: ${records.map(r => `${r.exercise}: ${r.weight_kg}kg`).join(', ') || 'None logged'}
Churn risk: ${churnScore}%
  `.trim();

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `You are FitZone Elite's AI fitness coach. Write a warm, personal, 2-sentence motivational message for this member:\n\n${context}`,
    }],
  });
  return msg.content[0].text;
}

module.exports = router;
