import React, { useEffect } from 'react';
import styles from '../styles/InstagramFeed.module.css';

const InstagramFeed = () => {
  useEffect(() => {
    // Load the LightWidget script ONCE globally
    const script = document.createElement('script');
    script.src = 'https://cdn.lightwidget.com/widgets/lightwidget.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      {/* Desktop Widget */}
      <div className={styles['instagram-feed-desktop']}>
        <iframe
          src="//lightwidget.com/widgets/a210bd19b670522ab477a35a526121f8.html"
          scrolling="no"
          allowTransparency="true"
          className="lightwidget-widget"
          style={{ width: '100%', border: 0, overflow: 'hidden' }}
          title="Instagram Desktop Feed"
        />
      </div>
      {/* Mobile Widget */}
      <div className={styles['instagram-feed-mobile']}>
        <iframe
          src="//lightwidget.com/widgets/90c3b791fa7d5d9fa662003c420de0bd.html"
          scrolling="no"
          allowTransparency="true"
          className="lightwidget-widget"
          style={{ width: '100%', border: 0 }}
          title="Instagram Mobile Feed"
        />
      </div>
    </>
  );
};

export default InstagramFeed; 