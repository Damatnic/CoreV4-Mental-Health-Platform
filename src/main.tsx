import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Performance monitoring
if (import.meta.env.PROD) {
  import('web-vitals').then((vitals) => {
    vitals.onCLS(console.log);
    vitals.onFID(console.log);
    vitals.onFCP(console.log);
    vitals.onLCP(console.log);
    vitals.onTTFB(console.log);
  });
}

// Initialize React 19 with concurrent features
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);