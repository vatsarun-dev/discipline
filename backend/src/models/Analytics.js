import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    disciplineScore: { type: Number, default: 0 },
    lazinessScore: { type: Number, default: 0 },
    consistencyPercentage: { type: Number, default: 0 },
    productivityTrends: { type: [Number], default: [] },
    activeHours: { type: [Number], default: [] },
    habitCompletionRate: { type: Number, default: 0 },
    missedTaskCount: { type: Number, default: 0 },
    insights: [String]
  },
  { timestamps: true }
);

export const Analytics = mongoose.model('Analytics', analyticsSchema);
