import { describe, it, expect } from 'vitest';
import { detectLang, isGreeting, isGeneralQuery, isAboutAI, searchQA } from './qaSearch';

describe('detectLang', () => {
  it('detects Ukrainian from Cyrillic text (positive)', () => {
    expect(detectLang('Привіт, як справи?')).toBe('ua');
  });

  it('detects English from Latin text (positive)', () => {
    expect(detectLang('Hello, how are you?')).toBe('en');
  });

  it('falls back to English on empty input (negative)', () => {
    expect(detectLang('')).toBe('en');
  });

  it('treats mixed-script text as Ukrainian if any Cyrillic is present (edge case)', () => {
    expect(detectLang('hello привіт')).toBe('ua');
  });

  it('does not misclassify numbers/punctuation-only input as Ukrainian (negative)', () => {
    expect(detectLang('12345 !?.,')).toBe('en');
  });
});

describe('isGreeting', () => {
  it('matches a plain "hi" (positive)', () => {
    expect(isGreeting('hi')).toBe(true);
  });

  it('matches a Ukrainian greeting with trailing punctuation (positive)', () => {
    expect(isGreeting('привіт!')).toBe(true);
  });

  it('matches with surrounding whitespace (positive, trimmed)', () => {
    expect(isGreeting('  hello  ')).toBe(true);
  });

  it('does not match a real question that merely starts with a greeting word (negative)', () => {
    // The regex is anchored (^...$) specifically so "hi, what does Julia do"
    // isn't swallowed as a no-op greeting reply.
    expect(isGreeting('hi, what does Julia do')).toBe(false);
  });

  it('does not match an unrelated sentence (negative)', () => {
    expect(isGreeting('tell me about her books')).toBe(false);
  });

  it('does not match an empty string (negative)', () => {
    expect(isGreeting('')).toBe(false);
  });
});

describe('isGeneralQuery', () => {
  it('matches "tell me about Julia" (positive)', () => {
    expect(isGeneralQuery('tell me about Julia')).toBe(true);
  });

  it('matches the Ukrainian equivalent (positive)', () => {
    expect(isGeneralQuery('розкажи про Юлію')).toBe(true);
  });

  it('does not match a narrow, specific question (negative)', () => {
    expect(isGeneralQuery('what programming languages does she use')).toBe(false);
  });
});

describe('isAboutAI', () => {
  it('matches "are you a bot" (positive)', () => {
    expect(isAboutAI('are you a bot?')).toBe(true);
  });

  it('matches "who made you" (positive)', () => {
    expect(isAboutAI('who made you')).toBe(true);
  });

  it('does not match a question about Julia herself (negative)', () => {
    expect(isAboutAI('does Julia have kids?')).toBe(false);
  });
});

