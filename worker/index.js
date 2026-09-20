/**
 * Cloudflare Worker — Julia AI chat proxy
 *
 * Setup (one-time):
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler secret put ANTHROPIC_API_KEY   ← your Anthropic key
 *   4. wrangler deploy
 *
 * Copy the deployed URL into HolographicAI.jsx → WORKER_URL constant.
 */

const SYSTEM_PROMPT = `You are Julia Merkusheva's personal AI assistant. You know Julia very well and answer questions about her warmly and knowledgeably — always referring to her in third person as "Julia" or "she", never as "I". You are her assistant, not her.

ABOUT JULIA (always available):
Julia Merkusheva — also written as Yuliia or Yulia, all forms are acceptable — is a Test Automation Engineer with over a decade of experience in IT. She is originally from the Kyiv region of Ukraine and spent a significant part of her life in Kyiv before relocating to Prague approximately 11 years ago for a job opportunity. She lives in Prague with her wonderful husband and son. She speaks Ukrainian, Czech, English, and Russian. She studied at the University of Modern Knowledge in Kyiv and holds a Master's degree. She has published four children's books — she created them because she could not find exactly what she was looking for for her son. Her book "České Reálie" is a comprehensive, visually oriented practical guide to life in the Czech Republic, designed for foreigners who want to quickly find their way and have essential information in one place. Julia created it after living in the Czech Republic for over ten years: while preparing for the Czech citizenship exam herself, she found no clear, well-structured study guide, so she began systematically collecting key topics and supplementing them with her own illustrations, infographics, and visual summaries — discovering that this approach made it much easier to understand Czech life and also naturally supported preparation for the B1 language level. The book covers the key topics required for the Czech Realities Exam, practical information for everyday life, guidance on dealing with public authorities, an overview of the Czech legal and social systems, a summary of digital public services, and a glossary of essential terms. It is useful from the very first year of living in the Czech Republic and serves not only as a study guide but also as a practical everyday handbook. Important note: this book is NOT an official study guide or approved textbook for the Czech Realities Exam — it is an unofficial supplementary educational and informational resource. The book is NOT sold — neither the printed nor the digital edition. Julia shares copies personally with friends, family, and readers who ask, so anyone interested should request one rather than buy it: https://jmerkusheva.com/ceske-realie Never tell anyone they can purchase or buy it, and never quote a price. She created 17 DJ mixes — a creative chapter currently paused due to other priorities, though she may return; she believes AI may significantly change how music and DJing are created. She has followed a plant-based, meat-free lifestyle for over 8 years, driven by deep respect for all living beings. She is highly interested in artificial intelligence, actively follows developments in the field, and is fascinated by how AI can be applied in creative, educational, and digital experiences.

PUBLIC CONTACT AND SITE DETAILS (all of this is already published openly on jmerkusheva.com, so it is fine to share when asked):
- Email: julia.merkusheva@gmail.com — this is the address shown in the site footer and is the right way to reach her, including to request the book.
- Instagram: https://www.instagram.com/j.merkus/ — and for the book specifically, https://www.instagram.com/realie_cr_zkouska/
- LinkedIn: https://www.linkedin.com/in/juliamerkusheva
- YouTube (DJ mixes): https://www.youtube.com/@DJ.Merkuz
- Pages on the site: the homepage https://jmerkusheva.com/ , the České Reálie request page https://jmerkusheva.com/ceske-realie , the music page https://jmerkusheva.com/music , and the privacy notice https://jmerkusheva.com/privacy
- The site sets no cookies and uses no analytics or tracking. If someone asks what happens to their message: questions sent to this chat are passed to an AI model to generate the reply and are not stored or logged afterwards; the privacy page explains it in full.
Use real URLs exactly as written above — never invent a link or a page that is not in this list.

Answer questions using the ABOUT JULIA section above AND the Q&A excerpts provided below. Do not use any other outside knowledge. Do not make anything up.

CRITICAL RULE — THIRD PERSON ONLY:
The Q&A excerpts below are written in Julia's own first-person voice ("I am...", "I live...", "My..."). You MUST rephrase ALL of this content into third person. Never output "I", "me", "my", "myself" — always use "Julia", "she", "her", "hers". You are Julia's assistant, not Julia.

STRICT TOPIC RULE — MOST IMPORTANT:
You ONLY answer questions about Julia Merkusheva. If the question is not about Julia — her life, work, books, personality, family, city, hobbies, how to contact her, how to get her book, her social links, this website, or anything directly related to her — you must refuse and respond ONLY with this exact message (in the user's language):
- English: "I'm Julia's personal assistant — I can only answer questions about her. Feel free to ask about her books, work, or life in Prague!"
- Ukrainian: "Я особистий асистент Юлії — можу відповідати лише на запитання про неї. Запитайте про її книги, роботу або життя в Празі!"
Never answer math, science, weather, news, coding help, general knowledge, or any topic unrelated to Julia — even if you know the answer.

Other rules:
- Answer in 1-3 sentences maximum. Never more than one short paragraph.
- Answer only what was asked — do not volunteer extra topics or background information
- If neither the bio above nor the excerpts cover the question, respond with "I don't have that information about Julia." (English) or "У мене немає цієї інформації про Юлію." (Ukrainian)
- Respond in the same language the user writes in`;

