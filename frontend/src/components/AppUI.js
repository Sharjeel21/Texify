// frontend/src/components/ResponsiveAppUI.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Package, FileText, ShoppingCart, Settings, Users, Briefcase, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

// ==========================================
// NAVIGATION CONFIGURATION
// ==========================================
const NAVIGATION_GROUPS = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home, description: 'Main overview' }
    ]
  },
  {
    title: 'Master Data',
    items: [
      { path: '/qualities', label: 'Quality Management', icon: TrendingUp, description: 'Manage yarn qualities' },
      { path: '/parties', label: 'Party Management', icon: Users, description: 'Manage customers & suppliers' },
      { path: '/company-settings', label: 'Company Settings', icon: Settings, description: 'Configure company details' }
    ]
  },
  {
    title: 'Sales Operations',
    items: [
      { path: '/deals', label: 'Deal Management', icon: Briefcase, description: 'Manage sales deals' },
      { path: '/delivery-challan', label: 'Delivery Challan', icon: FileText, description: 'Create delivery challans' },
      { path: '/tax-invoice', label: 'Tax Invoice', icon: FileText, description: 'Generate tax invoices' }
    ]
  },
  {
    title: 'Purchase Operations',
    items: [
      { path: '/purchases', label: 'Purchase Management', icon: ShoppingCart, description: 'Manage yarn purchases' },
      { path: '/purchase-deliveries', label: 'Deliveries & Payments', icon: Package, description: 'Track deliveries & payments' }
    ]
  },
  {
    title: 'Reports',
    items: [
      { path: '/view-challans', label: 'View Challans', icon: FileText, description: 'Browse all challans' },
      { path: '/view-invoices', label: 'View Invoices', icon: FileText, description: 'Browse all invoices' }
    ]
  }
];

// Quick access for mobile bottom nav
const BOTTOM_NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/deals', label: 'Deals', icon: Briefcase },
  { path: '/delivery-challan', label: 'Challan', icon: FileText },
  { path: '/purchases', label: 'Purchase', icon: ShoppingCart }
];

// ==========================================
// MOBILE DRAWER COMPONENT
// ==========================================
function MobileDrawer({ isOpen, onClose, user, onLogout }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] md:hidden top-[70px]"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-[70px] left-0 bottom-0 w-[280px] bg-gradient-to-b from-[#78350f] to-[#451a03] text-white transform transition-transform duration-300 ease-in-out z-[999] md:hidden overflow-y-auto",
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4">
          {/* User Info */}
          <div className="mb-6 p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || '👤'}
              </div>
              <div>
                <div className="font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-amber-200">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          {NAVIGATION_GROUPS.map((group, index) => (
            <div key={index} className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 px-2">
                {group.title}
              </h4>
              <nav className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                        isActive 
                          ? 'bg-gradient-to-r from-amber-400/20 to-orange-600/15 text-white font-bold border-l-3 border-amber-400' 
                          : 'text-amber-100 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Logout Button */}
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ==========================================
// MOBILE BOTTOM NAVIGATION
// ==========================================
function BottomNavigation() {
  const location = useLocation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-200 md:hidden z-[997] safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {BOTTOM_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? 'text-amber-600' : 'text-gray-600'
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? 'stroke-[2.5]' : 'stroke-2')} />
              <span className={cn("text-xs", isActive ? 'font-bold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// RESPONSIVE HEADER
// ==========================================
function ResponsiveHeader({ onMenuToggle, user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-gradient-to-r from-white to-amber-50 border-b-2 border-amber-200 z-[1000] shadow-md">
      <div className="h-full flex items-center justify-between px-4 md:px-6 max-w-full">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-amber-50 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-amber-700" />
        </button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
            Texify
          </h1>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center mx-4">
          {[
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/deals', label: 'Deals' },
            { path: '/delivery-challan', label: 'Challan' },
            { path: '/purchases', label: 'Purchases' }
          ].map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-5 py-2.5 text-sm font-semibold rounded-xl transition-all relative",
                  isActive 
                    ? 'text-amber-600 bg-amber-50' 
                    : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-amber-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 md:gap-3"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm hover:shadow-md transition-shadow">
              {user?.name?.charAt(0).toUpperCase() || '👤'}
            </div>
            <span className="hidden md:inline text-sm font-semibold text-gray-700">
              {user?.name?.split(' ')[0]}
            </span>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-[1000]" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border-2 border-amber-200 z-[1001] overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="font-bold text-gray-900">{user?.name}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{user?.email}</div>
                  {user?.role && (
                    <span className="inline-block mt-2 px-2 py-1 bg-amber-600 text-white text-xs font-semibold rounded">
                      {user.role.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/company-settings');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-center gap-2 text-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>Company Settings</span>
                </button>
                
                <div className="border-t border-gray-200" />
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600 font-semibold"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ==========================================
// DESKTOP SIDEBAR
// ==========================================
function DesktopSidebar({ user }) {
  const location = useLocation();

  return (
    <aside className="hidden md:block fixed top-[70px] left-0 bottom-0 w-[280px] bg-gradient-to-b from-[#78350f] to-[#451a03] text-white overflow-y-auto z-[999] shadow-lg">
      <div className="p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 px-2">
          Navigation
        </h3>
        
        {NAVIGATION_GROUPS.map((group, index) => (
          <div key={index} className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 px-2">
              {group.title}
            </h4>
            <nav className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden",
                      isActive 
                        ? 'bg-gradient-to-r from-amber-400/20 to-orange-600/15 text-white font-bold border-l-3 border-amber-400' 
                        : 'text-amber-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    )}
                    title={item.description}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ==========================================
// MAIN APP UI COMPONENT
// ==========================================
function ResponsiveAppUI({ children, user, logout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <ResponsiveHeader 
        onMenuToggle={() => setMobileMenuOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex mt-[70px] min-h-[calc(100vh-70px)]">
        {/* Desktop Sidebar */}
        <DesktopSidebar user={user} />
        
        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
        
        {/* Main Content */}
        <main className="flex-1 md:ml-[280px] p-4 md:p-6 pb-20 md:pb-6 bg-gradient-to-b from-transparent to-amber-50/30">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}

export default ResponsiveAppUI;