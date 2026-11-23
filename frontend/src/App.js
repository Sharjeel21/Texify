// frontend/src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppUI from './components/AppUI';

// Lazy-loaded route components for high performance code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const QualityManagement = lazy(() => import('./pages/QualityManagement'));
const PartyManagement = lazy(() => import('./pages/PartyManagement'));
const DealManagement = lazy(() => import('./pages/DealManagement'));
const DeliveryChallan = lazy(() => import('./pages/DeliveryChallan'));
const AddBales = lazy(() => import('./pages/AddBales'));
const TaxInvoice = lazy(() => import('./pages/TaxInvoice'));
const ViewChallans = lazy(() => import('./pages/ViewChallans'));
const ViewInvoices = lazy(() => import('./pages/ViewInvoices'));
const CompanySettings = lazy(() => import('./pages/CompanySettings'));
const PurchaseManagement = lazy(() => import('./pages/PurchaseManagement'));
const PurchaseDeliveries = lazy(() => import('./pages/PurchaseDeliveries'));

// Lightweight page loading indicator
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <div className="spinner"></div>
  </div>
);

// ==========================================
// Wrapper that injects user + logout into AppUI
// ==========================================
function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppUI user={user} logout={handleLogout}>
      {children}
    </AppUI>
  );
}

// ==========================================
// Root redirect
// ==========================================
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

// ==========================================
// App
// ==========================================
function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
            } />

            <Route path="/qualities" element={
              <ProtectedRoute><AppLayout><QualityManagement /></AppLayout></ProtectedRoute>
            } />

            <Route path="/parties" element={
              <ProtectedRoute><AppLayout><PartyManagement /></AppLayout></ProtectedRoute>
            } />

            <Route path="/deals" element={
              <ProtectedRoute><AppLayout><DealManagement /></AppLayout></ProtectedRoute>
            } />

            <Route path="/delivery-challan" element={
              <ProtectedRoute><AppLayout><DeliveryChallan /></AppLayout></ProtectedRoute>
            } />

            <Route path="/delivery-challan/add-bales/:id" element={
              <ProtectedRoute><AppLayout><AddBales /></AppLayout></ProtectedRoute>
            } />

            <Route path="/tax-invoice" element={
              <ProtectedRoute><AppLayout><TaxInvoice /></AppLayout></ProtectedRoute>
            } />

            <Route path="/view-challans" element={
              <ProtectedRoute><AppLayout><ViewChallans /></AppLayout></ProtectedRoute>
            } />

            <Route path="/view-invoices" element={
              <ProtectedRoute><AppLayout><ViewInvoices /></AppLayout></ProtectedRoute>
            } />

            <Route path="/company-settings" element={
              <ProtectedRoute><AppLayout><CompanySettings /></AppLayout></ProtectedRoute>
            } />

            <Route path="/purchases" element={
              <ProtectedRoute><AppLayout><PurchaseManagement /></AppLayout></ProtectedRoute>
            } />

            <Route path="/purchase-deliveries" element={
              <ProtectedRoute><AppLayout><PurchaseDeliveries /></AppLayout></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;