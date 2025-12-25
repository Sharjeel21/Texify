// frontend/src/pages/QualityManagement.js
import React, { useState, useEffect } from 'react';
import { qualityAPI } from '../services/api';

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
    
    // Validate HSN code
    if (!/^\d{4,8}$/.test(formData.hsnCode)) {
      setMessage({ type: 'error', text: 'HSN code must be 4 to 8 digits!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      if (editingId) {
        await qualityAPI.update(editingId, formData);
        setMessage({ type: 'success', text: 'Quality updated successfully!' });
      } else {
        await qualityAPI.create(formData);
        setMessage({ type: 'success', text: 'Quality created successfully!' });
      }
      setFormData({ 
        name: '', 
        description: '', 
        hsnCode: '',
        balesPerChallan: 5, 
        piecesPerBale: 10 
      });
      setEditingId(null);
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quality?')) {
      try {
        await qualityAPI.delete(id);
        setMessage({ type: 'success', text: 'Quality deleted successfully!' });
        fetchQualities();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting quality!' });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ 
      name: '', 
      description: '', 
      hsnCode: '',
      balesPerChallan: 5, 
      piecesPerBale: 10 
    });
    setEditingId(null);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Quality Management</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">{editingId ? 'Edit Quality' : 'Add New Quality'}</div>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label>Quality Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 6.00 kg 37', 8.00kg 46"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this quality"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>HSN Code *</label>
            <input
              type="text"
              value={formData.hsnCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                if (value.length <= 8) {
                  setFormData({ ...formData, hsnCode: value });
                }
              }}
              placeholder="e.g., 5208, 520841"
              maxLength="8"
              required
            />
            <small style={{ color: '#666' }}>
              HSN (Harmonized System of Nomenclature) code for GST - 4 to 8 digits
            </small>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Bales Per Challan *</label>
              <input
                type="number"
                value={formData.balesPerChallan}
                onChange={(e) => setFormData({ ...formData, balesPerChallan: parseInt(e.target.value) })}
                placeholder="Number of bales in one delivery challan"
                min="1"
                required
              />
              <small style={{ color: '#666' }}>How many bales in one delivery challan</small>
            </div>

            <div className="form-group">
              <label>Pieces Per Bale *</label>
              <input
                type="number"
                value={formData.piecesPerBale}
                onChange={(e) => setFormData({ ...formData, piecesPerBale: parseInt(e.target.value) })}
                placeholder="Number of cloth pieces per bale"
                min="1"
                required
              />
              <small style={{ color: '#666' }}>How many cloth pieces in one bale</small>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Quality' : 'Add Quality'}
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
              <th>Quality Name</th>
              <th>HSN Code</th>
              <th>Description</th>
              <th>Bales/Challan</th>
              <th>Pieces/Bale</th>
              <th>Current Bale #</th>
              <th>Current Challan #</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {qualities.map((quality) => (
              <tr key={quality._id}>
                <td><strong>{quality.name}</strong></td>
                <td><span style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#f0f0f0', 
                  padding: '2px 6px', 
                  borderRadius: '3px' 
                }}>{quality.hsnCode}</span></td>
                <td>{quality.description}</td>
                <td>{quality.balesPerChallan}</td>
                <td>{quality.piecesPerBale}</td>
                <td>{quality.currentBaleNumber}</td>
                <td>{quality.currentChallanNumber}</td>
                <td>
                  <button
                    onClick={() => handleEdit(quality)}
                    className="btn btn-primary btn-small"
                    style={{ marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quality._id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {qualities.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
            No qualities added yet. Add your first quality above.
          </p>
        )}
      </div>
    </div>
  );
}

export default QualityManagement;