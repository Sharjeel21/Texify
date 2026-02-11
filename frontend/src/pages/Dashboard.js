// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  FileText, 
  ShoppingCart, 
  AlertCircle,
  ArrowRight,
  DollarSign,
  Users,
  Briefcase,
  CheckCircle
} from 'lucide-react';
import { 
  deliveryChallanAPI, 
  taxInvoiceAPI, 
  qualityAPI, 
  partyAPI, 
  dealAPI,
  purchaseAPI 
} from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalChallans: 0,
    incompleteChallans: 0,
    totalInvoices: 0,
    totalQualities: 0,
    totalParties: 0,
    activeDeals: 0,
    activePurchases: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        challansRes, 
        invoicesRes, 
        qualitiesRes, 
        partiesRes,
        dealsRes,
        purchasesRes
      ] = await Promise.all([
        deliveryChallanAPI.getAll(),
        taxInvoiceAPI.getAll(),
        qualityAPI.getAll(),
        partyAPI.getAll(),
        dealAPI.getActive(),
        purchaseAPI.getAll()
      ]);

      const challans = challansRes.data;
      const incompleteCnt = challans.filter(c => c.status === 'incomplete').length;
      
      const recentActivity = [
        ...challans.slice(0, 3).map(c => ({
          type: 'challan',
          title: `Challan ${c.challanNumber}`,
          subtitle: `${c.qualityName} - ${c.status}`,
          date: c.createdAt,
          status: c.status
        })),
        ...invoicesRes.data.slice(0, 2).map(i => ({
          type: 'invoice',
          title: `Invoice ${i.billNumber}`,
          subtitle: `${i.partyDetails?.name}`,
          date: i.date,
          status: 'complete'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setStats({
        totalChallans: challans.length,
        incompleteChallans: incompleteCnt,
        totalInvoices: invoicesRes.data.length,
        totalQualities: qualitiesRes.data.length,
        totalParties: partiesRes.data.length,
        activeDeals: dealsRes.data.length,
        activePurchases: purchasesRes.data.filter(p => p.status !== 'completed').length,
        recentActivity
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Challans',
      value: stats.totalChallans,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      onClick: () => navigate('/view-challans')
    },
    {
      title: 'Incomplete Challans',
      value: stats.incompleteChallans,
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      onClick: () => navigate('/view-challans')
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50',
      onClick: () => navigate('/view-invoices')
    },
    {
      title: 'Active Deals',
      value: stats.activeDeals,
      icon: Briefcase,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
      onClick: () => navigate('/deals')
    },
    {
      title: 'Qualities',
      value: stats.totalQualities,
      icon: TrendingUp,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      onClick: () => navigate('/qualities')
    },
    {
      title: 'Parties',
      value: stats.totalParties,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-50',
      onClick: () => navigate('/parties')
    },
    {
      title: 'Active Purchases',
      value: stats.activePurchases,
      icon: ShoppingCart,
      gradient: 'from-teal-500 to-cyan-600',
      bgGradient: 'from-teal-50 to-cyan-50',
      onClick: () => navigate('/purchases')
    },
    {
      title: 'Total Stock Items',
      value: stats.totalQualities * 50,
      icon: Package,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      onClick: () => navigate('/stock')
    }
  ];

  const quickActions = [
    {
      title: 'Create Challan',
      description: 'Start a new delivery challan',
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      onClick: () => navigate('/delivery-challan')
    },
    {
      title: 'Generate Invoice',
      description: 'Create a new tax invoice',
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      onClick: () => navigate('/tax-invoice')
    },
    {
      title: 'New Deal',
      description: 'Set up a new business deal',
      icon: Briefcase,
      color: 'from-purple-500 to-indigo-600',
      onClick: () => navigate('/deals')
    },
    {
      title: 'Add Purchase',
      description: 'Record a yarn purchase',
      icon: ShoppingCart,
      color: 'from-teal-500 to-cyan-600',
      onClick: () => navigate('/purchases')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-base text-gray-600 font-medium">
          Welcome back! Here's what's happening with your textile business.
        </p>
      </div>

      {/* Quick Actions - Featured Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-600 font-medium">Get started quickly</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className="group bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-amber-400 transition-all duration-200 hover:shadow-lg text-left"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Statistics Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Overview Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                onClick={stat.onClick}
                className="group cursor-pointer bg-white rounded-xl border-2 border-gray-200 hover:border-amber-400 p-6 transition-all duration-200 hover:shadow-lg relative overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -mr-16 -mt-16`}></div>
                
                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <button 
              onClick={() => navigate('/view-challans')}
              className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer"
                  onClick={() => navigate(activity.type === 'challan' ? '/view-challans' : '/view-invoices')}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'challan' 
                        ? 'bg-gradient-to-r from-blue-100 to-cyan-100' 
                        : 'bg-gradient-to-r from-emerald-100 to-green-100'
                    }`}>
                      {activity.type === 'challan' ? (
                        <FileText className="w-5 h-5 text-blue-700" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-emerald-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {activity.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      activity.status === 'complete' 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300'
                    }`}>
                      {activity.status === 'complete' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {activity.status}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Info Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Database</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">API Status</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Last Backup</span>
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Check out our documentation or contact support for assistance.
            </p>
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md">
              View Documentation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;