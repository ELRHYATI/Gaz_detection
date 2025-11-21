import React, { useEffect, useState } from 'react';
import { FiToggleLeft, FiCheck, FiX, FiRotateCcw } from 'react-icons/fi';
import { subscribeToMotorStatus, subscribeToMotorState, subscribeToWindowControl, subscribeToActionneursFenetre, setActionneursFenetre } from '../utils/firebase';
import type { MotorStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const MotorControl: React.FC = () => {
  const { currentUser } = useAuth();
  // commanded status not used in UI; track last update/actor only
  const [actual, setActual] = useState<MotorStatus | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [wc, setWc] = useState<{ current_state: 'open'|'closed'; servo_position: number; last_updated: number; manual_override: boolean } | null>(null);
  const [fenetresAct, setFenetresAct] = useState<'FERME' | 'OUVERT' | null>(null);
  const [fenetresError, setFenetresError] = useState<string | null>(null);
  const [statusPulse, setStatusPulse] = useState(false);

  useEffect(() => {
    const u1 = subscribeToMotorStatus((_status) => {
      setLastUpdated(Date.now());
      setUpdatedBy(currentUser?.email || 'system');
    });
    const u2 = subscribeToMotorState((state) => {
      setActual(state);
    });
    const u3 = subscribeToWindowControl((ctrl) => {
      setWc(ctrl);
    }, (err) => { console.error(err); });
    const u4 = subscribeToActionneursFenetre((state) => {
      setFenetresAct(state);
    }, (err) => setFenetresError(err.message || String(err)));
    return () => { u1(); u2(); u3(); u4(); };
  }, [currentUser?.email]);

  // Micro-animation when window actuator state changes
  useEffect(() => {
    if (fenetresAct !== null) {
      setStatusPulse(true);
      const t = setTimeout(() => setStatusPulse(false), 400);
      return () => clearTimeout(t);
    }
  }, [fenetresAct]);

  // Manual motor control is handled via actionneurs/fenetres for this UI variant

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contrôle du moteur</h1>
          <p className="text-gray-600 dark:text-gray-400">Pilotez le servomoteur à distance</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <FiRotateCcw className="h-4 w-4" />
          <span>Statut en temps réel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualization Card */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-500/20 via-emerald-500/20 to-cyan-500/20 dark:from-primary-400/10 dark:via-emerald-400/10 dark:to-cyan-400/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <FiToggleLeft className="h-6 w-6 text-primary-600 dark:text-primary-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aperçu du servomoteur</h3>
            </div>
          </div>
          <div className="p-6">
              <div className="relative mx-auto w-64 h-64 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
              {/* Glow ring */}
              <div className={`absolute inset-0 rounded-full ${actual === 'open' ? 'ring-4 ring-emerald-400/50' : 'ring-4 ring-rose-400/50'}`} />
              {/* Gate preview */}
              <svg width="200" height="200" viewBox="0 0 200 200" className="relative">
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="2" />
                {/* Pivot */}
                <circle cx="100" cy="100" r="6" fill="currentColor" className="text-gray-500 dark:text-gray-300" />
                {/* Arm: rotates when open */}
                <g transform={`rotate(${actual === 'open' ? 50 : 0} 100 100)`}>
                  <rect x="100" y="95" width="70" height="10" fill="currentColor" className={actual === 'open' ? 'text-emerald-500' : 'text-rose-500'} rx="5" />
                </g>
                {/* Gate panel */}
                <rect x="25" y="60" width="30" height="80" fill="currentColor" className="text-gray-300 dark:text-gray-600" rx="6" />
              </svg>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">État actuel</div>
                <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${
                  actual === 'open'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {actual === 'open' ? (
                    <>
                      <FiCheck className="mr-1 h-4 w-4" /> Ouvert
                    </>
                  ) : (
                    <>
                      <FiX className="mr-1 h-4 w-4" /> Fermé
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-gray-600 dark:text-gray-400">Dernière mise à jour</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-gray-600 dark:text-gray-400">Par</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{updatedBy || '—'}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 col-span-2">
                <div className="text-gray-600 dark:text-gray-400">Commande vs état</div>
                <div className={`font-medium ${wc?.current_state && actual && wc.current_state === actual ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                  {wc?.current_state && actual ? `Commande (manuel): ${wc.current_state} • État: ${actual} ${wc.current_state === actual ? '✓' : '↻ en synchronisation...'}` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actionneurs/Fenêtres Card (compact right for desktop) */}
        <div className="hidden lg:block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:max-w-sm lg:justify-self-end">
          <div className="px-6 py-4 bg-gradient-to-r from-teal-500/20 via-green-500/20 to-lime-500/20 dark:from-teal-400/10 dark:via-green-400/10 dark:to-lime-400/10">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fenêtres (actionneurs)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-gray-600 dark:text-gray-400">État actuel</div>
                <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium transition-transform duration-300 ${statusPulse ? 'scale-105 shadow-sm' : ''} ${
                  fenetresAct === 'OUVERT'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {fenetresAct === 'OUVERT' ? (
                    <>
                      <FiCheck className="mr-1 h-4 w-4" /> Ouvert
                    </>
                  ) : (
                    <>
                      <FiX className="mr-1 h-4 w-4" /> Fermé
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Compact buttons */}
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Contrôle</span>
              <div className="mt-2 space-y-2">
                <button
                  onClick={async () => {
                    setFenetresError(null);
                    try { await setActionneursFenetre('FERME', currentUser?.email || 'system'); }
                    catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de la fermeture'; setFenetresError(message); }
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors border ${fenetresAct === 'FERME' ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800'}`}
                  aria-pressed={fenetresAct === 'FERME'}
                >
                  <FiX className="h-4 w-4" /> Fermer
                </button>
                <button
                  onClick={async () => {
                    setFenetresError(null);
                    try { await setActionneursFenetre('OUVERT', currentUser?.email || 'system'); }
                    catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de l\'ouverture'; setFenetresError(message); }
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors border ${fenetresAct === 'OUVERT' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'}`}
                  aria-pressed={fenetresAct === 'OUVERT'}
                >
                  <FiCheck className="h-4 w-4" /> Ouvrir
                </button>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Le changement s'applique instantanément et synchronise le servomoteur.</p>
              </div>
            </div>

            {fenetresError && (
              <div className="text-sm text-danger-700 dark:text-danger-400">{fenetresError}</div>
            )}
          </div>
        </div>

      </div>
      
      {/* Actionneurs/Fenêtres Card */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-teal-500/20 via-green-500/20 to-lime-500/20 dark:from-teal-400/10 dark:via-green-400/10 dark:to-lime-400/10">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fenêtres (actionneurs)</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-600 dark:text-gray-400">État actuel</div>
              <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium transition-transform duration-300 ${statusPulse ? 'scale-105 shadow-sm' : ''} ${
                fenetresAct === 'OUVERT'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
              }`}>
                {fenetresAct === 'OUVERT' ? (
                  <>
                    <FiCheck className="mr-1 h-4 w-4" /> Ouvert
                  </>
                ) : (
                  <>
                    <FiX className="mr-1 h-4 w-4" /> Fermé
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Creative segmented control for open/close */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Contrôle</span>
              <div className="relative inline-flex rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-xs">
                {/* Animated highlight */}
                <span
                  className={`absolute inset-y-0 left-0 w-1/2 rounded-full opacity-20 transition-transform duration-300 ease-out ${fenetresAct === 'OUVERT' ? 'translate-x-full bg-emerald-600' : 'translate-x-0 bg-rose-600'}`}
                />
                <button
                  onClick={async () => {
                    setFenetresError(null);
                    try { await setActionneursFenetre('FERME', currentUser?.email || 'system'); }
                    catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de la fermeture'; setFenetresError(message); }
                  }}
                  className={`relative px-3 py-1 font-medium flex items-center gap-1 transition-colors ${fenetresAct === 'FERME' ? 'text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-rose-100 dark:hover:bg-rose-900/30'}`}
                >
                  <FiX className="h-3 w-3" /> Fermer
                </button>
                <button
                  onClick={async () => {
                    setFenetresError(null);
                    try { await setActionneursFenetre('OUVERT', currentUser?.email || 'system'); }
                    catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de l\'ouverture'; setFenetresError(message); }
                  }}
                  className={`relative px-3 py-1 font-medium flex items-center gap-1 transition-colors ${fenetresAct === 'OUVERT' ? 'text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}
                >
                  <FiCheck className="h-3 w-3" /> Ouvrir
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Le changement s'applique instantanément et synchronise le servomoteur.</p>
          </div>

          {fenetresError && (
            <div className="text-sm text-danger-700 dark:text-danger-400">{fenetresError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotorControl;