import React, { useEffect, useState } from 'react';
import { FiMoon, FiSun, FiBell, FiAlertTriangle, FiAlertOctagon, FiUser, FiLogOut, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { getNotificationProvidersSettings, saveNotificationProvidersSettings, saveTelegramProviderSettings, saveCallMeBotProviderSettings } from '../utils/firebase';

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

  // Dark mode brightness variable (overlays ambient background opacities)
  const [dmOverlay, setDmOverlay] = useState<number>(() => {
    const stored = localStorage.getItem('dmOverlay');
    return stored ? parseFloat(stored) : 1;
  });

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

  // Apply brightness to CSS variable
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--dm-overlay', String(dmOverlay));
    localStorage.setItem('dmOverlay', String(dmOverlay));
  }, [dmOverlay]);

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

  // Notifications Provider (admin)
  const [providerPrimary, setProviderPrimary] = useState<'telegram' | 'callmebot' | 'none'>('none');
  const [deliveryMode, setDeliveryMode] = useState<'global' | 'per_user'>('global');
  const [telegramToken, setTelegramToken] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [callmePhone, setCallmePhone] = useState<string>('');
  const [callmeApiKey, setCallmeApiKey] = useState<string>('');
  const [providerStatus, setProviderStatus] = useState<string>('');

  useEffect(() => {
    // Load provider settings on mount
    (async () => {
      try {
        const s = await getNotificationProvidersSettings();
        if (s) {
          setProviderPrimary((s.primary as any) || 'none');
          setDeliveryMode((s as any).delivery_mode || 'global');
          setTelegramToken(s.telegram?.token || '');
          setTelegramChatId(s.telegram?.chat_id || '');
          setCallmePhone(s.callmebot?.phone || '');
          setCallmeApiKey(s.callmebot?.apikey || '');
        }
      } catch (e) {
        setProviderStatus('Failed to load provider settings');
        console.error(e);
      }
    })();
  }, []);

  const saveProviderSettings = async () => {
    setProviderStatus('');
    try {
      await saveNotificationProvidersSettings({
        primary: providerPrimary === 'none' ? undefined : providerPrimary,
        delivery_mode: deliveryMode,
        // Telegram token is saved securely via Cloud Function below
        telegram: { token: undefined, chat_id: telegramChatId || undefined },
        // CallMeBot apikey is saved securely via Cloud Function below
        callmebot: { phone: callmePhone || undefined, apikey: undefined },
      } as any);
      // Save Telegram provider securely
      if (providerPrimary === 'telegram') {
        const r = await saveTelegramProviderSettings({ bot_token: telegramToken, chat_id: telegramChatId, enabled: true });
        if (!r.ok) throw new Error(r.errorMessage || 'Failed to save Telegram settings');
      }
      // Save CallMeBot provider securely
      if (providerPrimary === 'callmebot') {
        const r2 = await saveCallMeBotProviderSettings({ phone: callmePhone, apikey: callmeApiKey, enabled: true });
        if (!r2.ok) throw new Error(r2.errorMessage || 'Failed to save CallMeBot settings');
      }
      setProviderStatus('Saved successfully');
    } catch (e) {
      console.error(e);
      setProviderStatus('Save failed');
    }
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

        {/* Dark mode brightness slider */}
        <div className="mt-6">
          <label htmlFor="dm-brightness" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            {t('settings.darkBrightness', 'Dark mode brightness')}
          </label>
          <input
            id="dm-brightness"
            type="range"
            min={0.85}
            max={1.15}
            step={0.01}
            value={dmOverlay}
            onChange={(e) => setDmOverlay(parseFloat(e.target.value))}
            className="w-full accent-primary-600 dark:accent-primary-400"
            aria-valuemin={0.85}
            aria-valuemax={1.15}
            aria-valuenow={dmOverlay}
          />
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {t('settings.darkBrightnessHelp', 'Fine-tune dark surface brightness for comfort.')}
          </p>
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

      {/* Notifications Provider */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FiBell className="h-5 w-5" />
          <span>Notifications Provider</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure Telegram or CallMeBot and delivery mode.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Primary Provider</label>
            <select
              value={providerPrimary}
              onChange={(e) => setProviderPrimary(e.target.value as any)}
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="none">None</option>
              <option value="telegram">Telegram</option>
              <option value="callmebot">CallMeBot (WhatsApp)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Delivery Mode</label>
            <select
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as any)}
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="global">Global (one destination)</option>
              <option value="per_user">Per-User (uses user chat IDs)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Telegram Bot Token</label>
            <input
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Telegram Chat ID (Global)</label>
            <input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Optional if per-user"
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CallMeBot Phone (+country number)</label>
            <input
              value={callmePhone}
              onChange={(e) => setCallmePhone(e.target.value)}
              placeholder="+123456789"
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CallMeBot API Key</label>
            <input
              value={callmeApiKey}
              onChange={(e) => setCallmeApiKey(e.target.value)}
              placeholder="apikey"
              className="input-field w-full bg-white/70 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={saveProviderSettings}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
          >
            Save Provider Settings
          </button>
          
          {providerStatus && <span className="text-sm text-gray-600 dark:text-gray-400">{providerStatus}</span>}
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