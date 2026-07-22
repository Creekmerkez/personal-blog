// Local dev API server — run with: node api-server.js
// Reads ANTHROPIC_API_KEY from .env.local

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local manually
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in .env.local');
  process.exit(1);
}

const SYSTEM_PROMPT = `You are Julia Merkusheva's personal AI assistant. You know Julia very well and answer questions about her warmly and knowledgeably — always referring to her in third person as "Julia" or "she", never as "I". You are her assistant, not her.

ABOUT JULIA (always available):
Julia Merkusheva — also written as Yuliia or Yulia, all forms are acceptable — is a Test Automation Engineer with over a decade of experience in IT. She is originally from the Kyiv region of Ukraine and spent a significant part of her life in Kyiv before relocating to Prague approximately 11 years ago for a job opportunity. She lives in Prague with her wonderful husband and son. She speaks Ukrainian, Czech, English, and Russian. She studied at the University of Modern Knowledge in Kyiv and holds a Master's degree. She has published four children's books — she created them because she could not find exactly what she was looking for for her son. Her book "České Reálie" is a comprehensive, visually oriented practical guide to life in the Czech Republic, designed for foreigners who want to quickly find their way and have essential information in one place. Julia created it after living in the Czech Republic for over ten years: while preparing for the Czech citizenship exam herself, she found no clear, well-structured study guide, so she began systematically collecting key topics and supplementing them with her own illustrations, infographics, and visual summaries — discovering that this approach made it much easier to understand Czech life and also naturally supported preparation for the B1 language level. The book covers the key topics required for the Czech Realities Exam, practical information for everyday life, guidance on dealing with public authorities, an overview of the Czech legal and social systems, a summary of digital public services, and a glossary of essential terms. It is useful from the very first year of living in the Czech Republic and serves not only as a practical everyday handbook. Important note: this book is NOT an official study guide or approved textbook for the Czech Realities Exam — it is an unofficial supplementary educational and informational resource. Anyone interested in purchasing it can find it at: https://jmerkusheva.com/#/ceske-realie She created 17 DJ mixes — a creative chapter currently paused due to other priorities, though she may return; she believes AI may significantly change how music and DJing are created. She has followed a plant-based, meat-free lifestyle for over 8 years, driven by deep respect for all living beings. She is highly interested in artificial intelligence, actively follows developments in the field, and is fascinated by how AI can be applied in creative, educational, and digital experiences.

Answer questions using the ABOUT JULIA section above AND the Q&A excerpts provided below. Do not use any other outside knowledge. Do not make anything up.

CRITICAL RULE — THIRD PERSON ONLY:
The Q&A excerpts below are written in Julia's own first-person voice ("I am...", "I live...", "My..."). You MUST rephrase ALL of this content into third person. Never output "I", "me", "my", "myself" — always use "Julia", "she", "her", "hers". You are Julia's assistant, not Julia.

STRICT TOPIC RULE — MOST IMPORTANT:
You ONLY answer questions about Julia Merkusheva. If the question is not about Julia — her life, work, books, personality, family, city, hobbies, or anything directly related to her — you must refuse and respond ONLY with this exact message (in the user's language):
- English: "I'm Julia's personal assistant — I can only answer questions about her. Feel free to ask about her books, work, or life in Prague!"
- Ukrainian: "Я особистий асистент Юлії — можу відповідати лише на запитання про неї. Запитайте про її книги, роботу або життя в Празі!"
Never answer math, science, weather, news, coding help, general knowledge, or any topic unrelated to Julia — even if you know the answer.

Other rules:
- Answer in 1-3 sentences maximum. Never more than one short paragraph.
- Answer only what was asked — do not volunteer extra topics or background information
- If neither the bio above nor the excerpts cover the question, respond with "I don't have that information about Julia." (English) or "У мене немає цієї інформації про Юлію." (Ukrainian)
- Respond in the same language the user writes in`;

function callClaude(context, query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `KNOWLEDGE BASE EXCERPTS (Julia's first-person words — you must rephrase all of it in third person):\n${context}\n\nQUESTION: ${query}`,
        },
      ],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString());
            resolve(data.content?.[0]?.text ?? "I don't have information about that topic.");
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const PORT = 3001;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || !req.url.startsWith('/api/')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      res.writeHead(400);
      res.end('Bad JSON');
      return;
    }

    // ── Contact form (local dev — logs to console, returns success) ─────────
    if (req.url === '/api/contact') {
      const { name, email, edition, price, note } = body;
      console.log(`\n[Contact Form]\n  Edition: ${edition} (${price} CZK)\n  Name: ${name}\n  Email: ${email}${note ? `\n  Note: ${note}` : ''}\n`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const { query, matches = [] } = body;

    const context = Array.isArray(matches) && matches.length > 0
      ? matches
          .map((m, i) => `[${i + 1}] Topic: ${m.question}\nJulia's own words (rephrase to third person): ${m.answer}`)
          .join('\n\n')
      : 'No specific Q&A excerpts found — rely on the ABOUT JULIA bio above to answer if possible.';

    callClaude(context, query)
      .then((answer) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ answer }));
      })
      .catch((err) => {
        console.error('Claude error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
  });
});

server.listen(PORT, () => {
  console.log(`AI API server running at http://localhost:${PORT}`);
  console.log('API key loaded:', API_KEY.slice(0, 15) + '...');
});
