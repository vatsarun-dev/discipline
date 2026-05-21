import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { env } from '../config/env.js';
import { AIMemory } from '../models/AIMemory.js';
import { buildCoachingPrompt } from '../ai/promptBuilder.js';
import { defaultPersonalities } from '../ai/defaultPersonalities.js';

export async function generateCoachingResponse({ user, task, personality, behavior }) {
  const memory = await AIMemory.findOne({ userId: user._id });
  const selectedPersonality = personality || defaultPersonalities[0];
  const prompt = buildCoachingPrompt({ user, task, personality: selectedPersonality, memory, behavior });

  try {
    if (env.aiProvider === 'groq') {
      return await generateWithGroq({ prompt, personality: selectedPersonality });
    }

    if (env.aiProvider === 'gemini') {
      return await generateWithGemini({ prompt, personality: selectedPersonality });
    }

    throw new Error(`Unsupported AI_PROVIDER: ${env.aiProvider}`);
  } catch (error) {
    console.error('AI coaching generation failed:', error.message);
    return {
      text: fallbackResponse({ task, personality: selectedPersonality }),
      provider: 'fallback',
      model: env.aiProvider,
      personality: selectedPersonality.name,
      warning: 'AI provider generation failed; returned local fallback response.'
    };
  }
}

async function generateWithGemini({ prompt, personality }) {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: env.geminiModel });
  const result = await model.generateContent(prompt);

  return {
    text: result.response.text(),
    provider: 'gemini',
    model: env.geminiModel,
    personality: personality.name
  };
}

async function generateWithGroq({ prompt, personality }) {
  if (!env.groqApiKey) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: env.groqModel,
      messages: [
        {
          role: 'system',
          content: 'You are DisciplineOS, a concise accountability coach. Follow the user personality and safety constraints exactly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.85,
      max_tokens: 220
    },
    {
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    text: response.data.choices?.[0]?.message?.content || fallbackResponse({ task: null, personality }),
    provider: 'groq',
    model: env.groqModel,
    personality: personality.name
  };
}

function fallbackResponse({ task, personality }) {
  return `${personality.name} mode: ${task?.title || 'This commitment'} was not optional. You set the standard, then stepped under it. Reset now, finish the next action, and make the next reminder unnecessary.`;
}
