import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register offline Service Worker for Android PWA installability
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration errors in preview sandboxes
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
