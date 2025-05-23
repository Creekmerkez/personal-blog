import React, { useEffect } from 'react';
import styles from '../styles/InstagramFeed.module.css';

const InstagramFeed = () => {
  useEffect(() => {
    // Load the LightWidget script
    const script = document.createElement('script');
    script.src = 'https://cdn.lightwidget.com/widgets/964e3acec55c5bb6b1c2651c56d663e4.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={styles['instagram-feed']}>
      <iframe 
        src="https://cdn.lightwidget.com/widgets/964e3acec55c5bb6b1c2651c56d663e4.html" 
        scrolling="no" 
        allowTransparency="true" 
        className={styles['lightwidget-widget']}
        style={{ width: '100%', border: 0, overflow: 'hidden' }}
      />
    </div>
  );
};

export default InstagramFeed; 