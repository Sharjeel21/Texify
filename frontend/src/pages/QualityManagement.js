// frontend/src/pages/QualityManagement.js
import React, { useState, useEffect } from 'react';
import { qualityAPI } from '../services/api';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { ResponsiveFormRow } from '../components/ResponsiveForm';

function QualityManagement() {
  const [qualities, setQualities] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hsnCode: '',
    balesPerChallan: 5,
    piecesPerBale: 10
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQualities();
  }, []);

  const fetchQualities = async () => {
    try {
      const response = await qualityAPI.getAll();
      setQualities(response.data);
    } catch (error) {
      console.error('Error fetching qualities:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!/^\d{4,8}$/.test(formData.hsnCode)) {
      setMessage({ type: 'error', text: 'HSN code must be 4 to 8 digits!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      if (editingId) {
        await qualityAPI.update(editingId, formData);
        setMessage({ type: 'success', text: '✓ Quality updated successfully!' });
      } else {
        await qualityAPI.create(formData);
        setMessage({ type: 'success', text: '✓ Quality created successfully!' });
      }
      resetForm();
      fetchQualities();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error saving quality!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleEdit = (quality) => {
    setFormData({
      name: quality.name,
      description: quality.description || '',
      hsnCode: quality.hsnCode || '',
      balesPerChallan: quality.balesPerChallan || 5,
      piecesPerBale: quality.piecesPerBale || 10
    });
    setEditingId(quality._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quality?')) {
      try {
        await qualityAPI.delete(id);
        setMessage({ type: 'success', text: '✓ Quality deleted successfully!' });
        fetchQualities();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting quality!' });
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      hsnCode: '',
      balesPerChallan: 5, 
      piecesPerBale: 10 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Quality Name',
      render: (quality) => (
        <span className="font-bold text-gray-900">{quality.name}</span>
      )
    },
    {
      key: 'hsnCode',
      header: 'HSN Code',
      render: (quality) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm border border-gray-300">
          {quality.hsnCode}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (quality) => (
        <span className="text-gray-700">{quality.description || '-'}</span>
      )
    },
    {
      key: 'balesPerChallan',
      header: 'Bales/Challan',
      render: (quality) => (
        <span className="font-semibold text-gray-900">{quality.balesPerChallan}</span>
      )
    },
    {
      key: 'piecesPerBale',
      header: 'Pieces/Bale',
      render: (quality) => (
        <span className="font-semibold text-gray-900">{quality.piecesPerBale}</span>
      )
    },
    {
      key: 'currentBaleNumber',
      header: 'Current Bale #',
      render: (quality) => (
        <span className="text-amber-700 font-bold">{quality.currentBaleNumber}</span>
      )
    },
    {
      key: 'currentChallanNumber',
      header: 'Current Challan #',
      render: (quality) => (
        <span className="text-blue-700 font-bold">{quality.currentChallanNumber}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (quality) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(quality);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(quality._id);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all shadow-sm hover:shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Quality Management
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Manage yarn qualities and their specifications
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add New Quality
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

      {/* Form Card */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingId ? 'Edit Quality' : 'Add New Quality'}
            </h3>
            <button
              onClick={resetForm}
              className="md:hidden text-gray-600 hover:text-gray-900 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quality Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Quality Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 6.00 kg 37', 8.00kg 46"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this quality"
                rows="3"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical min-h-[120px] transition-all"
              />
            </div>

            {/* HSN Code */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                HSN Code *
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 8) {
                    setFormData({ ...formData, hsnCode: value });
                  }
                }}
                placeholder="e.g., 5208, 520841"
                maxLength="8"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
              />
              <p className="text-sm text-gray-600">
                HSN (Harmonized System of Nomenclature) code for GST - 4 to 8 digits
              </p>
            </div>

            {/* Bales & Pieces Row */}
            <ResponsiveFormRow>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Bales Per Challan *
                </label>
                <input
                  type="number"
                  value={formData.balesPerChallan}
                  onChange={(e) => setFormData({ ...formData, balesPerChallan: parseInt(e.target.value) })}
                  placeholder="Number of bales in one delivery challan"
                  min="1"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
                <p className="text-sm text-gray-600">
                  How many bales in one delivery challan
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Pieces Per Bale *
                </label>
                <input
                  type="number"
                  value={formData.piecesPerBale}
                  onChange={(e) => setFormData({ ...formData, piecesPerBale: parseInt(e.target.value) })}
                  placeholder="Number of cloth pieces per bale"
                  min="1"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
                <p className="text-sm text-gray-600">
                  How many cloth pieces in one bale
                </p>
              </div>
            </ResponsiveFormRow>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t-2 border-gray-200">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto md:min-w-[150px]"
              >
                {editingId ? 'Update Quality' : 'Add Quality'}
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

      {/* Qualities Table/Cards */}
      {qualities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Qualities Yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first quality.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add First Quality
          </button>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={qualities}
          onRowClick={(quality) => handleEdit(quality)}
          className="hover:bg-amber-50"
        />
      )}
    </div>
  );
}

export default QualityManagement;