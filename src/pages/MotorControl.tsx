import React, { useEffect, useState } from 'react';
import { FiToggleLeft, FiCheck, FiX, FiRotateCcw } from 'react-icons/fi';
import { subscribeToMotorStatus, subscribeToMotorState, subscribeToWindowControl, setWindowManualOverride, setWindowControlState, subscribeToActionneursFenetre, setActionneursFenetre, subscribeToServoManuelCommand, setServoManuelCommand } from '../utils/firebase';
import type { MotorStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const MotorControl: React.FC = () => {
  const { currentUser } = useAuth();
  // commanded status not used in UI; track last update/actor only
  const [actual, setActual] = useState<MotorStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [wc, setWc] = useState<{ current_state: 'open'|'closed'; servo_position: number; last_updated: number; manual_override: boolean } | null>(null);
  const [wcError, setWcError] = useState<string | null>(null);
  const [fenetresAct, setFenetresAct] = useState<'FERME' | 'OUVERT' | null>(null);
  const [fenetresError, setFenetresError] = useState<string | null>(null);
  const [servoCmd, setServoCmd] = useState<'open' | 'closed' | null>(null);
  const [servoCmdError, setServoCmdError] = useState<string | null>(null);

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
    }, (err) => setWcError(err.message || String(err)));
    const u4 = subscribeToActionneursFenetre((state) => {
      setFenetresAct(state);
    }, (err) => setFenetresError(err.message || String(err)));
    const u5 = subscribeToServoManuelCommand((cmd) => {
      setServoCmd(cmd);
    }, (err) => setServoCmdError(err.message || String(err)));
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [currentUser?.email]);

  const toggleMotor = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!wc?.manual_override) {
        setError('Activez le mode manuel pour envoyer des commandes au servomoteur');
        return;
      }
      const next: MotorStatus = wc?.current_state === 'open' ? 'closed' : 'open';
      await setWindowControlState(next);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour du servomoteur';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const setState = async (state: MotorStatus) => {
    setLoading(true);
    setError(null);
    try {
      if (!wc?.manual_override) {
        setError('Activez le mode manuel pour envoyer des commandes au servomoteur');
        return;
      }
      await setWindowControlState(state);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour du servomoteur';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Controls Card (manual servo commands) */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-400/10 dark:via-purple-400/10 dark:to-pink-400/10">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Commandes (servo manuel)</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Big action button */}
            <button
              onClick={toggleMotor}
              disabled={loading || !wc?.manual_override}
              className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-3 font-medium transition-all
                ${loading || !wc?.manual_override ? 'opacity-60 cursor-not-allowed' : ''}
                ${wc?.current_state === 'open' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            >
              {loading ? 'Mise à jour...' : wc?.current_state === 'open' ? 'Fermer' : 'Ouvrir'}
            </button>

            {/* Fancy toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Basculer l'état</span>
              <button
                onClick={toggleMotor}
                disabled={loading || !wc?.manual_override}
                aria-label="Basculer l'état du servomoteur"
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${wc?.current_state === 'open' ? 'bg-emerald-500' : 'bg-gray-400'} ${loading || !wc?.manual_override ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'}`}
              >
                <span className={`inline-block h-7 w-7 rounded-full bg-white shadow transform transition-transform ${wc?.current_state === 'open' ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Explicit overrides */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setState('closed')}
                disabled={loading || !wc?.manual_override}
                className="w-full rounded-lg px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                Forcer: Fermer
              </button>
              <button
                onClick={() => setState('open')}
                disabled={loading || !wc?.manual_override}
                className="w-full rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Forcer: Ouvrir
              </button>
            </div>

            {/* Safety note */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              Assurez-vous que la zone est sécurisée avant de changer l'état.
            </div>

            {error && (
              <div className="text-sm text-danger-700 dark:text-danger-400">{error}</div>
            )}

            {/* Manual command channel: commandes/servo_manuel */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Canal de commande RTDB</div>
                  <div className="font-mono text-xs text-gray-700 dark:text-gray-300">commandes/servo_manuel</div>
                </div>
                <div className={`text-sm font-medium ${servoCmd === 'open' ? 'text-emerald-600 dark:text-emerald-300' : servoCmd === 'closed' ? 'text-rose-600 dark:text-rose-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {servoCmd === 'open' ? 'Valeur actuelle: open' : servoCmd === 'closed' ? 'Valeur actuelle: closed' : '—'}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    setServoCmdError(null);
                    try { await setServoManuelCommand('closed'); }
                    catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de l\'écriture'; setServoCmdError(message); }
                  }}
                  className="w-full rounded-lg px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  Écrire: closed
                </button>
                <button
                  onClick={async () => {
                    setServoCmdError(null);
                    try { await setServoManuelCommand('open'); }
                    catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de l\'écriture'; setServoCmdError(message); }
                  }}
                  className="w-full rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Écrire: open
                </button>
              </div>
              {servoCmdError && (
                <div className="mt-2 text-sm text-danger-700 dark:text-danger-400">{servoCmdError}</div>
              )}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Écrire ici déclenche l\'application par fonctions Cloud et active le mode manuel automatiquement.
              </div>
            </div>
          </div>
        </div>

        {/* Window Control Card */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 dark:from-blue-400/10 dark:via-cyan-400/10 dark:to-teal-400/10">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contrôle de la fenêtre</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-gray-600 dark:text-gray-400">État actuel</div>
                <div className={`font-medium ${wc?.current_state === 'open' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{wc ? (wc.current_state === 'open' ? 'Ouvert' : 'Fermé') : '—'}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-gray-600 dark:text-gray-400">Position du servo</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{wc ? `${wc.servo_position}°` : '—'}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 col-span-2">
                <div className="text-gray-600 dark:text-gray-400">Dernière mise à jour</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{wc?.last_updated ? new Date(wc.last_updated).toLocaleString() : '—'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mode manuel (override)</span>
              <button
                onClick={async () => {
                  setWcError(null);
                  try {
                    await setWindowManualOverride(!wc?.manual_override);
                  } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : 'Erreur lors du changement du mode manuel';
                    setWcError(message);
                  }
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${wc?.manual_override ? 'bg-emerald-500' : 'bg-gray-400'}`}
              >
                <span className={`inline-block h-7 w-7 rounded-full bg-white shadow transform transition-transform ${wc?.manual_override ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  setWcError(null);
                  try {
                    await setWindowControlState('closed');
                  } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : 'Erreur lors de la fermeture de la fenêtre';
                    setWcError(message);
                  }
                }}
                disabled={!wc?.manual_override}
                className={`w-full rounded-lg px-4 py-2 ${wc?.manual_override ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-400'} text-white font-medium`}
              >
                Fermer la fenêtre
              </button>
              <button
                onClick={async () => {
                  setWcError(null);
                  try {
                    await setWindowControlState('open');
                  } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : 'Erreur lors de l\'ouverture de la fenêtre';
                    setWcError(message);
                  }
                }}
                disabled={!wc?.manual_override}
                className={`w-full rounded-lg px-4 py-2 ${wc?.manual_override ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'} text-white font-medium`}
              >
                Ouvrir la fenêtre
              </button>
            </div>

            {wcError && (
              <div className="text-sm text-danger-700 dark:text-danger-400">{wcError}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actionneurs/Fenêtres Card */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="px-6 py-4 bg-gradient-to-r from-teal-500/20 via-green-500/20 to-lime-500/20 dark:from-teal-400/10 dark:via-green-400/10 dark:to-lime-400/10">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fenêtres (actionneurs)</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-600 dark:text-gray-400">État actuel</div>
              <div className={`font-medium ${fenetresAct === 'OUVERT' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{fenetresAct ? (fenetresAct === 'OUVERT' ? 'Ouvert' : 'Fermé') : '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-600 dark:text-gray-400">Chemin</div>
              <div className="font-mono text-xs text-gray-700 dark:text-gray-300">actionneurs/fenetres</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Basculer la fenêtre</span>
            <button
              onClick={async () => {
                setFenetresError(null);
                try {
                  const next = fenetresAct === 'OUVERT' ? 'FERME' : 'OUVERT';
                  await setActionneursFenetre(next, currentUser?.email || 'system');
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour de la fenêtre';
                  setFenetresError(message);
                }
              }}
              aria-label="Basculer l'état de la fenêtre"
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${fenetresAct === 'OUVERT' ? 'bg-emerald-500' : 'bg-gray-400'} hover:brightness-110`}
            >
              <span className={`inline-block h-7 w-7 rounded-full bg-white shadow transform transition-transform ${fenetresAct === 'OUVERT' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                setFenetresError(null);
                try { await setActionneursFenetre('FERME', currentUser?.email || 'system'); }
                catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de la fermeture'; setFenetresError(message); }
              }}
              className="w-full rounded-lg px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              Fermer
            </button>
            <button
              onClick={async () => {
                setFenetresError(null);
                try { await setActionneursFenetre('OUVERT', currentUser?.email || 'system'); }
                catch (e: unknown) { const message = e instanceof Error ? e.message : 'Erreur lors de l\'ouverture'; setFenetresError(message); }
              }}
              className="w-full rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Ouvrir
            </button>
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