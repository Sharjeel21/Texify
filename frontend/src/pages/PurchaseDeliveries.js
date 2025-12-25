// frontend/src/pages/PurchaseDeliveries.js
import React, { useState, useEffect } from 'react';
import { purchaseDeliveryAPI, purchaseAPI } from '../services/api';

const PurchaseDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    purchase: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    actualWeight: '',
    deductFromDeal: '',
    supplierChallanNumber: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'RTGS',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
    notes: ''
  });

  useEffect(() => {
    loadDeliveries();
    loadPurchases();
  }, []);

  const loadDeliveries = async () => {
    try {
      const response = await purchaseDeliveryAPI.getAll();
      setDeliveries(response.data);
    } catch (error) {
      alert('Failed to load deliveries');
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await purchaseAPI.getAll();
      setPurchases(response.data.filter(p => 
        p.status !== 'completed' && 
        (p.remainingApproxQuantity || 0) > 0
      ));
    } catch (error) {
      alert('Failed to load purchases');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await purchaseDeliveryAPI.create(formData);
      resetForm();
      loadDeliveries();
      loadPurchases();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save delivery');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await purchaseDeliveryAPI.updatePayment(selectedDelivery._id, paymentData);
      setShowPaymentModal(false);
      setSelectedDelivery(null);
      setPaymentData({ amountPaid: '' });
      loadDeliveries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        await purchaseDeliveryAPI.delete(id);
        loadDeliveries();
        loadPurchases();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete delivery');
      }
    }
  };

  const openPaymentModal = (delivery) => {
    setSelectedDelivery(delivery);
    setPaymentData({ 
      amount: delivery.pendingAmount.toFixed(2),
      paymentMethod: 'RTGS',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      chequeNumber: '',
      chequeDate: '',
      bankName: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const resetForm = () => {
    setFormData({
      purchase: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      actualWeight: '',
      deductFromDeal: '',
      supplierChallanNumber: '',
      notes: ''
    });
    setShowForm(false);
  };

  const selectedPurchase = purchases.find(p => p._id === formData.purchase);

  const filteredDeliveries = filterStatus === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.paymentStatus === filterStatus);

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: 'badge-error',
      partial: 'badge-warning',
      paid: 'badge-success'
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Purchase Deliveries</h1>
            <p className="page-subtitle">Record actual weights and track payments</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Record Delivery
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Yarn Delivery</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                  <label className="form-label">Purchase Order *</label>
                  <select
                    className="form-control"
                    value={formData.purchase}
                    onChange={(e) => setFormData({...formData, purchase: e.target.value})}
                    required
                  >
                    <option value="">Select Purchase Order</option>
                    {purchases.map(purchase => (
                      <option key={purchase._id} value={purchase._id}>
                        PO#{purchase.purchaseNumber} - {purchase.partyName} - {purchase.yarnType} {purchase.yarnQuality} 
                        (Remaining: {purchase.remainingApproxQuantity.toFixed(3)}T)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPurchase && (
                  <div className="card card-premium mb-3">
                    <div className="card-body">
                      <h4 className="card-title">Purchase Details</h4>
                      <div className="document-info">
                        <div className="document-info-item">
                          <span className="document-info-label">Party</span>
                          <span className="document-info-value">{selectedPurchase.partyName}</span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Yarn</span>
                          <span className="document-info-value">{selectedPurchase.yarnType} - {selectedPurchase.yarnQuality}</span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Rate per Kg</span>
                          <span className="document-info-value">₹{selectedPurchase.ratePerKg}</span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Godown Charges</span>
                          <span className="document-info-value">₹{selectedPurchase.godownChargesPerKg}/kg</span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Deal Quantity</span>
                          <span className="document-info-value">{selectedPurchase.approxQuantity} Tons</span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Remaining</span>
                          <span className="document-info-value text-warning-bold">{selectedPurchase.remainingApproxQuantity.toFixed(3)} Tons</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Delivery Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Actual Weight Received (Tons) *</label>
                    <input
                      type="number"
                      step="0.001"
                      className="form-control"
                      value={formData.actualWeight}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData, 
                          actualWeight: value,
                          deductFromDeal: value
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="e.g., 2.378"
                      required
                    />
                    <small style={{color: 'var(--text-secondary)'}}>
                      Exact weight for payment calculation
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deduct from Deal (Tons) *</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-control"
                    value={formData.deductFromDeal}
                    onChange={(e) => setFormData({...formData, deductFromDeal: e.target.value})}
                    onClick={(e) => e.stopPropagation()}
                    max={selectedPurchase?.remainingApproxQuantity}
                    placeholder="e.g., 2.000"
                    required
                  />
                  <small style={{color: 'var(--text-secondary)'}}>
                    Amount to deduct from purchase deal (can differ from actual weight)
                  </small>
                </div>

                {selectedPurchase && formData.actualWeight && formData.deductFromDeal && (
                  <div className="card card-success mb-3">
                    <div className="card-body">
                      <h4 className="card-title">Delivery Summary</h4>
                      <div className="document-info">
                        <div className="document-info-item">
                          <span className="document-info-label">Actual Weight (Payment)</span>
                          <span className="document-info-value text-success-bold">
                            {parseFloat(formData.actualWeight).toFixed(3)} T
                          </span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Deduct from Deal</span>
                          <span className="document-info-value text-warning-bold">
                            {parseFloat(formData.deductFromDeal).toFixed(3)} T
                          </span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Remaining Deal After</span>
                          <span className="document-info-value">
                            {(selectedPurchase.remainingApproxQuantity - parseFloat(formData.deductFromDeal)).toFixed(3)} T
                          </span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Gross Amount</span>
                          <span className="document-info-value">
                            ₹{(parseFloat(formData.actualWeight) * 1000 * selectedPurchase.ratePerKg).toFixed(2)}
                          </span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Godown Charges</span>
                          <span className="document-info-value text-warning-bold">
                            - ₹{(parseFloat(formData.actualWeight) * 1000 * selectedPurchase.godownChargesPerKg).toFixed(2)}
                          </span>
                        </div>
                        <div className="document-info-item">
                          <span className="document-info-label">Net Payable</span>
                          <span className="document-info-value text-success-bold" style={{fontSize: '1.25rem'}}>
                            ₹{((parseFloat(formData.actualWeight) * 1000 * selectedPurchase.ratePerKg) - 
                               (parseFloat(formData.actualWeight) * 1000 * selectedPurchase.godownChargesPerKg)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Supplier Challan Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.supplierChallanNumber}
                    onChange={(e) => setFormData({...formData, supplierChallanNumber: e.target.value})}
                    placeholder="Paper challan number from supplier"
                  />
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
                    Record Delivery
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedDelivery && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="card card-premium mb-3">
                <div className="card-body">
                  <h4 className="card-title">Delivery Summary</h4>
                  <div className="document-info">
                    <div className="document-info-item">
                      <span className="document-info-label">Delivery #</span>
                      <span className="document-info-value">{selectedDelivery.deliveryNumber}</span>
                    </div>
                    <div className="document-info-item">
                      <span className="document-info-label">Actual Weight</span>
                      <span className="document-info-value">{selectedDelivery.actualWeight.toFixed(3)} T</span>
                    </div>
                    <div className="document-info-item">
                      <span className="document-info-label">Net Payable</span>
                      <span className="document-info-value text-success-bold">
                        ₹{selectedDelivery.netAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="document-info-item">
                      <span className="document-info-label">Already Paid</span>
                      <span className="document-info-value">₹{selectedDelivery.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="document-info-item">
                      <span className="document-info-label">Pending Amount</span>
                      <span className="document-info-value text-error" style={{fontSize: '1.25rem'}}>
                        ₹{selectedDelivery.pendingAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDelivery.payments && selectedDelivery.payments.length > 0 && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h4 className="card-title">Payment History</h4>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Details</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDelivery.payments.map((payment, index) => (
                            <tr key={index}>
                              <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                              <td><span className="badge badge-info">{payment.paymentMethod}</span></td>
                              <td>
                                {payment.paymentMethod === 'Cheque' && (
                                  <div style={{fontSize: '0.85rem'}}>
                                    <div>Cheque: {payment.chequeNumber}</div>
                                    <div>Date: {new Date(payment.chequeDate).toLocaleDateString()}</div>
                                    {payment.bankName && <div>Bank: {payment.bankName}</div>}
                                  </div>
                                )}
                                {payment.paymentMethod === 'RTGS' && (
                                  <div style={{fontSize: '0.85rem'}}>
                                    <div>TXN: {payment.transactionId}</div>
                                  </div>
                                )}
                                {payment.notes && <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{payment.notes}</div>}
                              </td>
                              <td className="text-success-bold">₹{payment.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={paymentData.paymentDate}
                      onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                      onClick={(e) => e.stopPropagation()}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      onClick={(e) => e.stopPropagation()}
                      max={selectedDelivery.pendingAmount}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select
                    className="form-control"
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                    required
                  >
                    <option value="RTGS">RTGS/NEFT/UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {paymentData.paymentMethod === 'RTGS' && (
                  <div className="form-group">
                    <label className="form-label">Transaction ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="e.g., RTGS123456789"
                      required
                    />
                  </div>
                )}

                {paymentData.paymentMethod === 'Cheque' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Cheque Number *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.chequeNumber}
                          onChange={(e) => setPaymentData({...paymentData, chequeNumber: e.target.value})}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="e.g., 123456"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Cheque Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={paymentData.chequeDate}
                          onChange={(e) => setPaymentData({...paymentData, chequeDate: e.target.value})}
                          onClick={(e) => e.stopPropagation()}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={paymentData.bankName}
                        onChange={(e) => setPaymentData({...paymentData, bankName: e.target.value})}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="e.g., HDFC Bank"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    onClick={(e) => e.stopPropagation()}
                    rows="2"
                    placeholder="Any additional notes"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Deliveries</span>
          <div className="flex items-center gap-2">
            <label className="form-label" style={{marginBottom: 0}}>Filter:</label>
            <select 
              className="form-control"
              style={{width: 'auto', minWidth: '150px'}}
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Payment</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Del #</th>
                <th>PO #</th>
                <th>Party</th>
                <th>Yarn</th>
                <th>Date</th>
                <th>Actual Weight</th>
                <th>Deducted</th>
                <th>Gross</th>
                <th>Godown</th>
                <th>Net Payable</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center">
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-title">No Deliveries Found</div>
                      <div className="empty-state-description">
                        Record your first delivery to get started
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map(delivery => {
                  const actualWeight = delivery.actualWeight || 0;
                  const deductFromDeal = delivery.deductFromDeal || actualWeight;
                  const grossAmount = delivery.grossAmount || 0;
                  const godownCharges = delivery.godownCharges || 0;
                  const netAmount = delivery.netAmount || 0;
                  const amountPaid = delivery.amountPaid || 0;
                  const pendingAmount = delivery.pendingAmount !== undefined 
                    ? delivery.pendingAmount 
                    : (netAmount - amountPaid);
                  
                  return (
                    <tr key={delivery._id}>
                      <td><strong>#{delivery.deliveryNumber}</strong></td>
                      <td>PO#{delivery.purchase.purchaseNumber}</td>
                      <td>{delivery.purchase.partyName}</td>
                      <td>{delivery.purchase.yarnType} {delivery.purchase.yarnQuality}</td>
                      <td>{new Date(delivery.deliveryDate).toLocaleDateString()}</td>
                      <td className="text-success-bold"><strong>{actualWeight.toFixed(3)} T</strong></td>
                      <td className="text-warning-bold">{deductFromDeal.toFixed(3)} T</td>
                      <td>₹{grossAmount.toFixed(2)}</td>
                      <td className="text-warning-bold">₹{godownCharges.toFixed(2)}</td>
                      <td className="text-success-bold"><strong>₹{netAmount.toFixed(2)}</strong></td>
                      <td>₹{amountPaid.toFixed(2)}</td>
                      <td className="text-error"><strong>₹{pendingAmount.toFixed(2)}</strong></td>
                      <td>{new Date(delivery.paymentDueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadge(delivery.paymentStatus)}`}>
                          {delivery.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => openPaymentModal(delivery)}
                          >
                            Payment
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleDelete(delivery._id)}
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

export default PurchaseDeliveries;