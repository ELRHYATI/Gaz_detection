import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { createSafeStorage, safeJSONStringify } from '../../utils/storage';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');
  const { login, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };

  const prefersReduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({ defaultValues: { remember: true } });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      await login(data.email, data.password, data.remember);
      // Set flash toast payload for next page
      try {
        const storage = createSafeStorage('local', 'app:');
        storage.set('flash_login_success', safeJSONStringify({ type: 'success', message: 'Login successful', ts: Date.now() }));
      } catch { /* ignore storage errors */ }
      const target = location.state?.from?.pathname || '/dashboard';
      // Play success transition before redirect
      const durationMs = prefersReduced ? 0 : 1000; // 800–1200ms range
      setIsAnimating(true);
      if (durationMs <= 0) {
        navigate(target, { replace: true });
      } else {
        window.setTimeout(() => navigate(target, { replace: true }), durationMs);
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Invalid credentials';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden no-scrollbar flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 px-4">
      <div className="max-w-lg w-full">
        <div className={`rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white/10 border border-white/15 backdrop-blur-xl max-h-[calc(100vh-2rem)] overflow-hidden transition-all ${isAnimating ? 'opacity-0 translate-y-2 scale-95 duration-500' : 'opacity-100 duration-300'}`}
             aria-busy={isLoading}
        >
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
              <img src="/gas.svg" alt="Logo" className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-extrabold text-white">Sign in</h2>
            <p className="mt-2 text-base text-indigo-200">Use your email and password</p>
          </div>

          <form className="mt-4 space-y-6 flex flex-col items-center" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="w-64 sm:w-72 mx-auto bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded-lg p-4 flex items-center justify-center space-x-2" role="alert">
                <FiAlertCircle className="text-danger-600 dark:text-danger-400 flex-shrink-0" />
                <span className="text-danger-700 dark:text-danger-100 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4 flex flex-col items-center">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  Email
                </label>
                <div className="relative w-64 sm:w-72 mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-indigo-200" />
                  </div>
                   <input
                     {...register('email', {
                       required: 'Email is required',
                       pattern: {
                         value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                         message: 'Enter a valid email address',
                       },
                     })}
                     type="email"
                     className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.email ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                     placeholder="you@example.com"
                   />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300 text-center">{String(errors.email.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  Password
                </label>
                <div className="relative w-64 sm:w-72 mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-indigo-200" />
                  </div>
                   <input
                     {...register('password', {
                       required: 'Password is required',
                       minLength: { value: 6, message: 'Use at least 6 characters' },
                     })}
                     type="password"
                     className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.password ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                     placeholder="••••••••"
                   />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300 text-center">{String(errors.password.message)}</p>
                )}
              </div>

              <label className="inline-flex items-center space-x-2 text-indigo-200">
                <input
                  type="checkbox"
                  className="rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-400"
                  {...register('remember')}
                />
                <span className="text-sm">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-64 sm:w-72 mx-auto btn-primary flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-2xl shadow-xl hover:from-indigo-600 hover:to-violet-600"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

            {currentUser ? (
              <div className="w-64 sm:w-72 mx-auto bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 flex items-center justify-center space-x-2" role="status">
                <FiCheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-100 text-sm">Logged in as {currentUser.email || currentUser.displayName || 'User'}</span>
                <button onClick={() => logout()} className="ml-4 text-xs text-indigo-700 dark:text-indigo-300 underline">Logout</button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
      {/* Success transition overlay */}
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center pointer-events-none transition-opacity ${prefersReduced ? 'duration-0' : 'duration-1000'} ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className={`relative flex flex-col items-center justify-center ${prefersReduced ? '' : 'animate-none'}`}>
          <div className={`h-20 w-20 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-lg transition-transform ${isAnimating ? 'scale-100' : 'scale-75'} ${prefersReduced ? 'duration-0' : 'duration-700'}`}>
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-white">
              <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mt-4 text-white text-sm">Welcome back</div>
        </div>
      </div>
    </div>
  );
};

export default Login;