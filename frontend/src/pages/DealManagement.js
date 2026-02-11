// frontend/src/pages/DealManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealAPI, partyAPI, qualityAPI } from '../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Package,
  X
} from 'lucide-react';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { ResponsiveFormRow } from '../components/ResponsiveForm';

function DealManagement() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [parties, setParties] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    dealNumber: '',
    party: '',
    quality: '',
    ratePerMeter: '',
    totalBilties: '',
    notes: ''
  });
  
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDeals();
    fetchParties();
    fetchQualities();
  }, []);

  const fetchDeals = async (status = 'all') => {
    try {
      const params = status !== 'all' ? { status } : {};
      const response = await dealAPI.getAll(params);
      setDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await partyAPI.getAll();
      setParties(response.data);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const fetchQualities = async () => {
    try {
      const response = await qualityAPI.getAll();
      setQualities(response.data);
    } catch (error) {
      console.error('Error fetching qualities:', error);
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    fetchDeals(status);
  };

  const resetForm = () => {
    setFormData({
      dealNumber: '',
      party: '',
      quality: '',
      ratePerMeter: '',
      totalBilties: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await dealAPI.update(editingId, formData);
        setMessage({ type: 'success', text: '✓ Deal updated successfully!' });
      } else {
        await dealAPI.create(formData);
        setMessage({ type: 'success', text: '✓ Deal created successfully!' });
      }
      
      resetForm();
      fetchDeals(filterStatus);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error saving deal!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleEdit = async (deal) => {
    setFormData({
      party: deal.party._id,
      quality: deal.quality._id,
      ratePerMeter: deal.ratePerMeter,
      totalBilties: deal.totalBilties,
      notes: deal.notes || ''
    });
    setEditingId(deal._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await dealAPI.delete(id);
        setMessage({ type: 'success', text: '✓ Deal deleted successfully!' });
        fetchDeals(filterStatus);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Error deleting deal!' 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    }
  };

  const handleCreateNewDeal = async () => {
    try {
      const response = await dealAPI.getNextDealNumber();
      setFormData({
        dealNumber: response.data.nextDealNumber,
        party: '',
        quality: '',
        ratePerMeter: '',
        totalBilties: '',
        notes: ''
      });
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error getting next deal number:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': 
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
      case 'completed': 
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300';
      case 'cancelled': 
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgressPercentage = (completed, total) => {
    return Math.round((completed / total) * 100);
  };

  // Table columns configuration
  const columns = [
    { 
      key: 'dealNumber', 
      header: 'Deal #',
      render: (deal) => (
        <span className="font-bold text-amber-700 flex items-center gap-1">
          <Briefcase className="w-4 h-4" />
          #{deal.dealNumber}
        </span>
      )
    },
    { 
      key: 'party', 
      header: 'Party',
      render: (deal) => (
        <span className="font-semibold text-gray-900">
          {deal.partyDetails?.name || '-'}
        </span>
      )
    },
    { 
      key: 'quality', 
      header: 'Quality',
      render: (deal) => (
        <span className="text-gray-700">
          {deal.qualityDetails?.name || '-'}
        </span>
      )
    },
    { 
      key: 'rate', 
      header: 'Rate/Meter',
      render: (deal) => (
        <span className="font-bold text-gray-900">₹{deal.ratePerMeter}</span>
      )
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (deal) => {
        const progress = getProgressPercentage(deal.completedBilties, deal.totalBilties);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    progress === 100 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold whitespace-nowrap text-gray-700">
                {deal.completedBilties}/{deal.totalBilties}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (deal) => (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(deal.status)}`}>
          {deal.status === 'active' && <TrendingUp className="w-3 h-3" />}
          {deal.status === 'completed' && <CheckCircle className="w-3 h-3" />}
          {deal.status === 'cancelled' && <AlertCircle className="w-3 h-3" />}
          {deal.status.toUpperCase()}
        </span>
      )
    },
    {
      key: 'created',
      header: 'Created',
      render: (deal) => (
        <span className="text-sm text-gray-600">
          {new Date(deal.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (deal) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/deal/${deal._id}`);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          {deal.status === 'active' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(deal);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/deal/${deal._id}/create-challan`);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <FileText className="w-4 h-4" />
                Challan
              </button>
            </>
          )}
          {deal.challanIds?.length === 0 && deal.invoiceIds?.length === 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(deal._id);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all shadow-sm hover:shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Deal Management
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Manage business deals with parties
          </p>
        </div>
        {!showForm && (
          <button 
            onClick={handleCreateNewDeal}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Create New Deal
          </button>
        )}
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

      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-amber-600" />
              {editingId ? 'Edit Deal' : 'Create New Deal'}
            </h3>
            <button 
              onClick={resetForm}
              className="md:hidden text-gray-600 hover:text-gray-900 text-2xl leading-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <ResponsiveFormRow>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Party *
                </label>
                <select
                  value={formData.party}
                  onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                  required
                  disabled={editingId}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Party</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.name} - {party.gstNumber}
                    </option>
                  ))}
                </select>
                {editingId && (
                  <p className="text-sm text-gray-600">
                    Party cannot be changed after deal creation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Quality *
                </label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  required
                  disabled={editingId}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Quality</option>
                  {qualities.map((quality) => (
                    <option key={quality._id} value={quality._id}>
                      {quality.name}
                    </option>
                  ))}
                </select>
                {editingId && (
                  <p className="text-sm text-gray-600">
                    Quality cannot be changed after deal creation
                  </p>
                )}
              </div>
            </ResponsiveFormRow>

            <ResponsiveFormRow>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Rate Per Meter (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ratePerMeter}
                  onChange={(e) => setFormData({ ...formData, ratePerMeter: e.target.value })}
                  placeholder="Enter rate per meter"
                  required
                  min="0"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Total Bilties (Complete Challans) *
                </label>
                <input
                  type="number"
                  value={formData.totalBilties}
                  onChange={(e) => setFormData({ ...formData, totalBilties: e.target.value })}
                  placeholder="Enter total number of bilties"
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
                <p className="text-sm text-gray-600">
                  Number of complete delivery challans in this deal
                </p>
              </div>
            </ResponsiveFormRow>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this deal"
                rows="3"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical min-h-[120px] transition-all"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t-2 border-gray-200">
              <button 
                type="submit" 
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto md:min-w-[150px]"
              >
                <CheckCircle className="w-5 h-5" />
                {editingId ? 'Update Deal' : 'Create Deal'}
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50 transition-all w-full md:w-auto md:min-w-[150px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Filter Deals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleFilterChange('all')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md ${
              filterStatus === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50'
            }`}
          >
            <Package className="w-4 h-4" />
            All ({deals.length})
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md ${
              filterStatus === 'active'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:bg-green-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Active
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md ${
              filterStatus === 'completed'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('cancelled')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md ${
              filterStatus === 'cancelled'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:bg-red-50'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Cancelled
          </button>
        </div>
      </div>

      {/* Deals Table/Cards */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Deals Found</h3>
          <p className="text-gray-600 mb-4">
            {filterStatus === 'all' 
              ? 'Create your first deal to get started.' 
              : `No ${filterStatus} deals found.`}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={handleCreateNewDeal}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create First Deal
            </button>
          )}
        </div>
      ) : (
        <ResponsiveTable 
          columns={columns}
          data={deals}
          onRowClick={(deal) => navigate(`/deal/${deal._id}`)}
          className="hover:bg-amber-50"
        />
      )}
    </div>
  );
}

export default DealManagement;