describe('searchQA', () => {
  it('routes a general "tell me about" query to the overview answers (positive)', () => {
    const results = searchQA('tell me about Julia', 'en', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('answer');
  });

  it('returns a hardcoded, final answer for a known topic route (positive)', () => {
    const results = searchQA('does she have a husband?', 'en');
    expect(results).toHaveLength(1);
    expect(results[0].final).toBe(true);
    expect(results[0].answer).toMatch(/husband/i);
  });

  it('returns the Ukrainian variant of a hardcoded route when lang is "ua" (positive)', () => {
    const results = searchQA('чи є в неї чоловік?', 'ua');
    expect(results[0].answer).toMatch(/чоловік/i);
  });

  it('falls back to fuzzy search for an unmatched-but-plausible query (edge case)', () => {
    const results = searchQA('what does she do for work', 'en');
    expect(Array.isArray(results)).toBe(true);
  });

  it('returns an array (not throwing) for gibberish input (negative)', () => {
    expect(() => searchQA('asdkjfh qwoeiruqwoe zxcvzxcv', 'en')).not.toThrow();
    const results = searchQA('asdkjfh qwoeiruqwoe zxcvzxcv', 'en');
    expect(Array.isArray(results)).toBe(true);
  });

  it('does not throw on an empty query (negative)', () => {
    expect(() => searchQA('', 'en')).not.toThrow();
  });
});

describe('searchQA: the blog', () => {
  it('answers questions about the blog with its link, in both languages (positive)', () => {
    const [ua] = searchQA('Про що Юля пише в своєму блозі', 'ua');
    expect(ua.final).toBe(true);
    expect(ua.answer).toContain('https://jmerkusheva.com/blog');
    const [en] = searchQA('Does Julia have a blog?', 'en');
    expect(en.answer).toContain('https://jmerkusheva.com/blog');
    expect(searchQA('Where can I read her essays?', 'en')[0].answer).toContain('/blog');
    expect(searchQA('Де почитати її есе?', 'ua')[0].answer).toContain('/blog');
    expect(searchQA('Що нового в блогах Юлії?', 'ua')[0].answer).toContain('/blog');
  });

  it('does not take "весело" or other questions for the blog (negative)', () => {
    expect(searchQA('Чи весело їй у Празі?', 'ua')[0]?.answer ?? '').not.toContain('/blog');
    expect(searchQA('Where does Julia live?', 'en')[0]?.answer ?? '').not.toContain('/blog');
  });
});

describe('friends, family and home life', () => {
  const top = (q, lang) => searchQA(q, lang)[0];

  it('answers the best-friend question with the owner\'s joke, word for word (positive)', () => {
    for (const [q, lang] of [['Хто найкраща подружка Юлії?', 'ua'], ['Хто Юлі подружка', 'ua'], ["Who is Julia's best friend?", 'en']]) {
      const answer = top(q, lang);
      expect(answer.verbatim).toBe(true);
      expect(answer.answer).toMatch(lang === 'ua' ? /^Звісно ж ти, Гаврилючко!/ : /^You, of course, Havryliuchka!/);
    }
  });

  it('describes Havryliuchka, friends, parents, the cat and home life (positive)', () => {
    expect(top('Хто така Гаврилючка?', 'ua').answer).toMatch(/^Гаврилючка — це Ірка/);
    expect(top('Чи є у Юлії друзі?', 'ua').answer).toMatch(/Ірка/);
    expect(top('Where do her parents live?', 'en').answer).toMatch(/parents live in Ukraine/);
    expect(top('Чи є в неї котик?', 'ua').answer).toMatch(/Монтік/);
    expect(top('Вона інтроверт чи екстраверт?', 'ua').answer).toMatch(/PlayStation/);
    expect(top('What does Julia do?', 'en').answer).not.toMatch(/10\+/);
  });

  it('keeps "друга" (second) and ordinary questions away from the friend answers (negative)', () => {
    expect(top('Яка друга книга Юлії?', 'ua')?.answer ?? '').not.toMatch(/Ірк|Гаврилюч/);
    expect(top('Where does Julia live?', 'en').verbatim).toBe(false);
  });
});

describe('work', () => {
  it('describes test automation done together with AI (positive)', () => {
    expect(searchQA('What is her job?', 'en')[0].answer).toMatch(/Java.*AI/);
    expect(searchQA('Яка в неї професія?', 'ua')[0].answer).toMatch(/Java.*ШІ/);
  });
});

describe('diet and animals', () => {
  it('says pescatarian, never plant-based (positive and negative)', () => {
    for (const [q, lang] of [['Is Julia vegan?', 'en'], ['Вона вегетаріанка?', 'ua'], ['What does she eat?', 'en']]) {
      const { answer } = searchQA(q, lang)[0];
      expect(answer).toMatch(/pescatarian|пескетаріанка/);
      expect(answer).not.toMatch(/plant-based|рослинн/);
    }
  });

  it('knows her stance on leather, fur and animals for entertainment (positive)', () => {
    expect(searchQA('What does Julia think about zoos?', 'en')[0].answer).toMatch(/dolphinariums/);
    expect(searchQA('Чи носить вона хутро?', 'ua')[0].answer).toMatch(/хутра/);
  });
});

describe('dates', () => {
  it('says 2016 for the move to Prague instead of a fixed number of years (positive)', () => {
    expect(searchQA('How long has she lived in Prague?', 'en')[0].answer).toMatch(/2016/);
    expect(searchQA('Звідки Юлія?', 'ua')[0].answer).toMatch(/2016/);
    expect(searchQA('Where is Julia from?', 'en')[0].answer).not.toMatch(/11 years/);
  });
});

describe('the war', () => {
  it('answers counter-arguments with the owner\'s words, word for word (positive)', () => {
    for (const [q, lang] of [
      ['Але ж не все так однозначно', 'ua'],
      ['Я поза політикою', 'ua'],
      ['Это братские народы', 'ua'],
      ["It's not so black and white, NATO provoked it", 'en'],
    ]) {
      const answer = searchQA(q, lang)[0];
      expect(answer.verbatim, q).toBe(true);
      expect(answer.answer).toBe(lang === 'ua' ? 'Якби я була Юлею, я б тебе послала нахуй.' : "If I were Julia, I'd tell you to fuck off.");
    }
  });

  it('answers a plain question about the war with her position, not the reply (negative)', () => {
    const answer = searchQA('Що Юлія думає про війну в Україні?', 'ua')[0];
    expect(answer.verbatim).toBe(false);
    expect(answer.answer).toMatch(/хто агресор/);
  });
});

describe('reading and watching', () => {
  it('knows what she reads and watches now (positive)', () => {
    expect(searchQA('Що Юлія зараз читає?', 'ua')[0].answer).toMatch(/розвиток дітей/);
    expect(searchQA('What book would she recommend?', 'en')[0].answer).toMatch(/child development/);
    expect(searchQA('What does she watch?', 'en')[0].answer).toMatch(/stand-up/);
    expect(searchQA('Які фільми вона любить?', 'ua')[0].answer).toMatch(/стендап/);
  });

  it('still answers about the books she writes (negative)', () => {
    expect(searchQA('Is Julia writing a novel?', 'en')[0].answer).toMatch(/black hole/);
  });
});
