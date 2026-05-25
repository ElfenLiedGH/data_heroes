import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { SnackbarProvider } from '@smwb/summer-ui';
import '@smwb/summer-ui/styles/normalize.css';
import '@smwb/summer-ui/summer-ui.css';
import { AppRouter } from './app/AppRouter';
import { store } from './app/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <SnackbarProvider position="top-right">
        <AppRouter />
      </SnackbarProvider>
    </Provider>
  </StrictMode>,
);
