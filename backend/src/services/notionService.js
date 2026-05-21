import { Client } from '@notionhq/client';
import { env } from '../config/env.js';

function getNotionClient() {
  if (!env.notionApiKey) {
    return null;
  }
  return new Client({ auth: env.notionApiKey });
}

export async function createDailyReport({ title, summary, score }) {
  const notion = getNotionClient();
  if (!notion || !env.notionDailyReportsDatabaseId) {
    return { provider: 'disabled', pageId: null };
  }

  const page = await notion.pages.create({
    parent: { database_id: env.notionDailyReportsDatabaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Score: { number: score }
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: summary } }] }
      }
    ]
  });

  return { provider: 'notion', pageId: page.id };
}
