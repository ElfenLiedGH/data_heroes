import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { HomePage } from '../pages/home/HomePage';
import { UsersListPage } from '../pages/users-list/UsersListPage';
import { DefaultPreferencesPage } from '../pages/default-preferences/DefaultPreferencesPage';
import { GlobalPoliciesPage } from '../pages/global-policies/GlobalPoliciesPage';
import { EvaluatePage } from '../pages/evaluate/EvaluatePage';
import { ApiDocsPage } from '../pages/api-docs/ApiDocsPage';
import { GrafanaPage } from '../pages/grafana/GrafanaPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
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
