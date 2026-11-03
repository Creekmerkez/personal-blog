import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WordEditor from './WordEditor';

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('WordEditor', () => {
  it('has one big Translation field and no Notes (positive)', async () => {
    const onSave = vi.fn();
    render(<WordEditor word={null} today={20261103} onSave={onSave} onClose={() => {}} />);
    expect(screen.queryByRole('textbox', { name: 'Notes' })).toBeNull();
    const translation = screen.getByRole('textbox', { name: 'Translation' });
    expect(translation.tagName).toBe('TEXTAREA');
    await userEvent.type(screen.getByRole('textbox', { name: 'Word' }), 'výročí');
    await userEvent.type(translation, 'річниця{Enter}🇬🇧 anniversary');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave.mock.calls[0][0]).toMatchObject({ word: 'výročí', translation: 'річниця\n🇬🇧 anniversary', notes: '' });
  });

  it('folds an older word\'s notes into the translation, losing nothing (edge case)', async () => {
    const onSave = vi.fn();
    const word = { id: 'W', word: 'přepadení', translation: 'напад', notes: '🇬🇧 attack', isLearned: false };
    render(<WordEditor word={word} today={20261103} onSave={onSave} onClose={() => {}} onDelete={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'Translation' })).toHaveValue('напад\n🇬🇧 attack');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave.mock.calls[0][0]).toMatchObject({ translation: 'напад\n🇬🇧 attack', notes: '' });
  });

  it('cannot save without a translation (negative)', async () => {
    render(<WordEditor word={null} today={20261103} onSave={() => {}} onClose={() => {}} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Word' }), 'slovo');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
