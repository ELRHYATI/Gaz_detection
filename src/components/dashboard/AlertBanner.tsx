import React, { useEffect, useState } from 'react';
import type { AlertLevel } from '../../types';
import { getAlertIcon } from '../../utils/alerts';
import { setActuatorStates } from '../../utils/firebase';
import { APP_CONFIG } from '../../config/app';
import { FiPhoneCall, FiMail, FiMessageSquare } from 'react-icons/fi';

interface AlertBannerProps {
  level: AlertLevel;
  message?: string;
  onDismiss?: () => void;
  expiresAt?: number;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ level, message, onDismiss, expiresAt }) => {
  const icon = getAlertIcon(level.level);
  const [remainingMs, setRemainingMs] = useState<number>(() => (expiresAt ? Math.max(0, expiresAt - Date.now()) : 0));

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemainingMs(Math.max(0, expiresAt - Date.now()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  const formatRemaining = (ms: number) => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getBannerClasses = (alert: AlertLevel['level']) => {
    switch (alert) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200';
      case 'danger':
        return 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/30 dark:border-danger-800 dark:text-danger-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200';
    }
  };

  const [contactOpen, setContactOpen] = useState(false);
  const phoneDigits = String((APP_CONFIG as any).emergency?.phone || '112').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${phoneDigits}`;
  const smsUrl = `sms:${phoneDigits}?body=${encodeURIComponent('Urgence gaz - assistance requise')}`;
  const mailAddr = (APP_CONFIG as any).emergency?.email || '';
  const mailUrl = mailAddr ? `mailto:${mailAddr}?subject=${encodeURIComponent('Urgence gaz - assistance requise')}&body=${encodeURIComponent('Alerte critique détectée. Veuillez intervenir immédiatement.')}` : '';

  return (
    <div className={`rounded-lg border p-4 ${getBannerClasses(level.level)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">
            {icon}
          </span>
          <div>
            <h3 className="font-semibold">
              {level.level === 'critical' ? 'Alerte Critique' :
               level.level === 'danger' ? 'Danger' :
               level.level === 'warning' ? 'Avertissement' : 'Normal'}
            </h3>
            <p className="text-sm mt-1">{message || level.message}</p>
            {expiresAt && level.level === 'danger' && (
              <p className="text-xs mt-1 opacity-80">Disparition automatique dans {formatRemaining(remainingMs)}</p>
            )}
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {level.level === 'critical' && (
        <div className="mt-4 flex space-x-3">
          <button
            className="btn-danger text-sm"
            onClick={async () => {
              try {
                await setActuatorStates({ LED_rouge: 'ON', LED_verte: 'OFF', buzzer: 'ON', fenetres: 'OUVERT' }, 'emergency');
              } catch (e) {
                console.error('Evacuation command failed', e);
              }
            }}
          >
            Évacuation d'urgence
          </button>
          <button className="btn-secondary text-sm" onClick={() => setContactOpen(true)}>Contacter les secours</button>
        </div>
      )}

      {/* Contact options modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contacter les secours</h4>
            </div>
            <div className="p-4 space-y-3">
              <button
                className="w-full flex items-center gap-2 btn-primary"
                onClick={() => { try { window.open(`tel:${phoneDigits}`); } catch {} }}
              >
                <FiPhoneCall className="h-4 w-4" /> Appeler {phoneDigits}
              </button>
              <button
                className="w-full flex items-center gap-2 btn-secondary"
                onClick={() => { try { window.open(smsUrl); } catch {} }}
              >
                <FiMessageSquare className="h-4 w-4" /> Envoyer SMS
              </button>
              <button
                className="w-full flex items-center gap-2 btn-secondary"
                onClick={() => { try { window.open(whatsappUrl); } catch {} }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-4 w-4" /> WhatsApp
              </button>
              {mailAddr && (
                <button
                  className="w-full flex items-center gap-2 btn-secondary"
                  onClick={() => { try { window.open(mailUrl); } catch {} }}
                >
                  <FiMail className="h-4 w-4" /> Email
                </button>
              )}
              <button
                className="w-full text-xs text-gray-600 dark:text-gray-300 underline"
                onClick={async () => { try { await navigator.clipboard.writeText(phoneDigits); } catch {}; }}
              >
                Copier le numéro
              </button>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-right">
              <button className="btn-secondary text-sm" onClick={() => setContactOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBanner;