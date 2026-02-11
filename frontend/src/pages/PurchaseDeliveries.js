// frontend/src/pages/PurchaseManagement.js
import React, { useState, useEffect } from 'react';
import { purchaseAPI, partyAPI } from '../services/api';
import { Plus, Edit, Trash2, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { ResponsiveFormRow } from '../components/ResponsiveForm';
import { cn } from '../lib/utils';

const PurchaseManagement = () => {
  const [purchases, setPurchases] = useState([]);
  const [parties, setParties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
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
    }
  };

  const loadParties = async () => {
    try {
      const response = await partyAPI.getAll();
      setParties(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load parties' });
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
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error saving purchase!' 
      });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await purchaseAPI.delete(id);
        setMessage({ type: 'success', text: '✓ Purchase deleted successfully!' });
        loadPurchases();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Error deleting purchase!' 
        });
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

  const getFilteredPurchases = () => {
    if (filterStatus === 'all') return purchases;
    return purchases.filter(p => p.status === filterStatus);
  };

  const getStatusCounts = () => {
    return {
      all: purchases.length,
      pending: purchases.filter(p => p.status === 'pending').length,
      partial: purchases.filter(p => p.status === 'partial').length,
      completed: purchases.filter(p => p.status === 'completed').length
    };
  };

  const filteredPurchases = getFilteredPurchases();
  const statusCounts = getStatusCounts();

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300',
      partial: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300',
      completed: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const columns = [
    {
      key: 'purchaseNumber',
      header: 'PO #',
      render: (purchase) => (
        <span className="font-bold text-amber-700">#{purchase.purchaseNumber}</span>
      )
    },
    {
      key: 'party',
      header: 'Party',
      render: (purchase) => (
        <span className="font-semibold text-gray-900">{purchase.partyName}</span>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (purchase) => (
        <span className="text-gray-700">
          {new Date(purchase.purchaseDate).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'yarn',
      header: 'Yarn',
      render: (purchase) => (
        <span className="text-gray-700">
          {purchase.yarnType} {purchase.yarnQuality}
        </span>
      )
    },
    {
      key: 'quantity',
      header: 'Approx Qty',
      render: (purchase) => (
        <span className="font-semibold text-gray-900">
          {purchase.approxQuantity || 0} T
        </span>
      )
    },
    {
      key: 'actualWeight',
      header: 'Actual Weight',
      render: (purchase) => {
        const totalActualWeight = purchase.totalActualWeight || 0;
        return (
          <span className="font-bold text-green-700">
            {totalActualWeight.toFixed(3)} T
          </span>
        );
      }
    },
    {
      key: 'remaining',
      header: 'Remaining',
      render: (purchase) => {
        const remainingQuantity = purchase.remainingApproxQuantity !== undefined 
          ? purchase.remainingApproxQuantity 
          : (purchase.approxQuantity || 0);
        return (
          <span className="font-bold text-amber-700">
            {remainingQuantity.toFixed(3)} T
          </span>
        );
      }
    },
    {
      key: 'rate',
      header: 'Rate/Kg',
      render: (purchase) => (
        <span className="font-semibold text-gray-900">₹{purchase.ratePerKg}</span>
      )
    },
    {
      key: 'godown',
      header: 'Godown ₹/Kg',
      render: (purchase) => {
        const godownCharges = purchase.godownChargesPerKg || 0;
        return godownCharges > 0 ? (
          <span className="text-red-600 font-semibold">₹{godownCharges}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      }
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (purchase) => (
        <span className="text-sm text-gray-700">
          {purchase.paymentType} ({purchase.paymentDays}d)
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (purchase) => (
        <span className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border',
          getStatusBadge(purchase.status)
        )}>
          {purchase.status.toUpperCase()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (purchase) => {
        const totalActualWeight = purchase.totalActualWeight || 0;
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(purchase);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(purchase._id);
              }}
              disabled={totalActualWeight > 0}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all shadow-sm",
                totalActualWeight > 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 hover:shadow-md"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete
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
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            New Purchase
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-lg border-l-4 ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={resetForm}
        >
          <div 
            className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 px-6 py-4 border-b-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 rounded-t-2xl flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPurchase ? 'Edit Purchase' : 'New Purchase Order'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
              <ResponsiveFormRow>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Party *
                  </label>
                  <select
                    value={formData.party}
                    onChange={(e) => setFormData({...formData, party: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-white cursor-pointer transition-all"
                  >
                    <option value="">Select Party</option>
                    {parties.map(party => (
                      <option key={party._id} value={party._id}>{party.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                </div>
              </ResponsiveFormRow>

              <ResponsiveFormRow>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Yarn Type *
                  </label>
                  <select
                    value={formData.yarnType}
                    onChange={(e) => setFormData({...formData, yarnType: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-white cursor-pointer transition-all"
                  >
                    <option value="Roto">Roto</option>
                    <option value="Zeero">Zeero</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Yarn Quality *
                  </label>
                  <input
                    type="text"
                    value={formData.yarnQuality}
                    onChange={(e) => setFormData({...formData, yarnQuality: e.target.value})}
                    placeholder="e.g., 20s, 30s, 40s"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                </div>
              </ResponsiveFormRow>

              <ResponsiveFormRow>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Approx. Quantity (Tons) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.approxQuantity}
                    onChange={(e) => setFormData({...formData, approxQuantity: e.target.value})}
                    placeholder="e.g., 10"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                  <p className="text-sm text-gray-600">
                    Deal quantity (actual weight may vary)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Rate per Kg *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ratePerKg}
                    onChange={(e) => setFormData({...formData, ratePerKg: e.target.value})}
                    placeholder="e.g., 112"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                </div>
              </ResponsiveFormRow>

              <ResponsiveFormRow>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Godown Charges per Kg
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.godownChargesPerKg}
                    onChange={(e) => setFormData({...formData, godownChargesPerKg: e.target.value})}
                    placeholder="e.g., 1.65"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                  />
                  <p className="text-sm text-gray-600">
                    Amount to deduct from payment
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Payment Type *
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-white cursor-pointer transition-all"
                  >
                    <option value="Current">Current Payment</option>
                    <option value="Dhara">Dhara (Borrow)</option>
                  </select>
                </div>
              </ResponsiveFormRow>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Payment Days *
                </label>
                <input
                  type="number"
                  value={formData.paymentDays}
                  onChange={(e) => setFormData({...formData, paymentDays: e.target.value})}
                  placeholder="e.g., 4, 5, 30, 40"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical transition-all"
                />
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t-2 border-amber-200">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50 transition-all w-full md:w-auto"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto"
                >
                  {editingPurchase ? 'Update' : 'Create'} Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Purchases</h3>
        <div className="flex flex-col md:flex-row gap-3">
          {[
            { key: 'all', label: 'All', icon: ShoppingCart },
            { key: 'pending', label: 'Pending', icon: AlertCircle },
            { key: 'partial', label: 'Partial', icon: TrendingUp },
            { key: 'completed', label: 'Completed', icon: TrendingUp }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-all",
                filterStatus === key
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* Purchases Table */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Purchases Found</h3>
          <p className="text-gray-600 mb-4">Create your first purchase order to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create First Purchase
          </button>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={filteredPurchases}
          className="hover:bg-amber-50"
        />
      )}
    </div>
  );
};

export default PurchaseManagement;