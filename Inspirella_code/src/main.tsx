import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';
import '@fontsource-variable/manrope';
import '@fontsource-variable/wix-madefor-display';
import './alpen.css';
import {loadAnalytics} from './lib/analytics.ts';

loadAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
