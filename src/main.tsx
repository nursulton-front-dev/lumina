import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { App } from './App';
import { AppProvider } from './state/AppProvider';

const root = document.getElementById('root');
if (!root) throw new Error('Не найден корневой элемент #root');

createRoot(root).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

// Обновление приложения подхватывается само при следующем запуске.
registerSW({ immediate: true });
