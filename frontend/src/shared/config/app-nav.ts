export type AppNavItem = {
  to: string;
  label: string;
  description: string;
  icon: string;
  mobileTab?: boolean;
  mobileMenu?: boolean;
};

export const appNavItems: AppNavItem[] = [
  {
    to: '/',
    label: 'Главная',
    description: 'Быстрый доступ ко всем разделам',
    icon: 'home',
    mobileTab: true,
  },
  {
    to: '/users',
    label: 'Пользователи',
    description: 'Список пользователей и их настройки',
    icon: 'group',
    mobileTab: true,
  },
  {
    to: '/default-preferences',
    label: 'Дефолтные настройки',
    description: 'Шаблоны предпочтений по регионам',
    icon: 'tune',
    mobileMenu: true,
  },
  {
    to: '/global-policies',
    label: 'Глобальные политики',
    description: 'Блокировки на уровне региона',
    icon: 'policy',
    mobileMenu: true,
  },
  {
    to: '/evaluate',
    label: 'Проверка отправки',
    description: 'Evaluate API для канала и типа',
    icon: 'fact_check',
    mobileTab: true,
  },
  {
    to: '/api-docs',
    label: 'API документация',
    description: 'Swagger UI и OpenAPI',
    icon: 'description',
    mobileMenu: true,
  },
  {
    to: '/grafana',
    label: 'Grafana',
    description: 'Метрики, логи и дашборды',
    icon: 'monitoring',
    mobileMenu: true,
  },
];

export const mobileTabItems = appNavItems.filter((item) => item.mobileTab);

export const mobileMenuItems = appNavItems.filter((item) => item.mobileMenu);

export function resolveActiveNavIndex(pathname: string) {
  if (pathname === '/') return 0;
  const index = appNavItems.findIndex(
    (item) => item.to !== '/' && pathname.startsWith(item.to),
  );
  return index >= 0 ? index : -1;
}
