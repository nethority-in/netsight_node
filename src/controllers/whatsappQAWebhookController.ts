/**
 * WhatsApp Q&A Webhook Controller
 * POST /api/whatsapp/webhook
 *
 * Flow:
 *  1. Twilio / Postman sends { From, Body }
 *  2. Extract user question from `Body`
 *  3. Load qa_data.json
 *  4. Match question using case-insensitive string includes()
 *  5. Reply with matched answer, or a fallback message
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Types ───────────────────────────────────────────────────────────────────

interface QAItem {
  question: string;
  answer: string;
}

interface QAData {
  questions: QAItem[];
}

// ─── loadQAData ───────────────────────────────────────────────────────────────

/**
 * Reads and parses qa_data.json from src/data/.
 * Called fresh on every request so edits to the JSON take effect immediately.
 */
export function loadQAData(): QAData {
  const dataPath = path.join(__dirname, '../data/qa_data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw) as QAData;
}

// ─── matchAnswer ──────────────────────────────────────────────────────────────

/**
 * Searches qa_data questions for a match against the user's input.
 * Matching strategy (both directions, case-insensitive):
 *   - stored question includes the user input, OR
 *   - user input includes the stored question
 * Returns the matched answer string, or null if nothing matched.
 */
export function matchAnswer(userQuestion: string, qaData: QAData): string | null {
  const input = userQuestion.toLowerCase().trim();

  for (const item of qaData.questions) {
    const stored = item.question.toLowerCase().trim();
    if (stored.includes(input) || input.includes(stored)) {
      return item.answer;
    }
  }

  return null;
}

// export async function askClaude(userQuestion: string, qaData: QAData): Promise<string> {
//   const apiKey = process.env.ANTHROPIC_API_KEY;

//   const response = await axios.post(
//     'https://api.anthropic.com/v1/messages',
//     {
//       model: 'claude-3-5-haiku-20241022',
//       max_tokens: 256,
//       system: 'You are a store analytics assistant. Answer user questions ONLY from the provided JSON data. No extra text. Just the answer.',
//       messages: [{
//         role: 'user',
//         content: `Here is the Q&A data:\n${JSON.stringify(qaData, null, 2)}\n\nUser question: ${userQuestion}`
//       }]
//     },
//     {
//       headers: {
//         'x-api-key': apiKey,
//         'anthropic-version': '2023-06-01',
//         'Content-Type': 'application/json'
//       }
//     }
//   );

//   return response.data.content[0].text;
// }


// ─── sendWhatsAppReply ────────────────────────────────────────────────────────

/**
 * Sends the answer back to the WhatsApp user via Twilio TwiML inline response.
 * Twilio reads the <Message> element and delivers it to the user.
 */
export function sendWhatsAppReply(res: Response, answer: string): void {
  const safe = answer
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  res.type('text/xml');
  res.status(200).send(twiml);
}

// ─── webhookHandler ───────────────────────────────────────────────────────────

/**
 * POST /api/whatsapp/webhook
 *
 * Twilio sends:  application/x-www-form-urlencoded  { From, Body, ... }
 * Postman test:  application/json                   { "From": "...", "Body": "..." }
 * Both are supported because express.urlencoded + express.json are both active.
 */

export function webhookHandler(req: Request, res: Response): void {
  const from = (req.body?.From ?? '') as string;
  const userQuestion = ((req.body?.Body as string) ?? '').trim();

  console.log('📩 WhatsApp Q&A webhook received:', { from, question: userQuestion });

  if (!userQuestion) {
    sendWhatsAppReply(res, 'Please send a question and I will look it up for you.');
    return;
  }

  try {
    const qaData = loadQAData();
    const answer = matchAnswer(userQuestion, qaData);

    // const answer = await askClaude(userQuestion, qaData);
    // sendWhatsAppReply(res, answer);

    if (answer) {
      console.log('✅ Match found:', answer);
      sendWhatsAppReply(res, answer);
    } else {
      console.log('❌ No match for:', userQuestion);
      sendWhatsAppReply(res, "Sorry, I don't have answer for this question.");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Webhook error:', msg);
    sendWhatsAppReply(res, 'Something went wrong. Please try again.');
  }
}
