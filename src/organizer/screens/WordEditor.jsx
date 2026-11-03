import { useState } from 'react';
import { appleSeconds } from '../lib/dates';
import { newId } from '../lib/backup';
import { Section, Sheet } from '../components/ui';

/**
 * Add (word = null) or edit a word. A new word is due the day it is added.
 * One big Translation field: an older word's notes are folded into it, and saving keeps them there.
 */
export default function WordEditor({ word, today, onSave, onDelete, onLearnAgain, onClose }) {
  const [text, setText] = useState(word?.word ?? '');
  const [translation, setTranslation] = useState(() => [word?.translation, word?.notes].map((s) => s?.trim()).filter(Boolean).join('\n'));
  const canSave = text.trim() !== '' && translation.trim() !== '';

  const save = () => {
    const base = word ?? {
      id: newId(),
      successfulRecalls: 0,
      nextReviewDayKey: today,
      isLearned: false,
      queuePosition: Number.MAX_SAFE_INTEGER, // joins the end of the rotation right away
      createdAt: appleSeconds(),
    };
    onSave({ ...base, word: text.trim(), translation: translation.trim(), notes: '' });
  };

  return (
    <Sheet
      title={word ? 'Edit Word' : 'New Word'}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSave} onClick={save}>Save</button>}
    >
      <Section>
        <input className="org-input" placeholder="Word" aria-label="Word" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="none" data-autofocus={!word || undefined} />
      </Section>
      <Section header="Translation">
        <textarea className="org-input org-textarea" aria-label="Translation" autoComplete="off" rows={4} value={translation} onChange={(e) => setTranslation(e.target.value)} autoCapitalize="none" />
      </Section>
      {word && (
        <Section>
          {word.isLearned && (
            <button type="button" className="org-row org-action" onClick={() => onLearnAgain(word)}>Learn Again</button>
          )}
          <button type="button" className="org-row org-destructive" onClick={() => onDelete(word)}>Delete Word</button>
        </Section>
      )}
    </Sheet>
  );
}
