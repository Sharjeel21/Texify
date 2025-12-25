//fronend/src/pages/TaxInvoice.js
import React, { useState, useEffect, useCallback } from 'react';
import { partyAPI, qualityAPI, deliveryChallanAPI, taxInvoiceAPI, dealAPI } from '../services/api';

function TaxInvoice() {
  const [parties, setParties] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [availableChallans, setAvailableChallans] = useState([]);
  const [invoiceMode, setInvoiceMode] = useState('manual'); // 'manual' or 'deal'
  const [selectedDeal, setSelectedDeal] = useState(null);
  
  const [formData, setFormData] = useState({
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    party: '',
    quality: '',
    dealId: '',
    challanIds: [],
    ratePerMeter: '',
    discountPercentage: 0,
  });
  const [selectedParty, setSelectedParty] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [calculations, setCalculations] = useState({
    totalPieces: 0,
    totalMeters: 0,
    totalBales: 0,
    subtotal: 0,
    discountedRate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    roundOff: 0,
    totalAmount: 0,
  });

  // Helper function to remove trailing zeros
  const formatNumber = (num) => {
    return parseFloat(num.toFixed(10)).toString();
  };

  const fetchAvailableChallans = useCallback(async () => {
    if (!formData.quality) return;
    try {
      const response = await deliveryChallanAPI.getAvailable(formData.quality);
      setAvailableChallans(response.data);
    } catch (error) {
      console.error('Error fetching available challans:', error);
    }
  }, [formData.quality]);

  const calculateTotals = useCallback(() => {
    if (formData.challanIds.length === 0) {
      setCalculations({
        totalPieces: 0,
        totalMeters: 0,
        totalBales: 0,
        subtotal: 0,
        discountedRate: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        roundOff: 0,
        totalAmount: 0,
      });
      return;
    }

    let totalPieces = 0;
    let totalMeters = 0;
    let totalBales = 0;

    formData.challanIds.forEach(challanId => {
      const challan = availableChallans.find(c => c._id === challanId);
      if (challan) {
        totalBales += challan.bales.length;
        challan.bales.forEach(bale => {
          totalPieces += bale.numberOfPieces;
          totalMeters += bale.totalMeter;
        });
      }
    });

    const ratePerMeter = parseFloat(formData.ratePerMeter) || 0;
    const discountPercentage = parseFloat(formData.discountPercentage) || 0;

    // Calculate discounted rate (this is what will be shown on bill)
    const discountedRate = ratePerMeter - (ratePerMeter * discountPercentage / 100);
    
    // Calculate subtotal using discounted rate directly
    const subtotal = totalMeters * discountedRate;

    let cgst = 0, sgst = 0, igst = 0;
    const gstRate = 0.05; // 5%

    if (selectedParty) {
      if (selectedParty.stateCode !== '27') {
        igst = subtotal * gstRate;
      } else {
        cgst = (subtotal * gstRate) / 2;
        sgst = (subtotal * gstRate) / 2;
      }
    }

    // Calculate total with 2 decimal places
    const totalBeforeRounding = subtotal + cgst + sgst + igst;
    const totalAmount = Math.round(totalBeforeRounding);
    const roundOff = totalAmount - totalBeforeRounding;

    setCalculations({
      totalPieces,
      totalMeters: formatNumber(totalMeters),
      totalBales,
      subtotal: subtotal.toFixed(2),
      discountedRate: formatNumber(discountedRate),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2),
      roundOff: roundOff.toFixed(2),
      totalAmount: totalAmount,
    });
  }, [formData.challanIds, formData.ratePerMeter, formData.discountPercentage, selectedParty, availableChallans]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAvailableChallans();
  }, [fetchAvailableChallans]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const fetchInitialData = async () => {
    try {
      const [partiesRes, qualitiesRes, dealsRes, billNumberRes] = await Promise.all([
        partyAPI.getAll(),
        qualityAPI.getAll(),
        dealAPI.getActive(),
        taxInvoiceAPI.getNextBillNumber(),
      ]);
      setParties(partiesRes.data);
      setQualities(qualitiesRes.data);
      setDeals(dealsRes.data);
      setFormData((prev) => ({ ...prev, billNumber: billNumberRes.data.nextBillNumber }));
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleModeChange = (mode) => {
    setInvoiceMode(mode);
    setSelectedDeal(null);
    setFormData({
      ...formData,
      party: '',
      quality: '',
      dealId: '',
      challanIds: [],
      ratePerMeter: '',
      discountPercentage: 0,
    });
    setSelectedParty(null);
    setAvailableChallans([]);
  };

  const handleDealChange = (dealId) => {
    const deal = deals.find(d => d._id === dealId);
    if (deal) {
      setSelectedDeal(deal);
      const party = parties.find(p => p._id === deal.party._id);
      setSelectedParty(party || deal.party);
      
      setFormData({
        ...formData,
        dealId: dealId,
        party: deal.party._id,
        quality: deal.quality._id,
        ratePerMeter: deal.ratePerMeter,
        discountPercentage: 0,
        challanIds: []
      });
    }
  };

  const handlePartyChange = (partyId) => {
    const party = parties.find((p) => p._id === partyId);
    setSelectedParty(party);
    setFormData({ ...formData, party: partyId });
  };

  const handleQualityChange = (qualityId) => {
    setFormData({ 
      ...formData, 
      quality: qualityId,
      challanIds: []
    });
    setAvailableChallans([]);
  };

  const toggleChallanSelection = (challanId) => {
    const isSelected = formData.challanIds.includes(challanId);
    
    if (isSelected) {
      setFormData({
        ...formData,
        challanIds: formData.challanIds.filter(id => id !== challanId)
      });
    } else {
      if (formData.challanIds.length >= 2) {
        setMessage({ type: 'error', text: 'Maximum 2 delivery challans can be selected for one invoice!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }
      
      setFormData({
        ...formData,
        challanIds: [...formData.challanIds, challanId]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.challanIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one delivery challan!' });
      return;
    }

    try {
      const submitData = {
        ...formData,
        discountedRate: parseFloat(calculations.discountedRate),
        roundOff: parseFloat(calculations.roundOff)
      };

      await taxInvoiceAPI.create(submitData);

      setMessage({ type: 'success', text: 'Tax Invoice created successfully!' });
      
      // Reset form
      setFormData({
        billNumber: parseInt(formData.billNumber) + 1,
        date: new Date().toISOString().split('T')[0],
        party: '',
        quality: '',
        dealId: '',
        challanIds: [],
        ratePerMeter: '',
        discountPercentage: 0,
      });
      setSelectedParty(null);
      setSelectedDeal(null);
      setAvailableChallans([]);
      
      // Refresh deals if in deal mode
      if (invoiceMode === 'deal') {
        const dealsRes = await dealAPI.getActive();
        setDeals(dealsRes.data);
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error creating tax invoice!' 
      });
      console.error(error);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Create Tax Invoice</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Invoice Mode Selection */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">Select Invoice Mode</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleModeChange('manual')}
            className={`btn ${invoiceMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: '1', minWidth: '200px' }}
          >
            📝 Manual Invoice
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.9 }}>
              Select party, quality, and rate manually
            </div>
          </button>
          <button
            onClick={() => handleModeChange('deal')}
            className={`btn ${invoiceMode === 'deal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: '1', minWidth: '200px' }}
          >
            🤝 Deal-Based Invoice
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.9 }}>
              Use pre-configured deal settings
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">Invoice Details</div>
          
          <div className="grid-2">
            <div className="form-group">
              <label>Bill Number *</label>
              <input
                type="number"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Deal-Based Invoice Form */}
          {invoiceMode === 'deal' && (
            <div className="form-group">
              <label>Select Deal *</label>
              <select
                value={formData.dealId}
                onChange={(e) => handleDealChange(e.target.value)}
                required
              >
                <option value="">Select Deal</option>
                {deals.map((deal) => (
                  <option key={deal._id} value={deal._id}>
                    Deal #{deal.dealNumber} - {deal.partyDetails?.name} - {deal.qualityDetails?.name} - ₹{deal.ratePerMeter}/meter
                    ({deal.completedBilties}/{deal.totalBilties} bilties)
                  </option>
                ))}
              </select>
              {deals.length === 0 && (
                <small style={{ color: '#e74c3c', display: 'block', marginTop: '0.5rem' }}>
                  No active deals found. Create a deal first to use this mode.
                </small>
              )}
            </div>
          )}

          {/* Manual Invoice Form */}
          {invoiceMode === 'manual' && (
            <>
              <div className="form-group">
                <label>Party *</label>
                <select
                  value={formData.party}
                  onChange={(e) => handlePartyChange(e.target.value)}
                  required
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
                  onChange={(e) => handleQualityChange(e.target.value)}
                  required
                >
                  <option value="">Select Quality</option>
                  {qualities.map((quality) => (
                    <option key={quality._id} value={quality._id}>
                      {quality.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Deal Info Display */}
          {selectedDeal && (
            <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '4px', marginTop: '1rem' }}>
              <strong>Deal Information:</strong>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Party:</strong> {selectedDeal.partyDetails?.name}<br />
                <strong>Quality:</strong> {selectedDeal.qualityDetails?.name}<br />
                <strong>Rate:</strong> ₹{selectedDeal.ratePerMeter} per meter<br />
                <strong>Progress:</strong> {selectedDeal.completedBilties}/{selectedDeal.totalBilties} bilties completed
              </p>
            </div>
          )}

          {/* Party Info Display for Manual Mode */}
          {selectedParty && invoiceMode === 'manual' && (
            <div style={{ padding: '1rem', background: '#ecf0f1', borderRadius: '4px', marginTop: '1rem' }}>
              <strong>Party Details:</strong>
              <p style={{ margin: '0.5rem 0' }}>{selectedParty.address}</p>
              <p style={{ margin: '0.5rem 0' }}>
                State: {selectedParty.state} (Code: {selectedParty.stateCode})
              </p>
              <p style={{ margin: '0.5rem 0' }}>GST: {selectedParty.gstNumber}</p>
            </div>
          )}
        </div>

        {formData.quality && availableChallans.length > 0 && (
          <div className="card">
            <div className="card-header">
              Select Delivery Challans (Max 2) - {formData.challanIds.length} selected
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#666' }}>
                Click on delivery challans to select them for this invoice. Maximum 2 challans can be selected.
              </p>
            </div>

            {availableChallans.map((challan) => {
              const isSelected = formData.challanIds.includes(challan._id);
              const totalPieces = challan.bales.reduce((sum, b) => sum + b.numberOfPieces, 0);
              const totalMeters = challan.bales.reduce((sum, b) => sum + b.totalMeter, 0);
              
              return (
                <div
                  key={challan._id}
                  className={`stock-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleChallanSelection(challan._id)}
                  style={{ marginBottom: '0.5rem' }}
                >
                  <div>
                    <strong>{challan.challanNumber}</strong>
                    <span style={{ marginLeft: '1rem', fontSize: '0.875rem' }}>
                      Created: {new Date(challan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    Bales: {challan.bales.length} | 
                    Pieces: {totalPieces} | 
                    Meters: {formatNumber(totalMeters)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {formData.quality && availableChallans.length === 0 && (
          <div className="alert alert-info">
            No complete delivery challans available for selected quality.
          </div>
        )}

        {formData.challanIds.length > 0 && (
          <>
            {/* Only show pricing input for manual mode */}
            {invoiceMode === 'manual' && (
              <div className="card">
                <div className="card-header">Pricing</div>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label>Rate Per Meter *</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.ratePerMeter}
                      onChange={(e) => setFormData({ ...formData, ratePerMeter: e.target.value })}
                      placeholder="Enter rate per meter"
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Discount % (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                      placeholder="Enter discount percentage"
                    />
                    <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                      For internal calculation only - not shown on invoice
                    </small>
                  </div>
                </div>

                {parseFloat(formData.discountPercentage) > 0 && (
                  <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '4px', marginTop: '1rem' }}>
                    <strong>Final Rate (after {formData.discountPercentage}% discount):</strong>
                    <p style={{ margin: '0.5rem 0', fontSize: '1.25rem', color: '#2e7d32' }}>
                      ₹{calculations.discountedRate} per meter
                    </p>
                    <small style={{ color: '#666' }}>This is the rate that will be printed on the invoice</small>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div className="card-header">Invoice Summary</div>
              
              <div className="invoice-totals">
                <div>
                  <span>Total Challans:</span>
                  <strong>{formData.challanIds.length}</strong>
                </div>
                <div>
                  <span>Total Bales:</span>
                  <strong>{calculations.totalBales}</strong>
                </div>
                <div>
                  <span>Total Pieces:</span>
                  <strong>{calculations.totalPieces}</strong>
                </div>
                <div>
                  <span>Total Meters:</span>
                  <strong>{calculations.totalMeters}</strong>
                </div>
                <div>
                  <span>Rate Per Meter:</span>
                  <strong>₹{calculations.discountedRate}</strong>
                </div>
                <div>
                  <span>Amount Before Tax:</span>
                  <strong>₹{calculations.subtotal}</strong>
                </div>
                {parseFloat(calculations.cgst) > 0 && (
                  <>
                    <div>
                      <span>CGST (2.5%):</span>
                      <strong>₹{calculations.cgst}</strong>
                    </div>
                    <div>
                      <span>SGST (2.5%):</span>
                      <strong>₹{calculations.sgst}</strong>
                    </div>
                  </>
                )}
                {parseFloat(calculations.igst) > 0 && (
                  <div>
                    <span>IGST (5%):</span>
                    <strong>₹{calculations.igst}</strong>
                  </div>
                )}
                <div>
                  <span>Round Off:</span>
                  <strong>{parseFloat(calculations.roundOff) >= 0 ? '+' : ''} ₹{calculations.roundOff}</strong>
                </div>
                <div className="total-amount">
                  <span>Total Amount:</span>
                  <strong>₹{calculations.totalAmount}</strong>
                </div>
              </div>
            </div>
          </>
        )}

        <button type="submit" className="btn btn-success" style={{ marginTop: '1rem' }}>
          Create Tax Invoice
        </button>
      </form>
    </div>
  );
}

export default TaxInvoice;