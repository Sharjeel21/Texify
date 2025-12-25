import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import AppUI wrapper
import AppUI from './components/AppUI';

// Import pages
import Dashboard from './pages/Dashboard';
import QualityManagement from './pages/QualityManagement';
import PartyManagement from './pages/PartyManagement';
import DealManagement from './pages/DealManagement'; // ✅ NEW
import DeliveryChallan from './pages/DeliveryChallan';
import AddBales from './pages/AddBales';
import TaxInvoice from './pages/TaxInvoice';
import ViewChallans from './pages/ViewChallans';
import ViewInvoices from './pages/ViewInvoices';
import CompanySettings from './pages/CompanySettings';
import PurchaseManagement from './pages/PurchaseManagement';
import PurchaseDeliveries from './pages/PurchaseDeliveries';

function App() {
  return (
    <Router>
      {/* Wrap everything inside AppUI */}
      <AppUI>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/qualities" element={<QualityManagement />} />
          <Route path="/parties" element={<PartyManagement />} />
          <Route path="/deals" element={<DealManagement />} /> {/* ✅ NEW */}
          <Route path="/delivery-challan" element={<DeliveryChallan />} />
          <Route path="/delivery-challan/add-bales/:id" element={<AddBales />} />
          <Route path="/tax-invoice" element={<TaxInvoice />} />
          <Route path="/view-challans" element={<ViewChallans />} />
          <Route path="/view-invoices" element={<ViewInvoices />} />
          <Route path="/company-settings" element={<CompanySettings />} />
          <Route path="/purchases" element={<PurchaseManagement />} />
          <Route path="/purchase-deliveries" element={<PurchaseDeliveries />} />
        </Routes>
      </AppUI>
    </Router>
  );
}

export default App;