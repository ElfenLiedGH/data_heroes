import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ErrorBoundary } from './ErrorBoundary';

const HomePage = lazy(() =>
  import('../pages/home/HomePage').then((m) => ({ default: m.HomePage })),
);
const UsersListPage = lazy(() =>
  import('../pages/users-list/UsersListPage').then((m) => ({ default: m.UsersListPage })),
);
const DefaultPreferencesPage = lazy(() =>
  import('../pages/default-preferences/DefaultPreferencesPage').then((m) => ({
    default: m.DefaultPreferencesPage,
  })),
);
const GlobalPoliciesPage = lazy(() =>
  import('../pages/global-policies/GlobalPoliciesPage').then((m) => ({
    default: m.GlobalPoliciesPage,
  })),
);
const EvaluatePage = lazy(() =>
  import('../pages/evaluate/EvaluatePage').then((m) => ({ default: m.EvaluatePage })),
);
const ApiDocsPage = lazy(() =>
  import('../pages/api-docs/ApiDocsPage').then((m) => ({ default: m.ApiDocsPage })),
);
const GrafanaPage = lazy(() =>
  import('../pages/grafana/GrafanaPage').then((m) => ({ default: m.GrafanaPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ErrorBoundary>
              <AppLayout />
            </ErrorBoundary>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/default-preferences" element={<DefaultPreferencesPage />} />
          <Route path="/global-policies" element={<GlobalPoliciesPage />} />
          <Route path="/evaluate" element={<EvaluatePage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/grafana" element={<GrafanaPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
