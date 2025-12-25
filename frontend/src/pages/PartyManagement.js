import React, { useState, useEffect } from 'react';
import { partyAPI } from '../services/api';

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

    // When 15 characters entered and not editing, show CAPTCHA modal
    if (gstValue.length === 15 && !editingId) {
      // Validate GST format
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
        
        // Fill form with GST data
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
        
        // Close modal
        setShowCaptchaModal(false);
        setCaptchaInput('');
      } else {
        setMessage({ 
          type: 'error', 
          text: response.data.error || 'GST verification failed. Please enter details manually.' 
        });
        
        // Auto-fill state code at least
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
        setMessage({ type: 'success', text: 'Party updated successfully!' });
      } else {
        await partyAPI.create(formData);
        setMessage({ type: 'success', text: 'Party created successfully!' });
      }
      
      setFormData({
        name: '',
        address: '',
        gstNumber: '',
        state: '',
        stateCode: '',
      });
      setEditingId(null);
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        await partyAPI.delete(id);
        setMessage({ type: 'success', text: 'Party deleted successfully!' });
        fetchParties();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting party!' });
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      address: '',
      gstNumber: '',
      state: '',
      stateCode: '',
    });
    setEditingId(null);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Party Management</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* CAPTCHA Modal */}
      {showCaptchaModal && (
        <div className="modal-overlay" onClick={closeCaptchaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>GST Verification</h2>
              <button className="modal-close" onClick={closeCaptchaModal}>×</button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Enter the CAPTCHA below to verify GST number: <strong>{pendingGSTNumber}</strong>
              </p>
              
              {captchaLoading ? (
                <div className="loading" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Loading CAPTCHA...</p>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={captchaImage} 
                      alt="CAPTCHA" 
                      style={{ 
                        maxWidth: '100%', 
                        border: '2px solid #ddd', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={refreshCaptcha}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Click image to refresh
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label>Enter CAPTCHA *</label>
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
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={verifyGSTWithCaptcha}
                      disabled={verifyingGST}
                      style={{ flex: 1 }}
                    >
                      {verifyingGST ? 'Verifying...' : 'Verify GST'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={closeCaptchaModal}
                      disabled={verifyingGST}
                      style={{ flex: 1 }}
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

      <div className="card">
        <div className="card-header">{editingId ? 'Edit Party' : 'Add New Party'}</div>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label>GST Number *</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={handleGSTNumberChange}
              placeholder="Enter 15-digit GST Number (e.g., 27AAPFU0939F1ZV)"
              maxLength="15"
              required
            />
            {!editingId && (
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                CAPTCHA verification will appear after entering 15 digits
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Party Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Party/Company Name"
              required
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete Address"
              rows="3"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g., Maharashtra"
                required
              />
            </div>

            <div className="form-group">
              <label>State Code *</label>
              <input
                type="text"
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                placeholder="e.g., 27"
                maxLength="2"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Party' : 'Add Party'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Party Name</th>
              <th>GST Number</th>
              <th>State</th>
              <th>State Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((party) => (
              <tr key={party._id}>
                <td><strong>{party.name}</strong></td>
                <td>{party.gstNumber}</td>
                <td>{party.state}</td>
                <td>{party.stateCode}</td>
                <td>
                  <button
                    onClick={() => handleEdit(party)}
                    className="btn btn-primary btn-small"
                    style={{ marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(party._id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {parties.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
            No parties added yet. Add your first party above.
          </p>
        )}
      </div>
    </div>
  );
}

export default PartyManagement;