import React, { useState, useRef, useEffect } from 'react';

const DraggableButton = ({ onClick, children }) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialClickPos, setInitialClickPos] = useState({ x: 0, y: 0 });
  const [initialButtonPos, setInitialButtonPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    setHasMoved(false);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    // Store the initial click position and button position
    setInitialClickPos({ x: clientX, y: clientY });
    setInitialButtonPos({ x: position.x, y: position.y });
    
    // Attach move and end listeners to the window
    window.addEventListener('mousemove', handleDragging);
    window.addEventListener('touchmove', handleDragging, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
  };

  const handleDragging = (e) => {
    e.preventDefault();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    // Calculate new position based on initial positions
    const deltaX = clientX - initialClickPos.x;
    const deltaY = clientY - initialClickPos.y;
    
    // Check if we've moved enough to consider it a drag
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (dragDistance > 10) {
      setHasMoved(true);
    }
    
    const newX = initialButtonPos.x + deltaX;
    const newY = initialButtonPos.y + deltaY;

    // Boundary checks
    const buttonWidth = buttonRef.current.offsetWidth;
    const buttonHeight = buttonRef.current.offsetHeight;
    const boundedX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
    const boundedY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleDragEnd = () => {
    // Only trigger onClick if we haven't moved significantly
    if (!hasMoved) {
      onClick();
    }
    
    setIsDragging(false);
    setHasMoved(false);
    
    // Clean up listeners
    window.removeEventListener('mousemove', handleDragging);
    window.removeEventListener('touchmove', handleDragging);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchend', handleDragEnd);
  };

  useEffect(() => {
    // Set initial position based on window size
    const handleResize = () => {
      setPosition(pos => ({
        x: Math.min(pos.x, window.innerWidth - (buttonRef.current?.offsetWidth || 0) - 20),
        y: Math.min(pos.y, window.innerHeight - (buttonRef.current?.offsetHeight || 0) - 20)
      }));
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial position correctly
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={buttonRef}
      className="chat-popup-button"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none' // prevent default touch behaviors like scrolling
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      {children}
    </div>
  );
};

export default DraggableButton; 