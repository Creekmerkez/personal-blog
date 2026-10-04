import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import PrivacyPage from './PrivacyPage';
import OrganizerPrivacyPage from './OrganizerPrivacyPage';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/privacy/organizer" element={<OrganizerPrivacyPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('OrganizerPrivacyPage', () => {
  it('states that data stays on the device and nothing is collected (positive)', () => {
    renderAt('/privacy/organizer');
    expect(screen.getByRole('heading', { level: 1, name: 'Organizer app privacy' })).toBeInTheDocument();
    expect(screen.getByText(/does not collect, send, or share any of your information/)).toBeInTheDocument();
    expect(screen.getByText(/does not connect to the internet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'julia.merkusheva@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:julia.merkusheva@gmail.com'
    );
  });

  it('sets and restores the document title', () => {
    document.title = 'Before';
    const { unmount } = renderAt('/privacy/organizer');
    expect(document.title).toBe('Organizer app privacy — Julia Merkusheva');
    unmount();
    expect(document.title).toBe('Before');
  });

  it('is reachable from the website privacy page and links back to it', async () => {
    const user = userEvent.setup();
    renderAt('/privacy');
    await user.click(screen.getByRole('link', { name: 'Organizer app privacy' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Organizer app privacy' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '← Website privacy' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument();
  });
});
