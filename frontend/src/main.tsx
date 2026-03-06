import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/shared/lib/i18n';
import App from './app/App';
import './index.css';

// Initialize accessibility auditing in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
