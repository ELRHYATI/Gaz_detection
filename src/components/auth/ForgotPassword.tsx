import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  const { t } = useI18n();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? t('auth.login.error', 'An error occurred');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 overflow-hidden no-scrollbar flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 px-4">
        <div className="max-w-lg w-full">
          <div className="rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white/10 border border-white/15 backdrop-blur-xl max-h-[calc(100vh-2rem)] overflow-hidden">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg">
                <FiCheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-white">{t('auth.forgot.successTitle', 'Email sent!')}</h2>
              <p className="mt-2 text-base text-indigo-200">{t('auth.forgot.successBody', 'Check your inbox for reset instructions.')}</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="text-green-300 flex-shrink-0" />
                <div className="text-green-300 text-sm">
                  <p className="font-medium">{t('auth.forgot.instructionsSent', 'Instructions sent')}</p>
                  <p className="mt-1">{t('auth.forgot.instructionsDetail', 'We’ve emailed password reset instructions to your address.')}</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <Link to="/login" className="w-64 sm:w-72 mx-auto btn-primary inline-flex justify-center items-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-2xl shadow-xl hover:from-indigo-600 hover:to-violet-600">
                <FiArrowLeft className="h-4 w-4" />
                <span>{t('common.backToLogin', 'Back to login')}</span>
              </Link>
              <p className="text-sm text-indigo-300">
                {t('auth.forgot.tryAgainLabel', "Didn't get the email?")}{' '}
                <button onClick={() => setSuccess(false)} className="font-medium text-indigo-200 hover:text-white">
                  {t('auth.forgot.tryAgain', 'Try again')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden no-scrollbar flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 px-4">
      <div className="max-w-lg w-full">
        <div className="rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white/10 border border-white/15 backdrop-blur-xl max-h-[calc(100vh-2rem)] overflow-hidden">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
              <FiMail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white">{t('auth.forgot.title', 'Reset your password')}</h2>
            <p className="mt-2 text-base text-indigo-200">{t('auth.forgot.subtitle', 'Enter your email to receive a reset link.')}</p>
          </div>

          <form className="mt-2 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-center flex items-center justify-center space-x-2">
                <FiAlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4 flex flex-col items-center justify-center min-h-[220px]">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2 text-center">
                  {t('auth.forgot.email', 'Email address')}
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
                  <span>Sending...</span>
                </>
              ) : (
                <span>{t('auth.forgot.send', 'Send reset link')}</span>
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-indigo-300 hover:text-indigo-200 font-medium inline-flex items-center space-x-2 justify-center">
                <FiArrowLeft className="h-4 w-4" />
                <span>{t('common.backToLogin', 'Back to login')}</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;