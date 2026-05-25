import { useMemo, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AppLayout as SummerAppLayout, Icon, Sheet, Sidebar } from '@smwb/summer-ui';
import { useGetHealthQuery } from '../shared/api/api';
import {
  appNavItems,
  mobileMenuItems,
  mobileTabItems,
  resolveActiveNavIndex,
} from '../shared/config/app-nav';
import { useIsMobile } from '../shared/hooks/use-is-mobile';
import styles from './AppLayout.module.less';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: health } = useGetHealthQuery(undefined, { pollingInterval: 30000 });
  const activeItem = useMemo(
    () => resolveActiveNavIndex(location.pathname),
    [location.pathname],
  );

  const healthLabel =
    health?.status === 'ok' && health?.db === 'ok'
      ? 'Backend: OK'
      : health?.status === 'degraded'
        ? 'Backend: degraded'
        : 'Backend: ...';

  const healthBadge = (
    <div
      className={styles.healthBadge}
      data-status={health?.status === 'ok' && health?.db === 'ok' ? 'ok' : 'warn'}
      aria-live="polite"
    >
      {healthLabel}
    </div>
  );

  const menuItems = appNavItems.map((item, index) => ({
    title: item.label,
    icon: <Icon name={item.icon} size={20} />,
    isActive: index === activeItem,
    onClick: () => navigate(item.to),
  }));

  const mainContent = (
    <div className={styles.main}>
      {healthBadge}
      <Outlet />
    </div>
  );

  const mobileMenuSheet = (
    <Sheet
      isOpen={menuOpen}
      onClose={() => setMenuOpen(false)}
      placement="bottom"
      size="55%"
      resizable
    >
      <div className={styles.mobileMenu}>
        <h2 className={styles.mobileMenuTitle}>Разделы</h2>
        {mobileMenuItems.map((item) => (
          <button
            key={item.to}
            type="button"
            className={styles.mobileMenuItem}
            onClick={() => {
              setMenuOpen(false);
              navigate(item.to);
            }}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );

  if (isMobile) {
    return (
      <div className={styles.mobileLayout}>
        <main className={styles.mobileMain}>{mainContent}</main>
        <nav className={styles.bottomNav} aria-label="Основная навигация">
          {mobileTabItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                type="button"
                className={styles.bottomNavItem}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => navigate(item.to)}
              >
                <Icon name={item.icon} size={22} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className={styles.bottomNavItem}
            data-active={mobileMenuItems.some((item) => location.pathname.startsWith(item.to)) ? 'true' : 'false'}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={22} />
            <span>Ещё</span>
          </button>
        </nav>
        {mobileMenuSheet}
      </div>
    );
  }

  return (
    <SummerAppLayout
      sidebarCollapsed={sidebarCollapsed}
      onSidebarCollapsedChange={setSidebarCollapsed}
      sidebar={
        <Sidebar
          collapsible
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          menuItems={menuItems}
        />
      }
    >
      {mainContent}
    </SummerAppLayout>
  );
}
