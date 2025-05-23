import React from 'react';

const InstagramWidget = () => {
  return (
    <div className="instagram-widget">
      <iframe
        src="https://cdn.lightwidget.com/widgets/your-widget-id.html"
        scrolling="no"
        allowTransparency="true"
        className="lightwidget-widget"
        style={{ width: '100%', border: 0, overflow: 'hidden' }}
      />
    </div>
  );
};

export default InstagramWidget; 