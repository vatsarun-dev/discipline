import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { startReminderSweep } from './jobs/reminderSweep.js';

async function bootstrap() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`DisciplineOS API running on port ${env.port}`);
  });

  startReminderSweep();
}

bootstrap().catch((error) => {
  console.error('Failed to start DisciplineOS API', error);
  process.exit(1);
});
