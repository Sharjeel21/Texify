// ==========================================
// AppUI.js - Refactored with better organization
// ==========================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AppUI.css';

// Navigation Configuration - Single source of truth
const NAVIGATION_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊', shortLabel: 'Dashboard' },
  { path: '/qualities', label: 'Qualities', icon: '⭐', shortLabel: 'Qualities' },
  { path: '/parties', label: 'Parties', icon: '🤝', shortLabel: 'Parties' },
  { path: '/deals', label: 'Deals', icon: '💼', shortLabel: 'Deals' },
  { path: '/delivery-challan', label: 'Delivery Challan', icon: '📄', shortLabel: 'Challan' },
  { path: '/tax-invoice', label: 'Tax Invoice', icon: '🧾', shortLabel: 'Invoice' },
  { path: '/purchases', label: 'Purchases', icon: '🛒', shortLabel: 'Purchases' },
  { path: '/purchase-deliveries', label: 'Deliveries & Payments', icon: '📦', shortLabel: 'Deliveries' },
  { path: '/view-challans', label: 'View Challans', icon: '📑', shortLabel: 'View Challans' },
  { path: '/view-invoices', label: 'View Invoices', icon: '📘', shortLabel: 'View Invoices' },
  { path: '/company-settings', label: 'Company Settings', icon: '⚙️', shortLabel: 'Settings' }
];

function AppUI({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Event Handlers
  const handleToggleSidebar = () => setSidebarOpen(prev => !prev);
  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <div className="appUI">
      <Header onToggleSidebar={handleToggleSidebar} />
      
      <div className="appUI__layout">
        <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
        <MainContent>{children}</MainContent>
      </div>
      
      {sidebarOpen && <SidebarOverlay onClick={handleCloseSidebar} />}
    </div>
  );
}

// ==========================================
// Header Component
// ==========================================
function Header({ onToggleSidebar }) {
  return (
    <header className="appUI__header">
      <div className="appUI__header-container">
        <MenuToggleButton onClick={onToggleSidebar} />
        <Logo />
        <DesktopNavigation />
        <UserProfile />
      </div>
    </header>
  );
}

// ==========================================
// Header Sub-components
// ==========================================
function MenuToggleButton({ onClick }) {
  return (
    <button className="appUI__menu-toggle" onClick={onClick} aria-label="Toggle menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}

function Logo() {
  return (
    <div className="appUI__logo">
      <h1>Texify</h1>
    </div>
  );
}

function DesktopNavigation() {
  return (
    <nav className="appUI__nav">
      {NAVIGATION_ITEMS.map(item => (
        <Link 
          key={item.path} 
          to={item.path} 
          className="appUI__nav-link"
        >
          {item.shortLabel}
        </Link>
      ))}
    </nav>
  );
}

function UserProfile() {
  return (
    <div className="appUI__user">
      <span className="appUI__user-icon">👤</span>
    </div>
  );
}

// ==========================================
// Sidebar Component
// ==========================================
function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`appUI__sidebar ${isOpen ? 'appUI__sidebar--open' : ''}`}>
      <div className="appUI__sidebar-content">
        <h3 className="appUI__sidebar-title">Navigation</h3>
        <SidebarNavigation onLinkClick={onClose} />
      </div>
    </aside>
  );
}

function SidebarNavigation({ onLinkClick }) {
  return (
    <nav className="appUI__sidebar-nav">
      {NAVIGATION_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className="appUI__sidebar-link"
          onClick={onLinkClick}
        >
          <span className="appUI__sidebar-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// ==========================================
// Main Content Component
// ==========================================
function MainContent({ children }) {
  return (
    <main className="appUI__main">
      {children}
    </main>
  );
}

// ==========================================
// Sidebar Overlay Component
// ==========================================
function SidebarOverlay({ onClick }) {
  return (
    <div 
      className="appUI__sidebar-overlay" 
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

export default AppUI;