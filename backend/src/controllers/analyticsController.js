import { getDashboardSummary, getHeatmap, getWeeklyTrends } from '../services/analyticsService.js';

export async function summary(req, res) {
  return res.json({ summary: await getDashboardSummary(req.user._id) });
}

export async function weekly(req, res) {
  return res.json({ trends: await getWeeklyTrends(req.user._id) });
}

export async function heatmap(req, res) {
  return res.json({ heatmap: await getHeatmap(req.user._id) });
}
