import { createDailyReport } from '../services/notionService.js';

export async function dailyReport(req, res) {
  const result = await createDailyReport({
    title: req.body.title || `Daily Discipline Report - ${new Date().toISOString().slice(0, 10)}`,
    summary: req.body.summary || 'No summary provided.',
    score: req.body.score || 0
  });

  return res.json({ result });
}

export async function weeklySummary(req, res) {
  return res.json({ result: { provider: 'notion', status: 'weekly summary endpoint scaffolded' } });
}
