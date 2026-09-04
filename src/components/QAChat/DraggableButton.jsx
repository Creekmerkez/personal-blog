import React, { useState, useRef, useEffect } from 'react';

// How much of the drag past the edge still shows, as resistance (0-1).
// 1 = no resistance (hard clamp), lower = more rubber-band give.
const EDGE_RESISTANCE = 0.35;
const SNAP_BACK_MS = 220;

const DraggableButton = ({ onClick, children }) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
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

    // Boundary checks, with rising resistance past the edge instead of a
    // hard stop — dragging past the viewport bounds shows a fraction of the
    // overflow rather than clamping dead at the wall.
    const buttonWidth = buttonRef.current.offsetWidth;
    const buttonHeight = buttonRef.current.offsetHeight;
    const minX = 0;
    const maxX = window.innerWidth - buttonWidth;
    const minY = 0;
    const maxY = window.innerHeight - buttonHeight;
    const resist = (value, min, max) => {
      if (value < min) return min - (min - value) * EDGE_RESISTANCE;
      if (value > max) return max + (value - max) * EDGE_RESISTANCE;
      return value;
    };
    const boundedX = resist(newX, minX, maxX);
    const boundedY = resist(newY, minY, maxY);

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleDragEnd = () => {
    // Only trigger onClick if we haven't moved significantly
    if (!hasMoved) {
      onClick();
    }

    setIsDragging(false);
    setHasMoved(false);

    // If the resisted drag left the button past the edge, ease it back in
    // bounds — the release is the system's response, so it snaps (short,
    // ease-out), unlike the slower give of the deliberate drag itself.
    const buttonWidth = buttonRef.current?.offsetWidth || 0;
    const buttonHeight = buttonRef.current?.offsetHeight || 0;
    setPosition((pos) => {
      const clampedX = Math.max(0, Math.min(pos.x, window.innerWidth - buttonWidth));
      const clampedY = Math.max(0, Math.min(pos.y, window.innerHeight - buttonHeight));
      if (clampedX !== pos.x || clampedY !== pos.y) {
        setIsSnapping(true);
        setTimeout(() => setIsSnapping(false), SNAP_BACK_MS);
        return { x: clampedX, y: clampedY };
      }
      return pos;
    });

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
        left: 0,
        top: 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isSnapping ? 'transform 220ms var(--ease-out)' : 'none',
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