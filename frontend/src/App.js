//frontend/src/app.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Components
import ProtectedRoute from './components/ProtectedRoute';
import AppUI from './components/AppUI';

// Import Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Import App Pages
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

// Component to handle root redirect
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Protected Routes - Wrapped in AppUI */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppUI><Dashboard /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/qualities" element={
            <ProtectedRoute>
              <AppUI><QualityManagement /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/parties" element={
            <ProtectedRoute>
              <AppUI><PartyManagement /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/deals" element={
            <ProtectedRoute>
              <AppUI><DealManagement /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/delivery-challan" element={
            <ProtectedRoute>
              <AppUI><DeliveryChallan /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/delivery-challan/add-bales/:id" element={
            <ProtectedRoute>
              <AppUI><AddBales /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/tax-invoice" element={
            <ProtectedRoute>
              <AppUI><TaxInvoice /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/view-challans" element={
            <ProtectedRoute>
              <AppUI><ViewChallans /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/view-invoices" element={
            <ProtectedRoute>
              <AppUI><ViewInvoices /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/company-settings" element={
            <ProtectedRoute>
              <AppUI><CompanySettings /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/purchases" element={
            <ProtectedRoute>
              <AppUI><PurchaseManagement /></AppUI>
            </ProtectedRoute>
          } />
          
          <Route path="/purchase-deliveries" element={
            <ProtectedRoute>
              <AppUI><PurchaseDeliveries /></AppUI>
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;