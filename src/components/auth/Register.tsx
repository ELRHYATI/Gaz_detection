import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiAlertCircle, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { database } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  
  const { register: registerUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError(t('validation.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await registerUser(data.email, data.password, data.name);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? t('auth.register.error', 'An error occurred. Please try again');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-danger-500' };
    if (strength <= 4) return { strength, label: 'Medium', color: 'bg-warning-500' };
    return { strength, label: 'Strong', color: 'bg-success-500' };
  };

  const passwordStrength = getPasswordStrength(password || '');

  useEffect(() => {
    const connRef = ref(database, '.info/connected');
    onValue(connRef, (snap) => {
      setDbConnected(!!snap.val());
    });
    return () => off(connRef);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden no-scrollbar flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 px-4">
      <div className="max-w-lg w-full">
        <div className="rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white/10 border border-white/15 backdrop-blur-xl max-h-[calc(100vh-2rem)] overflow-hidden">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-4xl font-extrabold text-white">{t('auth.register.title', 'Create an account')}</h2>
            <p className="mt-2 text-base text-indigo-200">{t('auth.register.subtitle', 'Join the gas detection system')}</p>
            <p className="mt-1 text-xs text-indigo-200">
              {t('db.status.label', 'Realtime Database:')} {dbConnected === null ? t('db.status.checking', 'Checking...') : dbConnected ? t('db.status.connected', 'Connected') : t('db.status.disconnected', 'Disconnected')}
            </p>
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
                <label htmlFor="name" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  {t('auth.register.name', 'Full name')}
                </label>
                <div className="relative w-64 sm:w-72 mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 text-indigo-200" />
                  </div>
                  <input
                    {...register('name', {
                      required: t('validation.nameRequired', 'Name is required'),
                      minLength: { value: 2, message: t('validation.nameMin', 'Name must be at least 2 characters') }
                    })}
                    type="text"
                    className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.name ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                    placeholder={t('auth.register.namePlaceholder', 'e.g. Jane Doe')}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-300 text-center">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  {t('auth.register.email', 'Email address')}
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
                  {t('auth.register.password', 'Password')}
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
                  type={'password'}
                  className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.password ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                  placeholder="••••••••"
                />
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white/20 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label === 'Weak' ? t('password.strength.weak', 'Weak') : passwordStrength.label === 'Medium' ? t('password.strength.medium', 'Medium') : t('password.strength.strong', 'Strong')}
                      </span>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300 text-center">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  {t('auth.register.confirm', 'Confirm password')}
                </label>
                <div className="relative w-64 sm:w-72 mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-indigo-200" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: t('validation.confirmRequired', 'Please confirm your password'),
                      validate: (value) => value === password || t('validation.passwordMismatch', 'Passwords do not match')
                    })}
                  type={'password'}
                  className={`input-field w-full pl-8 pr-3 py-2 text-sm bg-white/10 border-white/20 placeholder:text-indigo-200 text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-xl ${errors.confirmPassword ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                  placeholder="••••••••"
                />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-300 text-center">{errors.confirmPassword.message}</p>
                )}
              </div>
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
                  <span>{t('auth.register.creating', 'Creating account...')}</span>
                </>
              ) : (
                <span>{t('auth.register.submit', 'Create account')}</span>
              )}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('common.alreadyHave', 'Already have an account?')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('auth.login.submit', 'Sign in')}
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;