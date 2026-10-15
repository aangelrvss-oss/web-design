import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/instrument-sans/standard.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import './styles/app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
