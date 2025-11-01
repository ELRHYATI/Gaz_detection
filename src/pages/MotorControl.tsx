import React, { useEffect, useState } from 'react';
import { FiToggleLeft, FiCheck, FiX, FiRotateCcw } from 'react-icons/fi';
import { updateServoMotorState, subscribeToServoMotorState } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';

const MotorControl: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToServoMotorState((state) => {
      if (state?.isOpen !== undefined) {
        setIsOpen(state.isOpen);
      }
      if (state?.lastUpdated) setLastUpdated(state.lastUpdated);
      if (state?.updatedBy) setUpdatedBy(state.updatedBy);
    });
    return () => unsubscribe();
  }, []);

  const toggleMotor = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateServoMotorState({
        isOpen: !isOpen,
        lastUpdated: Date.now(),
        updatedBy: currentUser?.email || 'system',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur lors de la mise à jour du moteur';
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
              <div className={`absolute inset-0 rounded-full ${isOpen ? 'ring-4 ring-emerald-400/50' : 'ring-4 ring-rose-400/50'}`} />
              {/* Gate preview */}
              <svg width="200" height="200" viewBox="0 0 200 200" className="relative">
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="2" />
                {/* Pivot */}
                <circle cx="100" cy="100" r="6" fill="currentColor" className="text-gray-500 dark:text-gray-300" />
                {/* Arm: rotates when open */}
                <g transform={`rotate(${isOpen ? 50 : 0} 100 100)`}>
                  <rect x="100" y="95" width="70" height="10" fill="currentColor" className={isOpen ? 'text-emerald-500' : 'text-rose-500'} rx="5" />
                </g>
                {/* Gate panel */}
                <rect x="25" y="60" width="30" height="80" fill="currentColor" className="text-gray-300 dark:text-gray-600" rx="6" />
              </svg>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">État actuel</div>
                <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${
                  isOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {isOpen ? (
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
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-400/10 dark:via-purple-400/10 dark:to-pink-400/10">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Commandes</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Big action button */}
            <button
              onClick={toggleMotor}
              disabled={loading}
              className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-3 font-medium transition-all
                ${loading ? 'opacity-60 cursor-not-allowed' : ''}
                ${isOpen ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            >
              {loading ? 'Mise à jour...' : isOpen ? 'Fermer' : 'Ouvrir'}
            </button>

            {/* Fancy toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Basculer l'état</span>
              <button
                onClick={toggleMotor}
                disabled={loading}
                aria-label="Basculer l'état du servomoteur"
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isOpen ? 'bg-emerald-500' : 'bg-gray-400'} ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'}`}
              >
                <span className={`inline-block h-7 w-7 rounded-full bg-white shadow transform transition-transform ${isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Safety note */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              Assurez-vous que la zone est sécurisée avant de changer l'état.
            </div>

            {error && (
              <div className="text-sm text-danger-700 dark:text-danger-400">{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotorControl;