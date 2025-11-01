import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState<boolean>(localStorage.getItem('rememberMe') === 'true');
  const storedEmail = localStorage.getItem('rememberedEmail') || '';
  
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({ defaultValues: { email: storedEmail } });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(data.email, data.password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.setItem('rememberMe', 'false');
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? t('auth.login.error', 'An error occurred');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden no-scrollbar flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 px-4">
      <div className="max-w-lg w-full">
        <div className="rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white/10 border border-white/15 backdrop-blur-xl max-h-[calc(100vh-2rem)] overflow-hidden">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
              <img src="/gas.svg" alt="Gaz" className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-extrabold text-white">{t('app.title', 'Gas Detection')}</h2>
            <p className="mt-2 text-base text-indigo-200">{t('app.subtitle', 'Smart safety system')}</p>
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
                  {t('auth.login.email', 'Email address')}
                </label>
                <div className="relative w-64 sm:w-72 mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-indigo-200" />
                  </div>
                   <input
                     {...register('email', {
                       required: t('validation.emailRequired', 'Email address is required'),
                       pattern: {
                         value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                         message: t('validation.emailInvalid', 'Invalid email address')
                       }
                     })}
                     type="email"
                     className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.email ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                     placeholder={t('common.emailPlaceholder', 'you@example.com')}
                   />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300 text-center">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  {t('auth.login.password', 'Password')}
                </label>
                <div className="relative w-64 sm:w-72 mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-indigo-200" />
                  </div>
                   <input
                     {...register('password', {
                       required: t('validation.passwordRequired', 'Password is required'),
                       minLength: {
                         value: 6,
                         message: t('validation.passwordMin', 'Password must be at least 6 characters')
                       }
                     })}
                     type="password"
                     className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.password ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                     placeholder="••••••••"
                   />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300 text-center">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-64 sm:w-72 mx-auto">
              <label className="flex items-center space-x-2 select-none">
                <input
                  type="checkbox"
                  className="rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-indigo-400"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-sm text-indigo-200">{t('auth.login.remember', 'Remember me')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-300 hover:text-indigo-200 font-medium"
              >
                {t('auth.login.forgot', 'Forgot password?')}
              </Link>
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
                  <span>{t('auth.login.signing', 'Signing in...')}</span>
                </>
              ) : (
                <span>{t('auth.login.submit', 'Sign in')}</span>
              )}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('common.alreadyHave', 'Already have an account?')}{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('common.createAccountLink', 'Create an account')}
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;