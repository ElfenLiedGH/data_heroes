import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from '@smwb/summer-ui';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api/api';
import { render, type RenderOptions } from '@testing-library/react';

export function createTestStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
};

export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const store = createTestStore();
  return render(ui, {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <SnackbarProvider position="top-right">
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </SnackbarProvider>
      </Provider>
    ),
    ...options,
  });
}
