import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { lazyWithRetry } from './utils/lazyWithRetry';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const MotorControl = lazy(() => import('./pages/MotorControl'));
const Thresholds = lazy(() => import('./pages/Thresholds'));
const Settings = lazy(() => import('./pages/Settings'));
const SettingsSemantic = lazy(() => import('./pages/SettingsSemantic'));
const History = lazy(() => import('./pages/History'));
const Notifications = lazy(() => import('./pages/Notifications'));
const SystemData = lazy(() => import('./pages/SystemData'));
const StyleGuide = lazy(() => import('./pages/StyleGuide'));
import { I18nProvider } from './contexts/I18nContext';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <I18nProvider messages={{ en, fr }}>
      <Router>
        <div className="min-h-screen gas-bg">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading…</div>}><Login /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading…</div>}><Register /></Suspense>} />
            <Route path="/forgot-password" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading…</div>}><ForgotPassword /></Suspense>} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ErrorBoundary fallback={<div className='p-6 text-center text-red-700 dark:text-red-300'>Failed to load dashboard. Please reload.</div>}><Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading dashboard…</div>}><Dashboard /></Suspense></ErrorBoundary>} />
              <Route path="motor-control" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading motor control…</div>}><MotorControl /></Suspense>} />
              <Route path="thresholds" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading thresholds…</div>}><Thresholds /></Suspense>} />
              <Route path="history" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading history…</div>}><History /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading settings…</div>}><Settings /></Suspense>} />
              <Route path="settings-semantic" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading settings…</div>}><SettingsSemantic /></Suspense>} />
              <Route path="notifications" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading notifications…</div>}><Notifications /></Suspense>} />
              <Route path="system-data" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading system data…</div>}><SystemData /></Suspense>} />
              <Route path="style-guide" element={<Suspense fallback={<div className='p-6 text-center text-gray-600 dark:text-gray-300'>Loading…</div>}><StyleGuide /></Suspense>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App;
