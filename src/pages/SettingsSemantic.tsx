import React, { useEffect, useState } from 'react';
import '../styles/settings.css';

// Accessible inline icon component
const Icon = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1">
    <span aria-hidden="true">{children}</span>
    <span className="visually-hidden">{label}</span>
  </span>
);

const SettingsSemantic: React.FC = () => {
  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <main className="settings" aria-labelledby="page-title">
      <div className="settings__container">
        <header className="settings__header" role="banner">
          <div>
            <h1 id="page-title" className="settings__title">Settings (Semantic Demo)</h1>
            <p className="settings__subtitle">Semantic layout with BEM, Grid/Flex, and accessibility.</p>
          </div>
          <button className="settings__button settings__button--secondary" aria-pressed={isDark} onClick={() => setIsDark(v => !v)}>
            <Icon label={isDark ? 'Light mode' : 'Dark mode'}>{isDark ? '🌞' : '🌙'}</Icon>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
        </header>

        {/* SMS section removed per request */}

        {/* Templates removed per request */}

        {/* Account (demo only) */}
        <section className="settings__section settings__section--account" aria-labelledby="account-title">
          <h2 id="account-title" className="settings__section-title">Account</h2>
          <p className="settings__desc">Demo content to illustrate semantic grouping.</p>
          <div className="settings__actions">
            <button className="settings__button settings__button--secondary" onClick={() => alert('This is a demo action')}>Logout</button>
          </div>
        </section>

      </div>
    </main>
  );
};

export default SettingsSemantic;