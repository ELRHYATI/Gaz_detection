import React from 'react';
import { useForm } from 'react-hook-form';
import { saveThreshold, subscribeToThreshold } from '../utils/firebase';
import type { Threshold } from '../types';
import { useAuth } from '../contexts/AuthContext';

const defaultThreshold: Omit<Threshold, 'id' | 'updatedAt' | 'updatedBy'> = {
  gasMin: 0,
  gasMax: 200,
  humidityMin: 20,
  humidityMax: 80,
  temperatureMin: 0,
  temperatureMax: 40,
};

const Thresholds: React.FC = () => {
  const { currentUser } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Threshold>({
    defaultValues: {
      id: 'current',
      ...defaultThreshold,
      updatedAt: Date.now(),
      updatedBy: currentUser?.email || 'system',
    }
  });

  React.useEffect(() => {
    const unsubscribe = subscribeToThreshold((thr) => {
      if (thr) {
        setValue('gasMin', thr.gasMin);
        setValue('gasMax', thr.gasMax);
        setValue('humidityMin', thr.humidityMin);
        setValue('humidityMax', thr.humidityMax);
        setValue('temperatureMin', thr.temperatureMin);
        setValue('temperatureMax', thr.temperatureMax);
      }
    });
    return () => unsubscribe();
  }, [setValue]);

  

  const onSubmit = async (data: Threshold) => {
    const payload = {
      gasMin: Number(data.gasMin),
      gasMax: Number(data.gasMax),
      humidityMin: Number(data.humidityMin),
      humidityMax: Number(data.humidityMax),
      temperatureMin: Number(data.temperatureMin),
      temperatureMax: Number(data.temperatureMax),
      updatedAt: Date.now(),
      updatedBy: currentUser?.email || 'system',
    };
    await saveThreshold(payload);
  };

  const gasMin = watch('gasMin');
  const gasMax = watch('gasMax');
  const humidityMin = watch('humidityMin');
  const humidityMax = watch('humidityMax');
  const temperatureMin = watch('temperatureMin');
  const temperatureMax = watch('temperatureMax');

  // Slider domains
  const GAS_MIN_DOMAIN = 0;
  const GAS_MAX_DOMAIN = 400;
  const HUM_MIN_DOMAIN = 0;
  const HUM_MAX_DOMAIN = 100;
  const TEMP_MIN_DOMAIN = -20;
  const TEMP_MAX_DOMAIN = 60;

  // Helper to compute selection bar positions
  const rangePct = (min: number | undefined, max: number | undefined, domainMin: number, domainMax: number) => {
    const minVal = Number(min ?? domainMin);
    const maxVal = Number(max ?? domainMax);
    const total = domainMax - domainMin;
    const left = ((minVal - domainMin) / total) * 100;
    const width = ((maxVal - minVal) / total) * 100;
    return { left: `${Math.max(0, Math.min(100, left))}%`, width: `${Math.max(0, Math.min(100, width))}%` };
  };

  const gasBar = rangePct(gasMin, gasMax, GAS_MIN_DOMAIN, GAS_MAX_DOMAIN);
  const humBar = rangePct(humidityMin, humidityMax, HUM_MIN_DOMAIN, HUM_MAX_DOMAIN);
  const tempBar = rangePct(temperatureMin, temperatureMax, TEMP_MIN_DOMAIN, TEMP_MAX_DOMAIN);

  const resetDefaults = () => {
    setValue('gasMin', defaultThreshold.gasMin);
    setValue('gasMax', defaultThreshold.gasMax);
    setValue('humidityMin', defaultThreshold.humidityMin);
    setValue('humidityMax', defaultThreshold.humidityMax);
    setValue('temperatureMin', defaultThreshold.temperatureMin);
    setValue('temperatureMax', defaultThreshold.temperatureMax);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Seuils d'alerte</h1>
          <p className="text-gray-600 dark:text-gray-300">Affinez les bornes min/max avec aperçus en temps réel</p>
        </div>
        <button type="button" onClick={resetDefaults} className="btn-secondary">Réinitialiser par défaut</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gas Card */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-red-500/20 dark:from-green-400/10 dark:via-yellow-400/10 dark:to-red-400/10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{
                  /* gas icon */
                }<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10v10a5 5 0 1 1-10 0V2z"/><path d="M5 22h14v-2H5v2z"/></svg></span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gaz (ppm)</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative h-2 rounded bg-gradient-to-r from-green-500 via-yellow-500 to-red-500">
                <div className="absolute top-0 h-2 bg-white/70 dark:bg-gray-100/60 rounded" style={{ left: gasBar.left, width: gasBar.width }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Min</label>
                  <input type="range" min={GAS_MIN_DOMAIN} max={GAS_MAX_DOMAIN} className="w-full" {...register('gasMin', { required: true, min: GAS_MIN_DOMAIN })} />
                  <input type="number" className="input-field mt-2" {...register('gasMin', { required: true, min: GAS_MIN_DOMAIN })} />
                  {errors.gasMin && <p className="mt-2 text-sm text-danger-700 dark:text-danger-400">Valeur invalide.</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Max</label>
                  <input type="range" min={GAS_MIN_DOMAIN} max={GAS_MAX_DOMAIN} className="w-full" {...register('gasMax', { required: true, min: GAS_MIN_DOMAIN })} />
                  <input type="number" className="input-field mt-2" {...register('gasMax', { required: true, min: GAS_MIN_DOMAIN })} />
                  {(errors.gasMax || (gasMax !== undefined && gasMin !== undefined && gasMax <= gasMin)) && (
                    <p className="mt-2 text-sm text-danger-700 dark:text-danger-400">Doit être supérieur au min.</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Plage sélectionnée: <span className="font-medium">{gasMin ?? '-'}–{gasMax ?? '-'} ppm</span></p>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-purple-500/20 dark:from-blue-400/10 dark:via-teal-400/10 dark:to-purple-400/10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12z"/></svg></span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Humidité (%)</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative h-2 rounded bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-500">
                <div className="absolute top-0 h-2 bg-white/70 dark:bg-gray-100/60 rounded" style={{ left: humBar.left, width: humBar.width }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Min</label>
                  <input type="range" min={HUM_MIN_DOMAIN} max={HUM_MAX_DOMAIN} className="w-full" {...register('humidityMin', { required: true, min: HUM_MIN_DOMAIN, max: HUM_MAX_DOMAIN })} />
                  <input type="number" className="input-field mt-2" {...register('humidityMin', { required: true, min: HUM_MIN_DOMAIN, max: HUM_MAX_DOMAIN })} />
                  {errors.humidityMin && <p className="mt-2 text-sm text-danger-700 dark:text-danger-400">Valeur invalide.</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Max</label>
                  <input type="range" min={HUM_MIN_DOMAIN} max={HUM_MAX_DOMAIN} className="w-full" {...register('humidityMax', { required: true, min: HUM_MIN_DOMAIN, max: HUM_MAX_DOMAIN })} />
                  <input type="number" className="input-field mt-2" {...register('humidityMax', { required: true, min: HUM_MIN_DOMAIN, max: HUM_MAX_DOMAIN })} />
                  {(errors.humidityMax || (humidityMax !== undefined && humidityMin !== undefined && humidityMax <= humidityMin)) && (
                    <p className="mt-2 text-sm text-danger-700 dark:text-danger-400">Doit être supérieur au min.</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Plage sélectionnée: <span className="font-medium">{humidityMin ?? '-'}–{humidityMax ?? '-'} %</span></p>
            </div>
          </div>

          {/* Temperature Card */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20 dark:from-orange-400/10 dark:via-amber-400/10 dark:to-rose-400/10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z"/></svg></span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Température (°C)</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative h-2 rounded bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500">
                <div className="absolute top-0 h-2 bg-white/70 dark:bg-gray-100/60 rounded" style={{ left: tempBar.left, width: tempBar.width }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Min</label>
                  <input type="range" min={TEMP_MIN_DOMAIN} max={TEMP_MAX_DOMAIN} className="w-full" {...register('temperatureMin', { required: true })} />
                  <input type="number" className="input-field mt-2" {...register('temperatureMin', { required: true })} />
                  {errors.temperatureMin && <p className="mt-2 text-sm text-danger-700 dark:text-danger-400">Valeur invalide.</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Max</label>
                  <input type="range" min={TEMP_MIN_DOMAIN} max={TEMP_MAX_DOMAIN} className="w-full" {...register('temperatureMax', { required: true })} />
                  <input type="number" className="input-field mt-2" {...register('temperatureMax', { required: true })} />
                  {(errors.temperatureMax || (temperatureMax !== undefined && temperatureMin !== undefined && temperatureMax <= temperatureMin)) && (
                    <p className="mt-2 text-sm text-danger-700 dark:text-danger-400">Doit être supérieur au min.</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Plage sélectionnée: <span className="font-medium">{temperatureMin ?? '-'}–{temperatureMax ?? '-'} °C</span></p>
            </div>
          </div>
        </div>

        {/* Live summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 rounded border border-gray-200 dark:border-gray-700">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-800 dark:text-gray-200">Gaz: <strong>{gasMin ?? '-'}–{gasMax ?? '-'} ppm</strong></span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded border border-gray-200 dark:border-gray-700">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-800 dark:text-gray-200">Humidité: <strong>{humidityMin ?? '-'}–{humidityMax ?? '-'} %</strong></span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded border border-gray-200 dark:border-gray-700">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-800 dark:text-gray-200">Température: <strong>{temperatureMin ?? '-'}–{temperatureMax ?? '-'} °C</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les seuils'}
          </button>
          <button type="button" className="btn-secondary" onClick={resetDefaults}>Réinitialiser</button>
        </div>
      </form>
    </div>
  );
};

export default Thresholds;