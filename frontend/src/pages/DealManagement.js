import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealAPI, partyAPI, qualityAPI } from '../services/api';

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
        setMessage({ type: 'success', text: 'Deal updated successfully!' });
      } else {
        await dealAPI.create(formData);
        setMessage({ type: 'success', text: 'Deal created successfully!' });
      }
      
      resetForm();
      fetchDeals(filterStatus);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error saving deal!' 
      });
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await dealAPI.delete(id);
        setMessage({ type: 'success', text: 'Deal deleted successfully!' });
        fetchDeals(filterStatus);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Error deleting deal!' 
        });
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
    } catch (error) {
      console.error('Error getting next deal number:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'completed': return '#3498db';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getProgressPercentage = (completed, total) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Deal Management</h1>
        {!showForm && (
          <button 
            onClick={handleCreateNewDeal}
            className="btn btn-primary"
          >
            + Create New Deal
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            {editingId ? 'Edit Deal' : 'Create New Deal'}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Party *</label>
                <select
                  value={formData.party}
                  onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                  required
                  disabled={editingId} // Can't change party in edit mode
                >
                  <option value="">Select Party</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.name} - {party.gstNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quality *</label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  required
                  disabled={editingId} // Can't change quality in edit mode
                >
                  <option value="">Select Quality</option>
                  {qualities.map((quality) => (
                    <option key={quality._id} value={quality._id}>
                      {quality.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Rate Per Meter (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ratePerMeter}
                  onChange={(e) => setFormData({ ...formData, ratePerMeter: e.target.value })}
                  placeholder="Enter rate per meter"
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Total Bilties (Complete Challans) *</label>
                <input
                  type="number"
                  value={formData.totalBilties}
                  onChange={(e) => setFormData({ ...formData, totalBilties: e.target.value })}
                  placeholder="Enter total number of bilties"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this deal"
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success">
                {editingId ? 'Update Deal' : 'Create Deal'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">Filter Deals</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleFilterChange('all')}
            className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'} btn-small`}
          >
            All ({deals.length})
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`btn ${filterStatus === 'active' ? 'btn-primary' : 'btn-secondary'} btn-small`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`btn ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'} btn-small`}
          >
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('cancelled')}
            className={`btn ${filterStatus === 'cancelled' ? 'btn-primary' : 'btn-secondary'} btn-small`}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Deal #</th>
              <th>Party</th>
              <th>Quality</th>
              <th>Rate/Meter</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const progress = getProgressPercentage(deal.completedBilties, deal.totalBilties);
              
              return (
                <tr key={deal._id}>
                  <td><strong>#{deal.dealNumber}</strong></td>
                  <td>{deal.partyDetails?.name}</td>
                  <td>{deal.qualityDetails?.name}</td>
                  <td><strong>₹{deal.ratePerMeter}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        flex: 1,
                        height: '20px',
                        background: '#e0e0e0',
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: progress === 100 ? '#27ae60' : '#3498db',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {deal.completedBilties}/{deal.totalBilties}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: getStatusBadgeColor(deal.status),
                      color: 'white',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase'
                    }}>
                      {deal.status}
                    </span>
                  </td>
                  <td>{new Date(deal.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/deal/${deal._id}`)}
                      className="btn btn-primary btn-small"
                      style={{ marginRight: '0.5rem' }}
                    >
                      View Details
                    </button>
                    {deal.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleEdit(deal)}
                          className="btn btn-secondary btn-small"
                          style={{ marginRight: '0.5rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/deal/${deal._id}/create-challan`)}
                          className="btn btn-success btn-small"
                          style={{ marginRight: '0.5rem' }}
                        >
                          Create Challan
                        </button>
                      </>
                    )}
                    {deal.challanIds?.length === 0 && deal.invoiceIds?.length === 0 && (
                      <button
                        onClick={() => handleDelete(deal._id)}
                        className="btn btn-danger btn-small"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {deals.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
            No deals found.
          </p>
        )}
      </div>
    </div>
  );
}

export default DealManagement;