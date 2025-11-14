import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiBell, FiAlertTriangle, FiAlertOctagon, FiUser, FiLogOut, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [notifyCritical, setNotifyCritical] = useState<boolean>(localStorage.getItem('notifyCritical') !== 'false');
  const [notifyDanger, setNotifyDanger] = useState<boolean>(localStorage.getItem('notifyDanger') !== 'false');
  const [notifyWarning, setNotifyWarning] = useState<boolean>(localStorage.getItem('notifyWarning') === 'true');
  const [paletteCritical, setPaletteCritical] = useState<string>(localStorage.getItem('palette.critical') ?? 'red');
  const [paletteDanger, setPaletteDanger] = useState<string>(localStorage.getItem('palette.danger') ?? 'orange');
  const [paletteWarning, setPaletteWarning] = useState<string>(localStorage.getItem('palette.warning') ?? 'amber');
  const { t, locale, setLocale } = useI18n();
  const [language, setLanguage] = useState<string>(locale);
  // SMS section removed

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    const isDark = storedTheme ? storedTheme === 'dark' : root.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const applyTheme = (nextDark: boolean) => {
    const root = document.documentElement;
    root.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    setDarkMode(nextDark);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotificationsSave = (crit: boolean, danger: boolean, warn: boolean) => {
    localStorage.setItem('notifyCritical', crit ? 'true' : 'false');
    localStorage.setItem('notifyDanger', danger ? 'true' : 'false');
    localStorage.setItem('notifyWarning', warn ? 'true' : 'false');
  };

  // SMS section removed

  // SMS actions removed

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const savePalette = (crit: string, danger: string, warn: string) => {
    localStorage.setItem('palette.critical', crit);
    localStorage.setItem('palette.danger', danger);
    localStorage.setItem('palette.warning', warn);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title', 'Settings')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.subtitle', 'Manage your account preferences')}</p>
        </div>
      </div>

      {/* SMS Notifications section removed */}

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FiMoon className="h-5 w-5" />
          <span>{t('settings.appearance', 'Appearance')}</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.appearanceDesc', 'Choose the application display mode.')}</p>

        <div className="mt-4 flex items-center space-x-3">
          <button
            className={`px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
            onClick={() => applyTheme(!darkMode)}
            aria-label={darkMode ? t('settings.lightMode', 'Switch to light mode') : t('settings.darkMode', 'Switch to dark mode')}
          >
            <span className="inline-flex items-center space-x-2">
              {darkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
              <span>{darkMode ? t('settings.lightMode', 'Light mode') : t('settings.darkMode', 'Dark mode')}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FiBell className="h-5 w-5" />
          <span>{t('settings.notifications', 'Notifications')}</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.notificationsDesc', 'Enable or disable alerts.')}</p>

        <div className="mt-4 space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-indigo-400"
              checked={notifyCritical}
              onChange={(e) => {
                const next = e.target.checked; setNotifyCritical(next); handleNotificationsSave(next, notifyDanger, notifyWarning);
              }}
            />
            <span className="text-sm text-gray-800 dark:text-gray-200 inline-flex items-center space-x-2">
              <FiAlertOctagon className="h-4 w-4" />
              <span>{t('settings.notify.critical', 'Critical alert')}</span>
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-indigo-400"
              checked={notifyDanger}
              onChange={(e) => {
                const next = e.target.checked; setNotifyDanger(next); handleNotificationsSave(notifyCritical, next, notifyWarning);
              }}
            />
            <span className="text-sm text-gray-800 dark:text-gray-200 inline-flex items-center space-x-2">
              <FiAlertTriangle className="h-4 w-4" />
              <span>{t('settings.notify.danger', 'Danger')}</span>
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-indigo-400"
              checked={notifyWarning}
              onChange={(e) => {
                const next = e.target.checked; setNotifyWarning(next); handleNotificationsSave(notifyCritical, notifyDanger, next);
              }}
            />
            <span className="text-sm text-gray-800 dark:text-gray-200 inline-flex items-center space-x-2">
              <FiAlertTriangle className="h-4 w-4" />
              <span>{t('settings.notify.warning', 'Warning')}</span>
            </span>
          </label>
        </div>
      </div>

      {/* Emergency Contact (WhatsApp) removed */}

      {/* Emergency Message Templates removed */}

      {/* Severity Colors */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FiAlertOctagon className="h-5 w-5" />
          <span>{t('settings.severityColors', 'Severity Colors')}</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.severityColorsDesc', 'Customize the color palette used for alert severities.')}</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Critical</label>
            <select
              value={paletteCritical}
              onChange={(e) => { const v = e.target.value; setPaletteCritical(v); savePalette(v, paletteDanger, paletteWarning); }}
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="amber">Amber</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Danger</label>
            <select
              value={paletteDanger}
              onChange={(e) => { const v = e.target.value; setPaletteDanger(v); savePalette(paletteCritical, v, paletteWarning); }}
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="amber">Amber</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Warning</label>
            <select
              value={paletteWarning}
              onChange={(e) => { const v = e.target.value; setPaletteWarning(v); savePalette(paletteCritical, paletteDanger, v); }}
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="amber">Amber</option>
            </select>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FiGlobe className="h-5 w-5" />
          <span>{t('settings.language', 'Language')}</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.languageDesc', 'Select your preferred language.')}</p>
        <div className="mt-4 flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => { const val = e.target.value; handleLanguageChange(val); setLocale(val as 'en' | 'fr'); }}
            className="input-field w-40 bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          >
            <option value="en">{t('settings.language.en', 'English')}</option>
            <option value="fr">{t('settings.language.fr', 'French')}</option>
          </select>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FiUser className="h-5 w-5" />
          <span>{t('settings.account', 'Account')}</span>
        </h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser?.displayName || 'User'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{currentUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-danger-600 text-white hover:bg-danger-700"
          >
            <FiLogOut className="h-4 w-4" />
            <span>{t('settings.logout', 'Logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;