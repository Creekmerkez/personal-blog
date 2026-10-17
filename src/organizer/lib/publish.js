// Publishes journal entries to the blog at jmerkusheva.com/blog.
//
// The site shows public/blog/posts.json from the main branch of its GitHub
// repository, so publishing is one commit there, made with a GitHub token the
// owner adds in Settings; a GitHub Action then rebuilds the site. This is the
// only time the organizer sends anything off the iPhone, and it sends only the
// entries the owner chooses to show on the site. Photos taken on the phone are
// uploaded beside posts.json; photo links stay links.

import { dateFromAppleSeconds, dayKeyFromDate } from './dates';
import { textHash, TRANSLATED } from './journalFile';

export const REPO = 'Creekmerkez/personal-blog';
export const BLOG_URL = 'https://jmerkusheva.com/blog';
export const TOKEN_KEY = 'siteToken';
const API = `https://api.github.com/repos/${REPO}`;
const BRANCH = 'main';
const POSTS_PATH = 'public/blog/posts.json';
const PHOTOS = '/blog/photos/';

const isUpload = (url) => url.startsWith('data:');
const photoUrl = (entry, url) => (isUpload(url) ? `${PHOTOS}${entry.id}-${textHash(url, '')}.jpg` : url);

/** The entry as a post on the site: its date, every language it has, and its photos. */
export function postFrom(entry) {
  const key = String(dayKeyFromDate(dateFromAppleSeconds(entry.writtenOn)));
  const post = {
    id: entry.id,
    date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6)}`,
    writtenAt: dateFromAppleSeconds(entry.writtenOn).toISOString(),
    uk: { title: entry.title ?? '', text: entry.text ?? '' },
  };
  for (const lang of TRANSLATED) {
    const translation = entry.translations?.[lang];
    if (translation?.text) post[lang] = { title: translation.title ?? '', text: translation.text };
  }
  post.photos = (entry.photos ?? []).map((url) => photoUrl(entry, url));
  return post;
}

/** A fingerprint of what the post would show, to notice an entry changed since it was published. */
export const postHash = (entry) => textHash(JSON.stringify(postFrom(entry)), '');

export const publishState = (entry) => (!entry.published ? 'off' : entry.published === postHash(entry) ? 'live' : 'changed');

class GitHubError extends Error {}

async function gh(token, path, { accept, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: accept ?? 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (response.ok) return response;
  const error = new GitHubError(
    response.status === 401
      ? 'GitHub did not accept the token. It may have expired: add a new one in Settings → Website.'
      : response.status === 403 || response.status === 404
        ? 'This token cannot change the site. It needs access to the personal-blog repository with Contents: Read and write.'
        : `GitHub answered with an error (${response.status}). Try again in a minute.`,
  );
  error.status = response.status;
  throw error;
}

const post = (token, path, body, method = 'POST') => gh(token, path, { method, body: JSON.stringify(body) }).then((r) => r.json());

/** Checks a token can see the site's repository. */
export async function checkToken(token) {
  await gh(token, '');
}

async function readPosts(token, ref) {
  try {
    const response = await gh(token, `/contents/${POSTS_PATH}?ref=${ref}`, { accept: 'application/vnd.github.raw+json' });
    return (await response.json()).posts ?? [];
  } catch (err) {
    if (err.status === 404) return [];
    throw err;
  }
}

async function commitChange(token, entries, removeIds, message) {
  const head = (await gh(token, `/git/ref/heads/${BRANCH}`).then((r) => r.json())).object.sha;
  const baseTree = (await gh(token, `/git/commits/${head}`).then((r) => r.json())).tree.sha;
  const current = await readPosts(token, head);
  const changing = new Set([...entries.map((e) => e.id), ...removeIds]);
  const before = new Map(current.filter((p) => changing.has(p.id)).map((p) => [p.id, p]));

  const tree = [];
  const fresh = [];
  for (const entry of entries) {
    const next = postFrom(entry);
    const had = new Set(before.get(entry.id)?.photos ?? []);
    for (const url of entry.photos ?? []) {
      const path = photoUrl(entry, url);
      if (!isUpload(url) || had.has(path)) continue;
      const blob = await post(token, '/git/blobs', { content: url.slice(url.indexOf(',') + 1), encoding: 'base64' });
      tree.push({ path: `public${path}`, mode: '100644', type: 'blob', sha: blob.sha });
    }
    fresh.push(next);
  }
  // Photos the site no longer shows are deleted with the post that had them.
  const kept = new Set(fresh.flatMap((p) => p.photos));
  for (const old of before.values()) {
    for (const path of old.photos ?? []) if (path.startsWith(PHOTOS) && !kept.has(path)) tree.push({ path: `public${path}`, mode: '100644', type: 'blob', sha: null });
  }

  const posts = [...current.filter((p) => !changing.has(p.id)), ...fresh].sort((a, b) => b.writtenAt.localeCompare(a.writtenAt));
  tree.push({ path: POSTS_PATH, mode: '100644', type: 'blob', content: `${JSON.stringify({ posts }, null, 1)}\n` });

  const newTree = await post(token, '/git/trees', { base_tree: baseTree, tree });
  const commit = await post(token, '/git/commits', { message, tree: newTree.sha, parents: [head] });
  await post(token, `/git/refs/heads/${BRANCH}`, { sha: commit.sha }, 'PATCH');
}

/**
 * Puts entries on the site, or takes them off, in one commit. Retries when
 * something else changed the site at the same moment.
 */
export async function changeSite(token, { publish = [], remove = [] }, message) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await commitChange(token, publish, remove, message);
    } catch (err) {
      if (err.status !== 422 && err.status !== 409) throw err;
      if (attempt === 2) throw err;
    }
  }
}
