// frontend/src/pages/PurchaseManagement.js
import React, { useState, useEffect } from 'react';
import { purchaseAPI, partyAPI } from '../services/api';

const PurchaseManagement = () => {
  const [purchases, setPurchases] = useState([]);
  const [parties, setParties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
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
      alert('Failed to load purchases');
    }
  };

  const loadParties = async () => {
    try {
      const response = await partyAPI.getAll();
      setParties(response.data);
    } catch (error) {
      alert('Failed to load parties');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPurchase) {
        await purchaseAPI.update(editingPurchase._id, formData);
      } else {
        await purchaseAPI.create(formData);
      }
      resetForm();
      loadPurchases();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save purchase');
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
        loadPurchases();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete purchase');
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
      pending: 'badge-warning',
      partial: 'badge-info',
      completed: 'badge-success'
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Purchase Management</h1>
            <p className="page-subtitle">Manage yarn purchases with flexible weight tracking</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Purchase
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPurchase ? 'Edit Purchase' : 'New Purchase'}</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Party *</label>
                    <select
                      className="form-control"
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

                  <div className="form-group">
                    <label className="form-label">Purchase Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Yarn Type *</label>
                    <select
                      className="form-control"
                      value={formData.yarnType}
                      onChange={(e) => setFormData({...formData, yarnType: e.target.value})}
                      required
                    >
                      <option value="Roto">Roto</option>
                      <option value="Zeero">Zeero</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Yarn Quality *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.yarnQuality}
                      onChange={(e) => setFormData({...formData, yarnQuality: e.target.value})}
                      placeholder="e.g., 20s, 30s, 40s"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Approx. Quantity (Tons) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.approxQuantity}
                      onChange={(e) => setFormData({...formData, approxQuantity: e.target.value})}
                      placeholder="e.g., 10"
                      required
                    />
                    <small style={{color: 'var(--text-secondary)'}}>
                      Deal quantity (actual weight may vary)
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rate per Kg *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.ratePerKg}
                      onChange={(e) => setFormData({...formData, ratePerKg: e.target.value})}
                      placeholder="e.g., 112"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Godown Charges per Kg</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.godownChargesPerKg}
                      onChange={(e) => setFormData({...formData, godownChargesPerKg: e.target.value})}
                      placeholder="e.g., 1.65"
                    />
                    <small style={{color: 'var(--text-secondary)'}}>
                      Amount to deduct from payment
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Type *</label>
                    <select
                      className="form-control"
                      value={formData.paymentType}
                      onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                      required
                    >
                      <option value="Current">Current Payment</option>
                      <option value="Dhara">Dhara (Borrow)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Days *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.paymentDays}
                      onChange={(e) => setFormData({...formData, paymentDays: e.target.value})}
                      placeholder="e.g., 4, 5, 30, 40"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPurchase ? 'Update' : 'Create'} Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Purchases</span>
          <div className="flex items-center gap-2">
            <label className="form-label" style={{marginBottom: 0}}>Filter:</label>
            <select 
              className="form-control" 
              style={{width: 'auto', minWidth: '150px'}}
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Party</th>
                <th>Date</th>
                <th>Yarn</th>
                <th>Approx Qty</th>
                <th>Actual Weight</th>
                <th>Remaining</th>
                <th>Rate/Kg</th>
                <th>Godown ₹/Kg</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center">
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-title">No Purchases Found</div>
                      <div className="empty-state-description">
                        Create your first purchase order to get started
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => {
                  const totalActualWeight = purchase.totalActualWeight || 0;
                  const totalDeductedWeight = purchase.totalDeductedWeight || 0;
                  const approxQuantity = purchase.approxQuantity || 0;
                  const remainingQuantity = purchase.remainingApproxQuantity !== undefined 
                    ? purchase.remainingApproxQuantity 
                    : (approxQuantity - totalDeductedWeight);
                  const godownCharges = purchase.godownChargesPerKg || 0;
                  
                  return (
                    <tr key={purchase._id}>
                      <td><strong>#{purchase.purchaseNumber}</strong></td>
                      <td>{purchase.partyName}</td>
                      <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                      <td>{purchase.yarnType} {purchase.yarnQuality}</td>
                      <td>{approxQuantity} T</td>
                      <td className="text-success-bold">
                        {totalActualWeight.toFixed(3)} T
                        {totalActualWeight !== totalDeductedWeight && (
                          <span style={{fontSize: '0.85rem', display: 'block', color: 'var(--text-secondary)'}}>
                            Ded: {totalDeductedWeight.toFixed(3)}T
                          </span>
                        )}
                      </td>
                      <td className="text-warning-bold">{remainingQuantity.toFixed(3)} T</td>
                      <td>₹{purchase.ratePerKg}</td>
                      <td>{godownCharges > 0 ? `₹${godownCharges}` : '-'}</td>
                      <td>{purchase.paymentType} ({purchase.paymentDays}d)</td>
                      <td>
                        <span className={`badge ${getStatusBadge(purchase.status)}`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(purchase)}>
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleDelete(purchase._id)}
                            disabled={totalActualWeight > 0}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseManagement;