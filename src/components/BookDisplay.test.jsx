import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookDisplay from './BookDisplay';

const shortBook = {
  isbn: '1',
  title: 'A Short Book',
  subtitle: 'A subtitle',
  coverImage: '/images/book1.jpg',
  backCoverImage: '/images/book1-back.jpg',
  amazonLink: 'https://amazon.com/dp/xyz',
  description: 'A short description under the truncation limit.',
};

const longBook = {
  ...shortBook,
  isbn: '2',
  title: 'A Long Book',
  description: 'A'.repeat(400), // MAX_LENGTH in BookDisplay.jsx is 320
};

describe('BookDisplay', () => {
  it('renders null for missing book data (negative)', () => {
    const { container } = render(<BookDisplay book={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, subtitle, and full description when under the length limit (positive)', () => {
    render(<BookDisplay book={shortBook} />);
    expect(screen.getByText('A Short Book')).toBeInTheDocument();
    expect(screen.getByText('A subtitle')).toBeInTheDocument();
    expect(screen.getByText(shortBook.description)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /read more/i })).not.toBeInTheDocument();
  });

  it('truncates a long description and shows a "Read More" toggle (positive)', () => {
    render(<BookDisplay book={longBook} />);
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });

  it('expands the description on "Read More" and collapses again on "Read Less" (positive)', async () => {
    const user = userEvent.setup();
    render(<BookDisplay book={longBook} />);

    await user.click(screen.getByRole('button', { name: /read more/i }));
    expect(screen.getByRole('button', { name: /read less/i })).toBeInTheDocument();
    expect(screen.getByText(longBook.description)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /read less/i }));
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument();
  });

  it('does not render the cover-image modal until the cover is clicked (negative)', () => {
    render(<BookDisplay book={shortBook} />);
    expect(screen.queryByRole('button', { name: /show back cover/i })).not.toBeInTheDocument();
  });

  it('opens the modal showing the front cover on click, and switches to the back cover on arrow click (positive)', async () => {
    const user = userEvent.setup();
    render(<BookDisplay book={shortBook} />);

    await user.click(screen.getByAltText(`Cover of ${shortBook.title}`));
    const backButton = screen.getByRole('button', { name: /show back cover/i });
    expect(backButton).toBeInTheDocument();
    // Front-cover arrow starts disabled — already showing the cover.
    expect(screen.getByRole('button', { name: /show cover/i })).toBeDisabled();

    await user.click(backButton);
    // Alt text is shared between the main modal image and its thumbnail —
    // assert via the thumbnail's active state instead, which is unambiguous.
    const thumbs = screen.getAllByAltText(`Back cover of ${shortBook.title}`);
    expect(thumbs.some((el) => el.className.includes('active'))).toBe(true);
    expect(screen.getByRole('button', { name: /show cover/i })).toBeEnabled();
  });

  it('closes the modal on the close button (positive)', async () => {
    const user = userEvent.setup();
    render(<BookDisplay book={shortBook} />);

    await user.click(screen.getByAltText(`Cover of ${shortBook.title}`));
    expect(screen.getByRole('button', { name: /show back cover/i })).toBeInTheDocument();

    await user.click(screen.getByText('×'));
    expect(screen.queryByRole('button', { name: /show back cover/i })).not.toBeInTheDocument();
  });
});
