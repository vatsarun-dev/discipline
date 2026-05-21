import axios from 'axios';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');
const voiceCacheDir = path.join(backendRoot, 'storage', 'voice-cache');

export async function generateVoice({ text, voiceId = env.elevenLabsDefaultVoiceId }) {
  if (!env.elevenLabsApiKey || !voiceId) {
    return {
      audioUrl: null,
      cached: false,
      provider: 'disabled'
    };
  }

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.38,
        similarity_boost: 0.75,
        style: 0.55,
        use_speaker_boost: true
      }
    },
    {
      headers: {
        'xi-api-key': env.elevenLabsApiKey,
        Accept: 'audio/mpeg'
      },
      responseType: 'arraybuffer'
    }
  );

  await fs.mkdir(voiceCacheDir, { recursive: true });
  const fileName = `${crypto.createHash('sha1').update(`${voiceId}:${text}`).digest('hex')}.mp3`;
  const filePath = path.join(voiceCacheDir, fileName);
  await fs.writeFile(filePath, Buffer.from(response.data));

  return {
    audioUrl: `/voice-cache/${fileName}`,
    filePath,
    cached: false,
    provider: 'elevenlabs'
  };
}
