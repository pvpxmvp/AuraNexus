import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuraContextProvider } from './store/AuraContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuraContextProvider>
      <App />
    </AuraContextProvider>
  </StrictMode>,
);
