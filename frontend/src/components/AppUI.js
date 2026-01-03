// ==========================================
// AppUI.js - Enterprise-Level Navigation
// ==========================================

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppUI.css';

// ==========================================
// NAVIGATION CONFIGURATION WITH GROUPING
// ==========================================
const NAVIGATION_GROUPS = [
  {
    title: 'Overview',
    items: [
      { 
        path: '/dashboard', 
        label: 'Dashboard', 
        icon: '📊', 
        description: 'Main overview'
      }
    ]
  },
  {
    title: 'Master Data',
    items: [
      { 
        path: '/qualities', 
        label: 'Quality Management', 
        icon: '⭐', 
        description: 'Manage yarn qualities'
      },
      { 
        path: '/parties', 
        label: 'Party Management', 
        icon: '🤝', 
        description: 'Manage customers & suppliers'
      },
      { 
        path: '/company-settings', 
        label: 'Company Settings', 
        icon: '⚙️', 
        description: 'Configure company details'
      }
    ]
  },
  {
    title: 'Sales Operations',
    items: [
      { 
        path: '/deals', 
        label: 'Deal Management', 
        icon: '💼', 
        description: 'Manage sales deals'
      },
      { 
        path: '/delivery-challan', 
        label: 'Delivery Challan', 
        icon: '📄', 
        description: 'Create delivery challans'
      },
      { 
        path: '/tax-invoice', 
        label: 'Tax Invoice', 
        icon: '🧾', 
        description: 'Generate tax invoices'
      }
    ]
  },
  {
    title: 'Purchase Operations',
    items: [
      { 
        path: '/purchases', 
        label: 'Purchase Management', 
        icon: '🛒', 
        description: 'Manage yarn purchases'
      },
      { 
        path: '/purchase-deliveries', 
        label: 'Deliveries & Payments', 
        icon: '📦', 
        description: 'Track deliveries & payments'
      }
    ]
  },
  {
    title: 'Reports',
    items: [
      { 
        path: '/view-challans', 
        label: 'View Challans', 
        icon: '📑', 
        description: 'Browse all challans'
      },
      { 
        path: '/view-invoices', 
        label: 'View Invoices', 
        icon: '📘', 
        description: 'Browse all invoices'
      }
    ]
  }
];

// Quick access items for header (most used features)
const QUICK_ACCESS_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/deals', label: 'Deals' },
  { path: '/delivery-challan', label: 'Challan' },
  { path: '/purchases', label: 'Purchases' }
];

// ==========================================
// MAIN APP UI COMPONENT
// ==========================================
function AppUI({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleToggleSidebar = () => setSidebarOpen(prev => !prev);
  const handleCloseSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="appUI">
      <Header 
        onToggleSidebar={handleToggleSidebar} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <div className="appUI__layout">
        <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
        <MainContent>{children}</MainContent>
      </div>
      
      {sidebarOpen && <SidebarOverlay onClick={handleCloseSidebar} />}
    </div>
  );
}

// ==========================================
// HEADER COMPONENT
// ==========================================
function Header({ onToggleSidebar, user, onLogout }) {
  return (
    <header className="appUI__header">
      <div className="appUI__header-container">
        <MenuToggleButton onClick={onToggleSidebar} />
        <Logo />
        <QuickAccessNavigation />
        <UserProfile user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}

// ==========================================
// HEADER SUB-COMPONENTS
// ==========================================
function MenuToggleButton({ onClick }) {
  return (
    <button 
      className="appUI__menu-toggle" 
      onClick={onClick} 
      aria-label="Toggle navigation menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}

function Logo() {
  return (
    <Link to="/dashboard" className="appUI__logo">
      <h1>Texify</h1>
    </Link>
  );
}

function QuickAccessNavigation() {
  const location = useLocation();

  return (
    <nav className="appUI__nav">
      {QUICK_ACCESS_ITEMS.map(item => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`appUI__nav-link ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function UserProfile({ user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleNavigateSettings = () => {
    setShowMenu(false);
    navigate('/company-settings');
  };

  return (
    <div className="dropdown">
      <div 
        className="appUI__user" 
        onClick={() => setShowMenu(!showMenu)}
      >
        <span className="appUI__user-icon">
          {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
        </span>
        <span className="appUI__user-name">
          {user?.name?.split(' ')[0]}
        </span>
        <span className="appUI__user-dropdown">▼</span>
      </div>

      {showMenu && (
        <>
          <div className="dropdown-menu" style={{ display: 'block' }}>
            <div style={{ 
              padding: '1rem', 
              borderBottom: '1px solid var(--border-color)' 
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                {user?.name}
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
              }}>
                {user?.email}
              </div>
              {user?.role && (
                <span className="badge badge-primary">
                  {user.role.toUpperCase()}
                </span>
              )}
            </div>
            
            <button 
              className="dropdown-item" 
              onClick={handleNavigateSettings}
            >
              ⚙️ Company Settings
            </button>
            
            <div className="dropdown-divider"></div>
            
            <button 
              className="dropdown-item" 
              onClick={onLogout}
              style={{ color: '#dc2626' }}
            >
              🚪 Logout
            </button>
          </div>
          
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              zIndex: 998 
            }} 
            onClick={() => setShowMenu(false)}
          />
        </>
      )}
    </div>
  );
}

// ==========================================
// SIDEBAR COMPONENT
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
  const location = useLocation();

  return (
    <div>
      {NAVIGATION_GROUPS.map((group, index) => (
        <div key={index} className="appUI__nav-group">
          <h4 className="appUI__nav-group-title">{group.title}</h4>
          <nav className="appUI__sidebar-nav">
            {group.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`appUI__sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={onLinkClick}
                title={item.description}
              >
                <span className="appUI__sidebar-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// MAIN CONTENT COMPONENT
// ==========================================
function MainContent({ children }) {
  return (
    <main className="appUI__main">
      {children}
    </main>
  );
}

// ==========================================
// SIDEBAR OVERLAY COMPONENT
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