// frontend/src/pages/PartyManagement.js
import React, { useState, useEffect } from 'react';
import { partyAPI } from '../services/api';
import { Plus, Edit, Trash2, Users, RefreshCw, Shield } from 'lucide-react';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { ResponsiveFormRow } from '../components/ResponsiveForm';

function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gstNumber: '',
    state: '',
    stateCode: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  
  // CAPTCHA related states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [pendingGSTNumber, setPendingGSTNumber] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await partyAPI.getAll();
      setParties(response.data);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const handleGSTNumberChange = async (e) => {
    const gstValue = e.target.value.toUpperCase();
    setFormData({ ...formData, gstNumber: gstValue });

    if (gstValue.length === 15 && !editingId) {
      const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstPattern.test(gstValue)) {
        setPendingGSTNumber(gstValue);
        await initializeCaptcha();
      } else {
        setMessage({ type: 'error', text: 'Invalid GST number format!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const initializeCaptcha = async () => {
    setCaptchaLoading(true);
    setShowCaptchaModal(true);
    setCaptchaInput('');
    
    try {
      const response = await partyAPI.initCaptcha();
      
      if (response.data.success) {
        setCaptchaImage(response.data.captchaImage);
        setSessionId(response.data.sessionId);
        setMessage({ type: 'info', text: 'Please enter the CAPTCHA to verify GST number' });
      } else {
        setMessage({ type: 'error', text: 'Failed to load CAPTCHA. Please try again.' });
        setShowCaptchaModal(false);
      }
    } catch (error) {
      console.error('Error initializing CAPTCHA:', error);
      setMessage({ type: 'error', text: 'Error loading CAPTCHA. Please try again.' });
      setShowCaptchaModal(false);
    } finally {
      setCaptchaLoading(false);
    }
  };

  const refreshCaptcha = async () => {
    await initializeCaptcha();
  };

  const verifyGSTWithCaptcha = async () => {
    if (!captchaInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter the CAPTCHA' });
      return;
    }

    setVerifyingGST(true);
    
    try {
      const response = await partyAPI.verifyGST({
        sessionId: sessionId,
        gstNumber: pendingGSTNumber,
        captcha: captchaInput
      });

      if (response.data.success) {
        const gstData = response.data.data;
        
        setFormData({
          ...formData,
          gstNumber: pendingGSTNumber,
          name: gstData.name || '',
          address: gstData.address || '',
          state: gstData.state || '',
          stateCode: gstData.stateCode || '',
        });
        
        setMessage({ 
          type: 'success', 
          text: `✓ GST verified successfully! Company: ${gstData.name}` 
        });
        
        setShowCaptchaModal(false);
        setCaptchaInput('');
      } else {
        setMessage({ 
          type: 'error', 
          text: response.data.error || 'GST verification failed. Please enter details manually.' 
        });
        
        const stateCode = pendingGSTNumber.substring(0, 2);
        setFormData({
          ...formData,
          gstNumber: pendingGSTNumber,
          stateCode: stateCode
        });
        
        setShowCaptchaModal(false);
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error verifying GST:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error verifying GST. Please enter details manually.' 
      });
      setShowCaptchaModal(false);
    } finally {
      setVerifyingGST(false);
    }
  };

  const closeCaptchaModal = () => {
    setShowCaptchaModal(false);
    setCaptchaInput('');
    setMessage({ type: 'info', text: 'GST verification skipped. Please enter details manually.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.gstNumber.length !== 15) {
      setMessage({ type: 'error', text: 'GST number must be exactly 15 characters!' });
      return;
    }
    
    try {
      if (editingId) {
        await partyAPI.update(editingId, formData);
        setMessage({ type: 'success', text: '✓ Party updated successfully!' });
      } else {
        await partyAPI.create(formData);
        setMessage({ type: 'success', text: '✓ Party created successfully!' });
      }
      
      resetForm();
      fetchParties();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error saving party!' 
      });
    }
  };

  const handleEdit = (party) => {
    setFormData({
      name: party.name,
      address: party.address,
      gstNumber: party.gstNumber,
      state: party.state,
      stateCode: party.stateCode,
    });
    setEditingId(party._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        await partyAPI.delete(id);
        setMessage({ type: 'success', text: '✓ Party deleted successfully!' });
        fetchParties();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting party!' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      gstNumber: '',
      state: '',
      stateCode: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Party Name',
      render: (party) => (
        <span className="font-bold text-gray-900">{party.name}</span>
      )
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      render: (party) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border border-gray-300">
          {party.gstNumber}
        </span>
      )
    },
    {
      key: 'state',
      header: 'State',
      render: (party) => (
        <span className="text-gray-700">{party.state}</span>
      )
    },
    {
      key: 'stateCode',
      header: 'State Code',
      render: (party) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-300">
          {party.stateCode}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (party) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(party);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(party._id);
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
            Party Management
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Manage customers and suppliers with GST verification
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add New Party
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-lg border-l-4 ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
            : message.type === 'info'
            ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-500 text-cyan-800'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* CAPTCHA Modal */}
      {showCaptchaModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeCaptchaModal}
        >
          <div 
            className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-700" />
                <h3 className="text-xl font-bold text-gray-900">GST Verification</h3>
              </div>
              <button 
                onClick={closeCaptchaModal}
                className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Enter the CAPTCHA to verify: <strong className="text-amber-700">{pendingGSTNumber}</strong>
              </p>
              
              {captchaLoading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading CAPTCHA...</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <img 
                      src={captchaImage} 
                      alt="CAPTCHA" 
                      className="max-w-full border-2 border-gray-300 rounded-lg cursor-pointer hover:border-amber-500 transition-colors mx-auto"
                      onClick={refreshCaptcha}
                    />
                    <button
                      onClick={refreshCaptcha}
                      className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Click to refresh CAPTCHA
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Enter CAPTCHA *
                    </label>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter the text shown above"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          verifyGSTWithCaptcha();
                        }
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    <button 
                      onClick={verifyGSTWithCaptcha}
                      disabled={verifyingGST}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full md:flex-1"
                    >
                      {verifyingGST ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Verify GST
                        </>
                      )}
                    </button>
                    <button 
                      onClick={closeCaptchaModal}
                      disabled={verifyingGST}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:flex-1"
                    >
                      Skip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingId ? 'Edit Party' : 'Add New Party'}
            </h3>
            <button
              onClick={resetForm}
              className="md:hidden text-gray-600 hover:text-gray-900 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GST Number */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                GST Number *
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={handleGSTNumberChange}
                placeholder="Enter 15-digit GST Number (e.g., 27AAPFU0939F1ZV)"
                maxLength="15"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-mono"
              />
              {!editingId && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  CAPTCHA verification will appear after entering 15 digits
                </p>
              )}
              <p className="text-xs text-gray-500">{formData.gstNumber.length}/15 characters</p>
            </div>

            {/* Party Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Party Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Party/Company Name"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete Address"
                rows="3"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical min-h-[120px] transition-all"
              />
            </div>

            {/* State & State Code */}
            <ResponsiveFormRow>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  State Code *
                </label>
                <input
                  type="text"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  placeholder="e.g., 27"
                  maxLength="2"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
              </div>
            </ResponsiveFormRow>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t-2 border-gray-200">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto md:min-w-[150px]"
              >
                {editingId ? 'Update Party' : 'Add Party'}
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

      {/* Parties Table/Cards */}
      {parties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Parties Yet</h3>
          <p className="text-gray-600 mb-4">Add your first customer or supplier to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add First Party
          </button>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={parties}
          onRowClick={(party) => handleEdit(party)}
          className="hover:bg-amber-50"
        />
      )}
    </div>
  );
}

export default PartyManagement;