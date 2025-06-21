import React, { useState, useEffect } from 'react';
import '../styles/InstagramWidget.css';

const InstagramWidget = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="instagram-widget">
      {isMobile ? (
        <iframe
          src="https://cdn.lightwidget.com/widgets/bd88ebee3abe54cdabf9b3f13a32ba36.html"
          scrolling="no"
          allowtransparency="true"
          className="lightwidget-widget"
          style={{ width: '100%', border: 0, overflow: 'hidden' }}
        />
      ) : (
        <iframe
          src="https://cdn.lightwidget.com/widgets/964e3acec55c5bb6b1c2651c56d663e4.html"
          scrolling="no"
          allowtransparency="true"
          className="lightwidget-widget"
          style={{ width: '100%', border: 0, overflow: 'hidden' }}
        />
      )}
    </div>
  );
};

export default InstagramWidget; 