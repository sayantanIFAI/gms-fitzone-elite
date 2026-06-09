const express = require('express');
const router = express.Router();
const axios = require('axios');

const DATA = 'http://localhost:3001/api';

// GET /api/machine-health
router.get('/', async (req, res) => {
  try {
    const { data: machines } = await axios.get(`${DATA}/machines`);
    const { data: stats }    = await axios.get(`${DATA}/machines/stats`);

    const alerts = [];
    const recommendations = [];

    machines.forEach(m => {
      if (m.status === 'fault') {
        alerts.push({
          machineId: m.id,
          name: m.name,
          severity: 'critical',
          code: m.fault_code,
          message: m.fault_description,
          action: 'Remove from service immediately. Log engineer call-out.',
        });
        recommendations.push(`Schedule urgent maintenance for ${m.name} (${m.fault_code}). Estimated revenue loss: ${m.daily_sessions > 0 ? m.daily_sessions : 'N/A'} sessions/day blocked.`);
      }
      if (m.status === 'maintenance') {
        alerts.push({
          machineId: m.id,
          name: m.name,
          severity: 'info',
          code: 'MAINT',
          message: m.fault_description,
          action: 'Confirm estimated return-to-service date with engineer.',
        });
      }
      // High usage warning
      if (m.total_usage_hours > 2000 && m.status === 'operational') {
        alerts.push({
          machineId: m.id,
          name: m.name,
          severity: 'warning',
          code: 'HIGH-USE',
          message: `${m.total_usage_hours.toLocaleString()} total usage hours — approaching recommended service threshold.`,
          action: 'Schedule preventive maintenance within 30 days.',
        });
      }
    });

    let aiInsight = null;
    if (process.env.ANTHROPIC_API_KEY && alerts.length > 0) {
      aiInsight = await getClaudeMachineInsight(alerts, stats);
    } else {
      aiInsight = buildRuleInsight(alerts, stats);
    }

    res.json({ stats, alerts, recommendations, aiInsight, machines });
  } catch (err) {
    console.error('Machine health error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function buildRuleInsight(alerts, stats) {
  const critical = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');
  const parts = [];

  parts.push(`Fleet uptime is currently ${stats.uptime}% (${stats.operational}/${stats.total} machines operational).`);

  if (critical.length) {
    const names = critical.map(a => a.name).join(', ');
    parts.push(`⚠️ Critical: ${names} ${critical.length > 1 ? 'are' : 'is'} out of service and require immediate engineer attendance.`);
  }
  if (warnings.length) {
    parts.push(`${warnings.length} machine${warnings.length > 1 ? 's are' : ' is'} approaching service thresholds — schedule preventive maintenance to avoid unplanned downtime.`);
  }
  if (!critical.length && !warnings.length) {
    parts.push('All machines are within normal operating parameters.');
  }
  return parts.join(' ');
}

async function getClaudeMachineInsight(alerts, stats) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const alertSummary = alerts.map(a => `${a.name}: ${a.severity} – ${a.message}`).join('\n');
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 250,
    messages: [{
      role: 'user',
      content: `You are the AI maintenance coordinator for FitZone Elite gym (UK). Fleet uptime: ${stats.uptime}%. Alerts:\n${alertSummary}\n\nProvide a 2-sentence prioritised maintenance recommendation for the gym admin.`,
    }],
  });
  return msg.content[0].text;
}

module.exports = router;
