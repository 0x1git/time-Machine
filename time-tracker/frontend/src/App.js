import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import Projects from './components/projects/Projects';
import Tasks from './components/tasks/Tasks';
import TimerPage from './components/timer/TimerPage';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import Teams from './components/teams/Teams';
import AcceptInvitation from './components/teams/AcceptInvitation';
import Kiosk from './components/kiosk/Kiosk';
import Layout from './components/layout/Layout';
import GlobalStyles from './styles/GlobalStyles';

// Protected Route Component
const ProtectedRouteWrapper = ({ children }) => {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
};

function App() {  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <GlobalStyles />
          <Router>
          <div className="App">
            <Routes>              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
              <Route path="/kiosk" element={<Kiosk />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRouteWrapper>
                  <Dashboard />
                </ProtectedRouteWrapper>
              } />
        <Route path="/timer" element={
                <ProtectedRouteWrapper>
          <TimerPage />
                </ProtectedRouteWrapper>
              } />
              <Route path="/projects" element={
                <ProtectedRouteWrapper>
                  <Projects />
                </ProtectedRouteWrapper>
              } />
              <Route path="/tasks" element={
                <ProtectedRouteWrapper>
                  <Tasks />
                </ProtectedRouteWrapper>
              } />              <Route path="/reports" element={
                <ProtectedRouteWrapper>
                  <Reports />
                </ProtectedRouteWrapper>
              } />
              <Route path="/teams" element={
                <ProtectedRouteWrapper>
                  <Teams />
                </ProtectedRouteWrapper>
              } />
              <Route path="/settings" element={
                <ProtectedRouteWrapper>
                  <Settings />
                </ProtectedRouteWrapper>
              } />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />          </div>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;