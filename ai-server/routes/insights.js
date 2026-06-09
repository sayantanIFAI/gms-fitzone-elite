const express = require('express');
const router = express.Router();
const axios = require('axios');

const DATA = 'http://localhost:3001/api';

// GET /api/insights/gym – admin overview AI analysis
router.get('/gym', async (req, res) => {
  try {
    const [memberStats, machineStats, paymentStats] = await Promise.all([
      axios.get(`${DATA}/members/stats`),
      axios.get(`${DATA}/machines/stats`),
      axios.get(`${DATA}/payments/stats`),
    ]);

    const ms = memberStats.data;
    const mc = machineStats.data;
    const ps = paymentStats.data;

    const kpis = [
      { label: 'Active Members', value: ms.active, icon: '👥', color: '#10b981' },
      { label: 'At-Risk Members', value: ms.defaulted, icon: '⚠️', color: '#f59e0b' },
      { label: 'Access Locked', value: ms.locked, icon: '🔒', color: '#ef4444' },
      { label: 'Machine Uptime', value: `${mc.uptime}%`, icon: '⚙️', color: mc.uptime >= 85 ? '#10b981' : '#ef4444' },
      { label: 'DD Success Rate', value: `${ps.successRate}%`, icon: '💳', color: ps.successRate >= 95 ? '#10b981' : '#f59e0b' },
      { label: 'Monthly Revenue', value: `£${ps.totalRevenue.toFixed(2)}`, icon: '£', color: '#7c3aed' },
    ];

    const flags = [];
    if (mc.fault > 0)          flags.push({ severity: 'critical', message: `${mc.fault} machine${mc.fault > 1 ? 's' : ''} out of service — revenue impact likely.` });
    if (mc.maintenance > 0)    flags.push({ severity: 'info',     message: `${mc.maintenance} machine${mc.maintenance > 1 ? 's' : ''} in scheduled maintenance.` });
    if (ms.defaulted > 0)      flags.push({ severity: 'warning',  message: `${ms.defaulted} member${ms.defaulted > 1 ? 's' : ''} with failed Direct Debit payments — recovery action needed.` });
    if (ms.locked > 0)         flags.push({ severity: 'critical', message: `${ms.locked} member account${ms.locked > 1 ? 's' : ''} locked due to repeated payment failures.` });
    if (ps.successRate < 95)   flags.push({ severity: 'warning',  message: `DD success rate dropped to ${ps.successRate}% — below the 95% industry benchmark.` });

    let aiInsight = await getOllamaGymInsight(ms, mc, ps, flags);
    if (!aiInsight) aiInsight = buildAdminInsight(ms, mc, ps, flags);

    res.json({ kpis, flags, aiInsight });
  } catch (err) {
    console.error('Insights error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function buildAdminInsight(ms, mc, ps, flags) {
  const parts = [];
  parts.push(`FitZone Elite has ${ms.active} active members with a ${ps.successRate}% Direct Debit collection rate.`);
  if (flags.filter(f => f.severity === 'critical').length) {
    parts.push('Immediate attention is required for machine outages and locked accounts to prevent member experience deterioration.');
  } else if (flags.length) {
    parts.push('Review the flagged items below and action the Direct Debit recovery workflow for defaulting members.');
  } else {
    parts.push('All KPIs are within target ranges — the gym is performing well across all metrics.');
  }
  return parts.join(' ');
}

async function getOllamaGymInsight(ms, mc, ps, flags) {
  const { callLLM } = require('../llm');
  const context = `Active members: ${ms.active}, Defaulted: ${ms.defaulted}, Locked: ${ms.locked}, Machine uptime: ${mc.uptime}%, DD success rate: ${ps.successRate}%, Monthly revenue: £${ps.totalRevenue.toFixed(2)}. Flags: ${flags.map(f => f.message).join('; ')}`;
  return callLLM(
    `You are the AI business intelligence engine for FitZone Elite gym (UK). Provide a concise 2-sentence executive summary and top priority action for the gym admin based on: ${context}`,
    180
  );
}

module.exports = router;
