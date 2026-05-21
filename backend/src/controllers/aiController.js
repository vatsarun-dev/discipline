import { AIPersonality } from '../models/AIPersonality.js';
import { Task } from '../models/Task.js';
import { defaultPersonalities } from '../ai/defaultPersonalities.js';
import { generateCoachingResponse } from '../services/aiService.js';
import { personalityCreateSchema, personalityUpdateSchema } from '../validators/personalitySchemas.js';

export async function listPersonalities(req, res) {
  const custom = await AIPersonality.find({ userId: req.user._id });
  return res.json({ personalities: [...defaultPersonalities.map((item) => ({ ...item, isDefault: true })), ...custom] });
}

export async function createPersonality(req, res) {
  const input = personalityCreateSchema.parse(req.body);
  const personality = await AIPersonality.create({ ...input, userId: req.user._id, isDefault: false });
  return res.status(201).json({ personality });
}

export async function updatePersonality(req, res) {
  const input = personalityUpdateSchema.parse(req.body);
  const personality = await AIPersonality.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    input,
    { new: true, runValidators: true }
  );

  if (!personality) return res.status(404).json({ message: 'Personality not found' });
  return res.json({ personality });
}

export async function deletePersonality(req, res) {
  const personality = await AIPersonality.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!personality) return res.status(404).json({ message: 'Personality not found' });
  return res.status(204).send();
}

export async function coach(req, res) {
  const task = req.body.taskId ? await Task.findOne({ _id: req.body.taskId, userId: req.user._id }) : null;
  const response = await generateCoachingResponse({
    user: req.user,
    task,
    personality: req.body.personality,
    behavior: req.body.behavior || {}
  });

  return res.json({ response });
}
