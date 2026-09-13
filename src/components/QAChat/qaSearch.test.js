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
