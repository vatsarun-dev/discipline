import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const audioRoot = path.join(repoRoot, 'assets', 'audio');
const audioCount = 8;

export const reminderStages = ['first-reminder', 'second-reminder', 'final-reminder'];

export function stageCopy(stage) {
  if (stage === 'final-reminder') {
    return 'Final warning. This commitment is now a discipline test. Complete it or own the miss.';
  }

  if (stage === 'second-reminder') {
    return 'You ignored the first call. Reset now and prove this task still matters.';
  }

  return 'Your reminder is active. Start now while the decision is still clean.';
}

export async function selectPredefinedAudio({ stage = 'first-reminder', lastPlayedAudio, seed = '' }) {
  const safeStage = reminderStages.includes(stage) ? stage : 'first-reminder';
  await fs.mkdir(path.join(audioRoot, safeStage), { recursive: true });

  const available = await getAvailableAudio(safeStage);
  if (!available.length) {
    return {
      audioUrl: null,
      provider: 'predefined-missing',
      stage: safeStage,
      cached: true,
      error: `No MP3 files found in assets/audio/${safeStage}. Add 1.mp3 through 8.mp3.`
    };
  }

  const candidates = available.length > 1
    ? available.filter((item) => item.url !== lastPlayedAudio)
    : available;
  const selected = candidates[pickIndex({ count: candidates.length, seed: `${seed}:${Date.now()}` })];

  return {
    audioUrl: selected.url,
    filePath: selected.filePath,
    provider: 'predefined',
    stage: safeStage,
    cached: true
  };
}

async function getAvailableAudio(stage) {
  const files = await Promise.all(
    Array.from({ length: audioCount }, async (_, index) => {
      const fileName = `${index + 1}.mp3`;
      const filePath = path.join(audioRoot, stage, fileName);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile() || stat.size === 0) return null;
        return {
          filePath,
          url: `/assets/audio/${stage}/${fileName}`
        };
      } catch {
        return null;
      }
    })
  );

  return files.filter(Boolean);
}

function pickIndex({ count, seed }) {
  if (count <= 1) return 0;
  const digest = crypto.createHash('sha1').update(seed || crypto.randomUUID()).digest();
  return digest.readUInt32BE(0) % count;
}
