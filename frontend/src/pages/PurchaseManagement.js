// frontend/src/pages/PurchaseManagement.js
import React, { useState, useEffect } from 'react';
import { purchaseAPI, partyAPI } from '../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  X,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { ResponsiveTable } from '../components/ResponsiveTable';

const PurchaseManagement = () => {
  const [purchases, setPurchases] = useState([]);
  const [parties, setParties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    party: '',
    yarnType: 'Roto',
    yarnQuality: '',
    approxQuantity: '',
    ratePerKg: '',
    godownChargesPerKg: '0',
    paymentType: 'Current',
    paymentDays: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadPurchases();
    loadParties();
  }, []);

  const loadPurchases = async () => {
    try {
      const response = await purchaseAPI.getAll();
      setPurchases(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load purchases' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const loadParties = async () => {
    try {
      const response = await partyAPI.getAll();
      setParties(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load parties' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPurchase) {
        await purchaseAPI.update(editingPurchase._id, formData);
        setMessage({ type: 'success', text: '✓ Purchase updated successfully!' });
      } else {
        await purchaseAPI.create(formData);
        setMessage({ type: 'success', text: '✓ Purchase created successfully!' });
      }
      resetForm();
      loadPurchases();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save purchase' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      party: purchase.party._id,
      yarnType: purchase.yarnType,
      yarnQuality: purchase.yarnQuality,
      approxQuantity: purchase.approxQuantity || '',
      ratePerKg: purchase.ratePerKg,
      godownChargesPerKg: purchase.godownChargesPerKg || '0',
      paymentType: purchase.paymentType,
      paymentDays: purchase.paymentDays,
      purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
      notes: purchase.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await purchaseAPI.delete(id);
        setMessage({ type: 'success', text: '✓ Purchase deleted successfully!' });
        loadPurchases();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete purchase' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      party: '',
      yarnType: 'Roto',
      yarnQuality: '',
      approxQuantity: '',
      ratePerKg: '',
      godownChargesPerKg: '0',
      paymentType: 'Current',
      paymentDays: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingPurchase(null);
    setShowForm(false);
  };

  const filteredPurchases = filterStatus === 'all' 
    ? purchases 
    : purchases.filter(p => p.status === filterStatus);

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300',
      partial: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300',
      completed: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Table columns configuration
  const columns = [
    {
      key: 'purchaseNumber',
      header: 'PO #',
      render: (purchase) => (
        <span className="font-bold text-amber-700 text-sm">#{purchase.purchaseNumber}</span>
      )
    },
    {
      key: 'party',
      header: 'Party',
      render: (purchase) => (
        <span className="font-semibold text-gray-900 text-sm">{purchase.partyName}</span>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (purchase) => (
        <span className="text-xs text-gray-600">
          {new Date(purchase.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
        </span>
      )
    },
    {
      key: 'yarn',
      header: 'Yarn',
      render: (purchase) => (
        <div className="text-xs">
          <div className="font-medium text-gray-900">{purchase.yarnType}</div>
          <div className="text-gray-500">{purchase.yarnQuality}</div>
        </div>
      )
    },
    {
      key: 'approxQty',
      header: 'Approx',
      render: (purchase) => (
        <span className="font-medium text-gray-900 text-xs">
          {purchase.approxQuantity || 0}T
        </span>
      )
    },
    {
      key: 'actualWeight',
      header: 'Actual',
      render: (purchase) => {
        const totalActualWeight = purchase.totalActualWeight || 0;
        const totalDeductedWeight = purchase.totalDeductedWeight || 0;
        return (
          <div className="text-xs">
            <span className="font-bold text-green-700">
              {totalActualWeight.toFixed(2)}T
            </span>
            {totalActualWeight !== totalDeductedWeight && (
              <div className="text-gray-500">
                D:{totalDeductedWeight.toFixed(2)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'remaining',
      header: 'Remain',
      render: (purchase) => {
        const approxQuantity = purchase.approxQuantity || 0;
        const totalDeductedWeight = purchase.totalDeductedWeight || 0;
        const remainingQuantity = purchase.remainingApproxQuantity !== undefined 
          ? purchase.remainingApproxQuantity 
          : (approxQuantity - totalDeductedWeight);
        return (
          <span className="font-bold text-amber-700 text-xs">
            {remainingQuantity.toFixed(2)}T
          </span>
        );
      }
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (purchase) => (
        <span className="font-medium text-gray-900 text-xs">₹{purchase.ratePerKg}</span>
      )
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (purchase) => (
        <div className="text-xs">
          <div className="font-medium text-gray-900">{purchase.paymentType}</div>
          <div className="text-gray-500">{purchase.paymentDays}d</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (purchase) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(purchase.status)}`}>
          {purchase.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (purchase) => {
        const totalActualWeight = purchase.totalActualWeight || 0;
        return (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(purchase);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all"
              title="Edit"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(purchase._id);
              }}
              disabled={totalActualWeight > 0}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                totalActualWeight > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700'
              }`}
              title={totalActualWeight > 0 ? 'Cannot delete' : 'Delete'}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Purchase Management
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Manage yarn purchases with flexible weight tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all shadow-sm hover:shadow-md md:hidden"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Purchase</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-lg border-l-4 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters Card */}
      <div className={`bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 transition-all ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter Purchases</h2>
          </div>
          {showFilters && (
            <button 
              onClick={() => setFilterStatus('all')}
              className="md:hidden text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Filter by Status:
          </label>
          <select 
            className="w-full md:w-64 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Active filter indicator */}
        {filterStatus !== 'all' && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-700">Active Filter:</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(filterStatus)}`}>
                Status: {filterStatus}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={resetForm}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-600" />
                {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Party *</label>
                  <select
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.party}
                    onChange={(e) => setFormData({...formData, party: e.target.value})}
                    required
                  >
                    <option value="">Select Party</option>
                    {parties.map(party => (
                      <option key={party._id} value={party._id}>{party.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Yarn Type *</label>
                  <select
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.yarnType}
                    onChange={(e) => setFormData({...formData, yarnType: e.target.value})}
                    required
                  >
                    <option value="Roto">Roto</option>
                    <option value="Zeero">Zeero</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Yarn Quality *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.yarnQuality}
                    onChange={(e) => setFormData({...formData, yarnQuality: e.target.value})}
                    placeholder="e.g., 20s, 30s, 40s"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Approx. Quantity (Tons) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.approxQuantity}
                    onChange={(e) => setFormData({...formData, approxQuantity: e.target.value})}
                    placeholder="e.g., 10"
                    required
                  />
                  <small className="text-xs text-gray-500 mt-1 block">
                    Deal quantity (actual weight may vary)
                  </small>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Rate per Kg *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.ratePerKg}
                    onChange={(e) => setFormData({...formData, ratePerKg: e.target.value})}
                    placeholder="e.g., 112"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Godown Charges per Kg</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.godownChargesPerKg}
                    onChange={(e) => setFormData({...formData, godownChargesPerKg: e.target.value})}
                    placeholder="e.g., 1.65"
                  />
                  <small className="text-xs text-gray-500 mt-1 block">
                    Amount to deduct from payment
                  </small>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Payment Type *</label>
                  <select
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                    required
                  >
                    <option value="Current">Current Payment</option>
                    <option value="Dhara">Dhara (Borrow)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Payment Days *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    value={formData.paymentDays}
                    onChange={(e) => setFormData({...formData, paymentDays: e.target.value})}
                    placeholder="e.g., 4, 5, 30, 40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional notes about this purchase..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
                >
                  {editingPurchase ? 'Update Purchase' : 'Create Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Purchases Found</h3>
          <p className="text-gray-600 mb-6">
            {purchases.length === 0 
              ? "Create your first purchase order to get started" 
              : "No purchases match the selected filters."}
          </p>
          {purchases.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create First Purchase
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
            <p className="text-sm font-semibold text-gray-700">
              Showing {filteredPurchases.length} of {purchases.length} purchase{purchases.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ResponsiveTable
            columns={columns}
            data={filteredPurchases}
            className="hover:bg-amber-50"
          />
        </div>
      )}
    </div>
  );
};

export default PurchaseManagement;