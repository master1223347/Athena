
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
// main.tsx  (or index.tsx ― whatever boots your app)
import mixpanel from 'mixpanel-browser';

mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN!, {
  debug: import.meta.env.DEV,
  batch_requests: true,
  ip: false,
});

['assignmentCompleteCount',
  'perfectGradeCount',
  'canvasSyncCount',
  'loginCount',
  'pageViews',
  'visitedPages',
  'hasProfilePicture',
  'prefersDarkMode',
  'canvas_credentials'      // <— the plain one
 ].forEach(k => localStorage.removeItem(k));


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
