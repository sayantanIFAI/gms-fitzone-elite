const express = require('express');
const router = express.Router();
const axios = require('axios');

const DATA = 'http://localhost:3001/api';

// GET /api/churn?trainerId=X  – members at churn risk in trainer's classes
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;

    // Fetch all members (non-staff)
    const { data: members } = await axios.get(`${DATA}/members?role=member`);

    // For each member, compute churn risk
    const results = await Promise.all(members.map(async (m) => {
      const { data: stats } = await axios.get(`${DATA}/attendance/stats?memberId=${m.id}`);
      const churnScore = computeChurnScore(stats);
      const trend = getTrend(stats.prev14Days, stats.last14Days);
      return {
        ...m,
        last14Days: stats.last14Days,
        prev14Days: stats.prev14Days,
        thisMonth: stats.thisMonth,
        lastVisit: stats.lastVisit,
        churnScore,
        trend,
        riskLevel: churnScore >= 75 ? 'high' : churnScore >= 40 ? 'medium' : 'low',
      };
    }));

    // If trainerId given, further filter to members who attended that trainer's classes
    let filtered = results;
    if (trainerId) {
      const { data: classes } = await axios.get(`${DATA}/classes?trainerId=${trainerId}`);
      const classIds = classes.map(c => c.id);

      const memberIdsInClass = new Set();
      await Promise.all(classIds.map(async (cid) => {
        const { data: bookingMembers } = await axios.get(`${DATA}/classes/${cid}/members`);
        bookingMembers.forEach(bm => memberIdsInClass.add(bm.id));
      }));

      filtered = results.filter(m => memberIdsInClass.has(m.id));
    }

    const atRisk = filtered
      .filter(m => m.churnScore >= 30)
      .sort((a, b) => b.churnScore - a.churnScore);

    // Enhance with local LLM (Ollama) if available, else rule-based
    let aiInsight = null;
    if (atRisk.length > 0) {
      aiInsight = await getOllamaChurnInsight(atRisk);
    }
    if (!aiInsight) aiInsight = generateRuleBasedInsight(atRisk);

    res.json({ atRisk, aiInsight, total: atRisk.length });
  } catch (err) {
    console.error('Churn route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function computeChurnScore(stats) {
  let score = 0;
  const { last14Days, prev14Days, lastVisit } = stats;

  // No visits in last 14 days = high risk base
  if (last14Days === 0) score += 50;
  else if (last14Days === 1) score += 25;

  // Significant drop vs previous 2 weeks
  if (prev14Days > 0 && last14Days < prev14Days) {
    const dropRatio = (prev14Days - last14Days) / prev14Days;
    score += Math.round(dropRatio * 30);
  }

  // Days since last visit
  if (lastVisit) {
    const daysSince = Math.floor((Date.now() - new Date(lastVisit)) / 86400000);
    if (daysSince > 21) score += 20;
    else if (daysSince > 14) score += 10;
  } else {
    score += 20;
  }

  return Math.min(score, 100);
}

function getTrend(prev, curr) {
  if (prev === 0 && curr === 0) return 'inactive';
  if (curr > prev) return 'improving';
  if (curr === prev) return 'stable';
  if (curr < prev && curr === 0) return 'dropped';
  return 'declining';
}

function generateRuleBasedInsight(atRisk) {
  if (!atRisk.length) return 'All members are showing healthy attendance patterns. Keep up the great work!';
  const high = atRisk.filter(m => m.riskLevel === 'high');
  const med  = atRisk.filter(m => m.riskLevel === 'medium');
  const parts = [];
  if (high.length) parts.push(`${high.length} member${high.length > 1 ? 's are' : ' is'} at HIGH churn risk (0 visits in 2+ weeks) and require immediate personal outreach.`);
  if (med.length)  parts.push(`${med.length} member${med.length > 1 ? 's are' : ' is'} showing a declining attendance trend — consider sending an automated re-engagement offer.`);

  const names = high.slice(0, 2).map(m => m.name.split(' ')[0]).join(' and ');
  if (names) parts.push(`Priority action: Contact ${names} directly via the CRM with a personalised check-in message.`);

  return parts.join(' ');
}

async function getOllamaChurnInsight(atRisk) {
  const { callLLM } = require('../llm');
  const summary = atRisk.slice(0, 5).map(m =>
    `${m.name}: ${m.last14Days} visits last 14 days vs ${m.prev14Days} prior. Risk score: ${m.churnScore}%.`
  ).join('\n');
  return callLLM(
    `You are a gym retention specialist for FitZone Elite (UK). Analyse these at-risk members and give a concise 2-3 sentence action recommendation for the trainer:\n\n${summary}`,
    200
  );
}

module.exports = router;
