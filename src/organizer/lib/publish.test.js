import { afterEach, describe, it, expect, vi } from 'vitest';
import { appleSeconds } from './dates';
import { changeSite, postFrom, postHash, publishState } from './publish';

const entry = {
  id: 'E1',
  title: 'Уяви',
  text: 'Уявіть.',
  writtenOn: appleSeconds(new Date(2026, 9, 17, 12)),
  translations: { en: { title: 'Imagine', text: 'Imagine.' }, cs: { title: 'Představ si', text: 'Představte si.' } },
  photos: ['https://example.com/a.jpg', 'data:image/jpeg;base64,AAAA'],
};

/** A fake of the few GitHub endpoints publishing uses, holding posts.json in memory. */
function fakeGitHub({ posts = null, conflicts = 0, status = 200 } = {}) {
  const calls = [];
  let file = posts && JSON.stringify({ posts });
  let refConflicts = conflicts;
  vi.stubGlobal('fetch', async (url, init = {}) => {
    const path = url.replace('https://api.github.com/repos/Creekmerkez/personal-blog', '');
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path, method: init.method ?? 'GET', body, auth: init.headers.Authorization });
    const json = (value, code = 200) => new Response(JSON.stringify(value), { status: code });
    if (status !== 200) return json({}, status);
    if (path === '/git/ref/heads/main') return json({ object: { sha: 'HEAD' } });
    if (path === '/git/commits/HEAD') return json({ tree: { sha: 'TREE' } });
    if (path.startsWith('/contents/public/blog/posts.json')) return file ? new Response(file) : json({}, 404);
    if (path === '/git/blobs') return json({ sha: 'BLOB' });
    if (path === '/git/trees') {
      file = body.tree.find((t) => t.path === 'public/blog/posts.json').content;
      return json({ sha: 'NEWTREE' });
    }
    if (path === '/git/commits') return json({ sha: 'COMMIT' });
    if (path === '/git/refs/heads/main') return refConflicts-- > 0 ? json({}, 422) : json({});
    return json({}, 500);
  });
  return { calls, posts: () => JSON.parse(file).posts };
}

afterEach(() => vi.unstubAllGlobals());

describe('blog posts from journal entries', () => {
  it('carries every language, the local date, and photos to upload', () => {
    const post = postFrom(entry);
    expect(post.date).toBe('2026-10-17');
    expect(post.uk).toEqual({ title: 'Уяви', text: 'Уявіть.' });
    expect(post.en.title).toBe('Imagine');
    expect(post.cs.text).toBe('Představte si.');
    expect(post.photos[0]).toBe('https://example.com/a.jpg');
    expect(post.photos[1]).toMatch(/^\/blog\/photos\/E1-[0-9a-z]+\.jpg$/);
  });

  it('leaves out languages the entry has no translation for (negative)', () => {
    const post = postFrom({ ...entry, translations: { en: { title: '', text: '' } } });
    expect(post.en).toBeUndefined();
    expect(post.cs).toBeUndefined();
  });

  it('tells published, changed and unpublished entries apart', () => {
    expect(publishState(entry)).toBe('off');
    const live = { ...entry, published: postHash(entry) };
    expect(publishState(live)).toBe('live');
    expect(publishState({ ...live, translations: { ...live.translations, en: { title: 'Imagine!', text: 'Imagine.' } } })).toBe('changed');
  });
});

describe('changing the site', () => {
  it('publishes in one commit: photo blob, then posts.json', async () => {
    const github = fakeGitHub();
    await changeSite('TOKEN', { publish: [entry] }, 'Blog: publish');
    const tree = github.calls.find((c) => c.path === '/git/trees').body;
    expect(tree.base_tree).toBe('TREE');
    expect(tree.tree.map((t) => t.path)).toEqual([`public${postFrom(entry).photos[1]}`, 'public/blog/posts.json']);
    expect(github.calls.find((c) => c.path === '/git/blobs').body).toEqual({ content: 'AAAA', encoding: 'base64' });
    expect(github.posts()).toEqual([postFrom(entry)]);
    expect(github.calls.every((c) => c.auth === 'Bearer TOKEN')).toBe(true);
  });

  it('updates a post in place and keeps the others, newest first', async () => {
    const older = { ...postFrom({ ...entry, id: 'OLD', photos: [] }), writtenAt: '2017-01-01T00:00:00.000Z' };
    const github = fakeGitHub({ posts: [older, postFrom(entry)] });
    await changeSite('TOKEN', { publish: [{ ...entry, title: 'Уяви!' }] }, 'Blog: update');
    expect(github.posts().map((p) => [p.id, p.uk.title])).toEqual([['E1', 'Уяви!'], ['OLD', 'Уяви']]);
    // the photo was already uploaded
    expect(github.calls.some((c) => c.path === '/git/blobs')).toBe(false);
  });

  it('removes a post and deletes its uploaded photos, not linked ones', async () => {
    const github = fakeGitHub({ posts: [postFrom(entry)] });
    await changeSite('TOKEN', { remove: ['E1'] }, 'Blog: remove');
    const tree = github.calls.find((c) => c.path === '/git/trees').body.tree;
    expect(tree[0]).toMatchObject({ path: `public${postFrom(entry).photos[1]}`, sha: null });
    expect(tree).toHaveLength(2);
    expect(github.posts()).toEqual([]);
  });

  it('tries again when the site changed at the same moment', async () => {
    const github = fakeGitHub({ conflicts: 1 });
    await changeSite('TOKEN', { publish: [entry] }, 'Blog: publish');
    expect(github.calls.filter((c) => c.path === '/git/refs/heads/main')).toHaveLength(2);
  });

  it('explains a token GitHub refuses (negative)', async () => {
    fakeGitHub({ status: 401 });
    await expect(changeSite('BAD', { publish: [entry] }, 'x')).rejects.toThrow(/did not accept the token/);
    fakeGitHub({ status: 403 });
    await expect(changeSite('READONLY', { publish: [entry] }, 'x')).rejects.toThrow(/Contents: Read and write/);
  });
});
