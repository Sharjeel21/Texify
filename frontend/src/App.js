// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppUI from './components/AppUI';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QualityManagement from './pages/QualityManagement';
import PartyManagement from './pages/PartyManagement';
import DealManagement from './pages/DealManagement';
import DeliveryChallan from './pages/DeliveryChallan';
import AddBales from './pages/AddBales';
import TaxInvoice from './pages/TaxInvoice';
import ViewChallans from './pages/ViewChallans';
import ViewInvoices from './pages/ViewInvoices';
import CompanySettings from './pages/CompanySettings';
import PurchaseManagement from './pages/PurchaseManagement';
import PurchaseDeliveries from './pages/PurchaseDeliveries';

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
      </Router>
    </AuthProvider>
  );
}

export default App;