import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

const labelMap: Record<string, string> = {
  'dashboard': 'Dashboard',
  'history': 'History',
  'motor-control': 'Motor Control',
  'thresholds': 'Thresholds',
  'notifications': 'Notifications',
  'system-data': 'System Data',
  'settings': 'Settings',
};

const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null; // only homepage route

  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const raw = labelMap[seg] || seg;
    const label = t(`nav.${seg}`, raw);
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <li>
          <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">{t('nav.dashboard','Dashboard')}</Link>
        </li>
        {crumbs.map((c, idx) => (
          <React.Fragment key={`${c.href}-${idx}`}>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li>
              {c.isLast ? (
                <span className="font-medium text-gray-900 dark:text-gray-100">{c.label}</span>
              ) : (
                <Link to={c.href} className="hover:text-gray-900 dark:hover:text-gray-200">{c.label}</Link>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;