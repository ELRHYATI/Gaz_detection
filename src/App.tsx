import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import GasLevels from './pages/GasLevels';
import Temperature from './pages/Temperature';
import Humidity from './pages/Humidity';
import MotorControl from './pages/MotorControl';
import Thresholds from './pages/Thresholds';
import Settings from './pages/Settings';
import History from './pages/History';
import Notifications from './pages/Notifications';
import { I18nProvider } from './contexts/I18nContext';
import en from './locales/en.json';
import fr from './locales/fr.json';

function App() {
  return (
    <AuthProvider>
      <I18nProvider messages={{ en, fr }}>
      <Router>
        <div className="min-h-screen gas-bg">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="gas-levels" element={<GasLevels />} />
              <Route path="temperature" element={<Temperature />} />
              <Route path="humidity" element={<Humidity />} />
              <Route path="motor-control" element={<MotorControl />} />
              <Route path="thresholds" element={<Thresholds />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
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
