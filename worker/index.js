/**
 * Cloudflare Worker — Julia AI chat proxy
 *
 * Setup (one-time):
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler secret put ANTHROPIC_API_KEY   ← your Anthropic key
 *   4. wrangler secret put RESEND_API_KEY      ← your Resend key (resend.com, free)
 *   5. wrangler deploy
 *
 * Copy the deployed URL into HolographicAI.jsx → WORKER_URL constant.
 */

const SYSTEM_PROMPT = `You are Julia Merkusheva's personal AI assistant. You know Julia very well and answer questions about her warmly and knowledgeably — always referring to her in third person as "Julia" or "she", never as "I". You are her assistant, not her.

ABOUT JULIA (always available):
Julia Merkusheva — also written as Yuliia or Yulia, all forms are acceptable — is a Test Automation Engineer with over a decade of experience in IT. She is originally from the Kyiv region of Ukraine and spent a significant part of her life in Kyiv before relocating to Prague approximately 11 years ago for a job opportunity. She lives in Prague with her wonderful husband and son. She speaks Ukrainian, Czech, English, and Russian. She studied at the University of Modern Knowledge in Kyiv and holds a Master's degree. She has published four children's books — she created them because she could not find exactly what she was looking for for her son. Her book "České Reálie" is a comprehensive, visually oriented practical guide to life in the Czech Republic, designed for foreigners who want to quickly find their way and have essential information in one place. Julia created it after living in the Czech Republic for over ten years: while preparing for the Czech citizenship exam herself, she found no clear, well-structured study guide, so she began systematically collecting key topics and supplementing them with her own illustrations, infographics, and visual summaries — discovering that this approach made it much easier to understand Czech life and also naturally supported preparation for the B1 language level. The book covers the key topics required for the Czech Realities Exam, practical information for everyday life, guidance on dealing with public authorities, an overview of the Czech legal and social systems, a summary of digital public services, and a glossary of essential terms. It is useful from the very first year of living in the Czech Republic and serves not only as a study guide but also as a practical everyday handbook. Important note: this book is NOT an official study guide or approved textbook for the Czech Realities Exam — it is an unofficial supplementary educational and informational resource. Anyone interested in purchasing it can find it at: https://jmerkusheva.com/#/ceske-realie She created 17 DJ mixes — a creative chapter currently paused due to other priorities, though she may return; she believes AI may significantly change how music and DJing are created. She has followed a plant-based, meat-free lifestyle for over 8 years, driven by deep respect for all living beings. She is highly interested in artificial intelligence, actively follows developments in the field, and is fascinated by how AI can be applied in creative, educational, and digital experiences.

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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // ── Contact form ────────────────────────────────────────────────────────
    if (url.pathname === '/api/contact') {
      const { name, email, edition, price, note } = body;
      if (!name || !email || !edition) {
        return new Response('Missing required fields', { status: 400 });
      }

      if (!env.RESEND_API_KEY) {
        return new Response('Email not configured', { status: 503 });
      }

      const emailText = [
        `New book order request`,
        ``,
        `Edition: ${edition} (${price} CZK)`,
        `Name: ${name}`,
        `Email: ${email}`,
        note ? `Note: ${note}` : null,
        ``,
        `Time: ${new Date().toISOString()}`,
      ].filter(Boolean).join('\n');

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'České Reálie <onboarding@resend.dev>',
            to: ['julia.merkusheva@gmail.com'],
            reply_to: email,
            subject: `Book Order: ${edition} — from ${name}`,
            text: emailText,
          }),
        });
        if (!res.ok) throw new Error('Resend error');
        return Response.json({ ok: true }, { headers: CORS });
      } catch {
        return new Response('Email send failed', { status: 502 });
      }
    }

    // ── AI chat ─────────────────────────────────────────────────────────────
    const { query, lang = 'en', matches = [] } = body;

    if (!query || typeof query !== 'string' || query.length > 500) {
      return new Response('Invalid query', { status: 400 });
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
      return new Response('Upstream error', { status: 502 });
    }

    // Fire-and-forget email via Resend
    if (env.RESEND_API_KEY) {
      const emailText = [
        `New question on MY AI`,
        ``,
        `Language: ${lang.toUpperCase()}`,
        `Question: ${query}`,
        ``,
        `Matched topics:`,
        ...matches.map((m) => `  • ${m.question}`),
        ``,
        `Julia's AI answered:`,
        answer,
        ``,
        `Time: ${new Date().toISOString()}`,
      ].join('\n');

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'MY AI <onboarding@resend.dev>',
          to: ['julia.merkusheva@gmail.com'],
          subject: `MY AI — new question (${lang.toUpperCase()})`,
          text: emailText,
        }),
      }).catch(() => {});
    }

    return Response.json({ answer }, { headers: CORS });
  },
};