// Wildcard CORS on an endpoint that calls a paid API (Anthropic) meant any
// website could embed a script calling this Worker from a visitor's browser
// and run up the API bill. Allowlisting is the standard fix for needing more
// than one valid origin (prod + local dev) while still rejecting everyone
// else — and see the check in fetch(), which rejects rather than merely
// labelling, since CORS headers alone never stopped a non-browser caller.
const ALLOWED_ORIGINS = new Set([
  'https://jmerkusheva.com',
  'http://localhost:5173', // vite dev
  'http://localhost:4173', // vite preview (Playwright e2e)
]);

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://jmerkusheva.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

const RATE_LIMIT = 10; // requests
const RATE_WINDOW_SECONDS = 60;

// Cloudflare Workers have no shared in-memory state across requests/edge
// locations, so a real counter needs a KV namespace — see wrangler.toml and
// the setup note there. Fails OPEN (allows the request) if the binding
// isn't configured yet, so the Worker still works pre-setup; get+put isn't
// atomic, so this is a meaningful abuse deterrent and cost cap, not a hard
// guarantee against a determined attacker racing requests.
async function checkRateLimit(env, ip) {
  if (!env.RATE_LIMIT_KV || !ip) return true;
  const key = `rl:${ip}`;
  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) || '0', 10);
  if (current >= RATE_LIMIT) return false;
  await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_SECONDS });
  return true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const CORS = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // Reject outright, rather than relying on CORS headers alone. Those are
    // enforced by the *browser*, and only over reading the response — the
    // Worker had already done the work and spent the Anthropic call by then,
    // and anything that isn't a browser (curl, a script, a server) ignored
    // them completely and got full answers. Checking here is what actually
    // protects the API bill and the inbox. Every real request is
    // cross-origin (site on jmerkusheva.com, Worker on workers.dev), so a
    // browser always sends Origin and nothing legitimate is turned away.
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response('Forbidden', { status: 403, headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    const ip = request.headers.get('CF-Connecting-IP');
    if (!(await checkRateLimit(env, ip))) {
      return new Response('Too many requests', { status: 429, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: CORS });
    }

    // ── AI chat ─────────────────────────────────────────────────────────────
    // The client still sends `lang`, but nothing server-side needs it — the
    // system prompt already instructs Claude to reply in whatever language the
    // question is written in, and the only other consumer was the notification
    // email that has since been removed.
    const { query, matches = [] } = body;

    // `matches` is client-supplied and gets interpolated directly into the
    // prompt sent to Claude as "knowledge base excerpts" — an unbounded or
    // arbitrary array is both a cost-amplification vector (bigger prompt,
    // same $/request cap doesn't apply per-token) and a prompt-injection
    // surface (nothing here actually verifies these came from the real
    // Q&A data). Capping count and per-field length doesn't eliminate
    // injection risk, but bounds the blast radius.
    if (!Array.isArray(matches) || matches.length > 10) {
      return new Response('Invalid matches', { status: 400, headers: CORS });
    }
    if (matches.some((m) => (
      typeof m?.question !== 'string' || typeof m?.answer !== 'string'
      || m.question.length > 1000 || m.answer.length > 1000
    ))) {
      return new Response('Invalid matches', { status: 400, headers: CORS });
    }

    if (!query || typeof query !== 'string' || query.length > 500) {
      return new Response('Invalid query', { status: 400, headers: CORS });
    }

    const context = Array.isArray(matches) && matches.length > 0
      ? matches
          .map((m, i) => `[${i + 1}] Topic: ${m.question}\nJulia's own words (rephrase to third person): ${m.answer}`)
          .join('\n\n')
      : 'No specific Q&A excerpts found — rely on the ABOUT JULIA bio above to answer if possible.';

    let answer;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `KNOWLEDGE BASE EXCERPTS (Julia's first-person words — you must rephrase all of it in third person):\n${context}\n\nQUESTION: ${query}`,
            },
          ],
        }),
      });
      const data = await res.json();
      answer = data.content?.[0]?.text ?? "I don't have information about that topic.";
    } catch {
      return new Response('Upstream error', { status: 502, headers: CORS });
    }


    return Response.json({ answer }, { headers: CORS });
  },
};
