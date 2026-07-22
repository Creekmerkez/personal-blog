import React from 'react';
import BookDisplay from './BookDisplay';
import books from './booksData';
import '../styles/BooksSection.css';

const BooksSection = ({ showTitle = true, className = '' }) => {
  const sectionClassName = ['books-section', className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      {showTitle && <h2 className="section-title">My Books</h2>}
      <div className="books-grid">
        {books.map((book) => (
          <BookDisplay 
            key={book.isbn}
            book={book}
          />
        ))}
      </div>
    </section>
  );
};

export default BooksSection; 