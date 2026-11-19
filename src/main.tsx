import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './styles/app.css';

// Offline rad: service worker kešira cijeli app.
registerSW({ immediate: true });

// Zamoli preglednik da podatke ne briše kad ponestane prostora.
if (navigator.storage?.persist) {
  navigator.storage.persisted().then((v) => (v ? undefined : navigator.storage.persist())).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
