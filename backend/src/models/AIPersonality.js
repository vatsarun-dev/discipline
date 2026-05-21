import mongoose from 'mongoose';

const aiPersonalitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    isDefault: { type: Boolean, default: false },
    name: { type: String, required: true },
    tone: { type: String, required: true },
    speakingStyle: { type: String, required: true },
    aggressionLevel: { type: Number, min: 1, max: 10, default: 5 },
    motivationalStyle: { type: String, required: true },
    voiceType: { type: String, default: 'balanced' }
  },
  { timestamps: true }
);

aiPersonalitySchema.index({ userId: 1, name: 1 });

export const AIPersonality = mongoose.model('AIPersonality', aiPersonalitySchema);
