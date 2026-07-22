import React, { useState, useEffect } from 'react';
import '../styles/InstagramWidget.css';

const InstagramWidget = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [iframeHeight, setIframeHeight] = useState(isMobile ? 500 : 300);

  const widgetUrl = isMobile
    ? 'https://cdn.lightwidget.com/widgets/bd88ebee3abe54cdabf9b3f13a32ba36.html'
    : 'https://cdn.lightwidget.com/widgets/964e3acec55c5bb6b1c2651c56d663e4.html';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIframeHeight(isMobile ? 500 : 300);
  }, [isMobile]);

  useEffect(() => {
    const allowedOrigins = [
      'https://cdn.lightwidget.com',
      'https://lightwidget.com',
      'http://cdn.lightwidget.com',
      'http://lightwidget.com'
    ];

    const handleMessage = (event) => {
      if (!allowedOrigins.includes(event.origin)) return;
      const data = event.data;
      if (!data || data.type !== 'lightwidget_size') return;
      if (!data.size || Number.isNaN(Number(data.size))) return;
      setIframeHeight(Number(data.size));
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="instagram-widget">
      <iframe
        title="Instagram feed"
        src={widgetUrl}
        scrolling="no"
        allowTransparency="true"
        className="lightwidget-widget"
        style={{
          width: '100%',
          border: 0,
          overflow: 'hidden',
          height: iframeHeight,
          minHeight: iframeHeight
        }}
      />
    </div>
  );
};

export default InstagramWidget; 