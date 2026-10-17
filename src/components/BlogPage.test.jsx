import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BlogPage from './BlogPage';

const long = 'Слово '.repeat(200).trim();
const posts = [
  {
    id: 'A',
    date: '2026-10-17',
    writtenAt: '2026-10-17T10:00:00.000Z',
    uk: { title: 'Уяви', text: long },
    en: { title: 'Imagine', text: 'Imagine.' },
    cs: { title: 'Představ si', text: 'Představte si.' },
    photos: ['/blog/photos/A-1.jpg', '/blog/photos/A-2.jpg'],
  },
  { id: 'B', date: '2017-10-03', writtenAt: '2017-10-03T21:22:00.000Z', uk: { title: 'Тільки українською', text: 'Короткий текст.' }, photos: [] },
];

const showBlog = (data, languages = ['uk']) => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(data))));
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  render(<MemoryRouter><BlogPage /></MemoryRouter>);
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BlogPage', () => {
  it('shows posts in the visitor language and switches per post (positive)', async () => {
    showBlog({ posts }, ['cs-CZ', 'en']);
    expect(await screen.findByRole('heading', { name: 'Představ si' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'EN' })[0]);
    expect(screen.getByRole('heading', { name: 'Imagine' })).toBeInTheDocument();
    // A post with only Ukrainian shows it, with no language buttons
    expect(screen.getByRole('heading', { name: 'Тільки українською' })).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: 'Language' })).toHaveLength(1);
  });

  it('folds a long post and its extra photos until Read more (positive)', async () => {
    showBlog({ posts });
    const more = await screen.findByRole('button', { name: 'Читати далі' });
    expect(document.querySelectorAll('.blog-post-photo')).toHaveLength(1);
    expect(screen.getByText(/…$/)).toBeInTheDocument();
    await userEvent.click(more);
    expect(screen.getByRole('button', { name: 'Згорнути' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelectorAll('.blog-post-photo')).toHaveLength(2);
  });

  it('shows an empty blog when there is no posts file or it is broken (negative)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html>', { status: 200 })));
    render(<MemoryRouter><BlogPage /></MemoryRouter>);
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('skips posts without Ukrainian text (negative)', async () => {
    showBlog({ posts: [{ id: 'X', date: '2026-01-01', en: { title: 'Only English', text: 'x' } }] });
    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
  });
});
