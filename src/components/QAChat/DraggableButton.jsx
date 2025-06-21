import React, { useState, useEffect } from 'react';

const DraggableButton = ({ onClick, children }) => {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleStart = (e) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging) {
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        const newX = clientX - dragOffset.x;
        const newY = clientY - dragOffset.y;
        
        // Keep button within viewport bounds
        const maxX = window.innerWidth - 112; // button width
        const maxY = window.innerHeight - 112; // button height
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  const handleClick = (e) => {
    if (!isDragging) {
      onClick(e);
    }
  };

  return (
    <button
      className="chat-popup-button"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={handleClick}
      aria-label="Open Chat"
    >
      {children}
    </button>
  );
};

export default DraggableButton; 