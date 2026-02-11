// frontend/src/pages/TaxInvoice.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  partyAPI, 
  qualityAPI, 
  deliveryChallanAPI, 
  taxInvoiceAPI, 
  dealAPI 
} from '../services/api';
import { 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Package,
  Briefcase,
  Calculator
} from 'lucide-react';
import { ResponsiveFormRow } from '../components/ResponsiveForm';

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
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      const submitData = {
        ...formData,
        discountedRate: parseFloat(calculations.discountedRate),
        roundOff: parseFloat(calculations.roundOff)
      };

      await taxInvoiceAPI.create(submitData);

      setMessage({ type: 'success', text: '✓ Tax Invoice created successfully!' });
      
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
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
          Create Tax Invoice
        </h1>
        <p className="text-base text-gray-600 font-medium">
          Generate a new tax invoice from delivery challans
        </p>
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

      {/* Invoice Mode Selection */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Select Invoice Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeChange('manual')}
            className={`group relative p-6 rounded-lg border-2 transition-all text-left ${
              invoiceMode === 'manual'
                ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md'
                : 'border-gray-300 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                invoiceMode === 'manual'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                  : 'bg-gray-200'
              }`}>
                <FileText className={`w-6 h-6 ${
                  invoiceMode === 'manual' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Manual Invoice</h3>
                <p className="text-sm text-gray-600">
                  Select party, quality, and rate manually
                </p>
              </div>
            </div>
            {invoiceMode === 'manual' && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleModeChange('deal')}
            className={`group relative p-6 rounded-lg border-2 transition-all text-left ${
              invoiceMode === 'deal'
                ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md'
                : 'border-gray-300 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                invoiceMode === 'deal'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                  : 'bg-gray-200'
              }`}>
                <Briefcase className={`w-6 h-6 ${
                  invoiceMode === 'deal' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Deal-Based Invoice</h3>
                <p className="text-sm text-gray-600">
                  Use pre-configured deal settings
                </p>
              </div>
            </div>
            {invoiceMode === 'deal' && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Invoice Details
          </h2>
          
          <ResponsiveFormRow>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Bill Number *
              </label>
              <input
                type="number"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </div>
          </ResponsiveFormRow>

          {/* Deal-Based Invoice Form */}
          {invoiceMode === 'deal' && (
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-semibold text-gray-700">
                Select Deal *
              </label>
              <select
                value={formData.dealId}
                onChange={(e) => handleDealChange(e.target.value)}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
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
                <p className="text-sm text-red-600 mt-1">
                  No active deals found. Create a deal first to use this mode.
                </p>
              )}
            </div>
          )}

          {/* Manual Invoice Form */}
          {invoiceMode === 'manual' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Party *
                </label>
                <select
                  value={formData.party}
                  onChange={(e) => handlePartyChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                >
                  <option value="">Select Party</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.name} - {party.gstNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Quality *
                </label>
                <select
                  value={formData.quality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
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
          )}

          {/* Deal Info Display */}
          {selectedDeal && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200 p-4 mt-4">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                Deal Information
              </h3>
              <div className="text-sm space-y-1">
                <p><strong>Party:</strong> {selectedDeal.partyDetails?.name}</p>
                <p><strong>Quality:</strong> {selectedDeal.qualityDetails?.name}</p>
                <p><strong>Rate:</strong> ₹{selectedDeal.ratePerMeter} per meter</p>
                <p><strong>Progress:</strong> {selectedDeal.completedBilties}/{selectedDeal.totalBilties} bilties completed</p>
              </div>
            </div>
          )}

          {/* Party Info Display for Manual Mode */}
          {selectedParty && invoiceMode === 'manual' && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 p-4 mt-4">
              <h3 className="font-bold text-gray-900 mb-2">Party Details</h3>
              <div className="text-sm space-y-1">
                <p>{selectedParty.address}</p>
                <p>State: {selectedParty.state} (Code: {selectedParty.stateCode})</p>
                <p>GST: {selectedParty.gstNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Available Challans */}
        {formData.quality && availableChallans.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Select Delivery Challans (Max 2)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {formData.challanIds.length} of 2 selected. Click on challans to select them.
            </p>

            <div className="space-y-3">
              {availableChallans.map((challan) => {
                const isSelected = formData.challanIds.includes(challan._id);
                const totalPieces = challan.bales.reduce((sum, b) => sum + b.numberOfPieces, 0);
                const totalMeters = challan.bales.reduce((sum, b) => sum + b.totalMeter, 0);
                
                return (
                  <div
                    key={challan._id}
                    onClick={() => toggleChallanSelection(challan._id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md'
                        : 'border-gray-300 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{challan.challanNumber}</h3>
                          <span className="text-sm text-gray-600">
                            Created: {new Date(challan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-gray-700">
                            <strong>Bales:</strong> {challan.bales.length}
                          </span>
                          <span className="text-gray-700">
                            <strong>Pieces:</strong> {totalPieces}
                          </span>
                          <span className="text-gray-700">
                            <strong>Meters:</strong> {formatNumber(totalMeters)}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {formData.quality && availableChallans.length === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>No complete delivery challans available for selected quality.</span>
          </div>
        )}

        {/* Pricing - Only for Manual Mode */}
        {formData.challanIds.length > 0 && invoiceMode === 'manual' && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Pricing
            </h2>
            
            <ResponsiveFormRow>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Rate Per Meter *
                </label>
                <input
                  type="number"
                  step="0.001"
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
                  Discount % (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  placeholder="Enter discount percentage"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                />
                <p className="text-sm text-gray-600">
                  For internal calculation only - not shown on invoice
                </p>
              </div>
            </ResponsiveFormRow>

            {parseFloat(formData.discountPercentage) > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-4 mt-4">
                <h3 className="font-bold text-green-800 mb-2">
                  Final Rate (after {formData.discountPercentage}% discount):
                </h3>
                <p className="text-2xl font-bold text-green-700">
                  ₹{calculations.discountedRate} per meter
                </p>
                <p className="text-sm text-green-700 mt-1">
                  This is the rate that will be printed on the invoice
                </p>
              </div>
            )}
          </div>
        )}

        {/* Invoice Summary */}
        {formData.challanIds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              Invoice Summary
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Challans:</span>
                <strong className="text-gray-900">{formData.challanIds.length}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Bales:</span>
                <strong className="text-gray-900">{calculations.totalBales}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Pieces:</span>
                <strong className="text-gray-900">{calculations.totalPieces}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Meters:</span>
                <strong className="text-gray-900">{calculations.totalMeters}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Rate Per Meter:</span>
                <strong className="text-gray-900">₹{calculations.discountedRate}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Amount Before Tax:</span>
                <strong className="text-gray-900">₹{calculations.subtotal}</strong>
              </div>
              {parseFloat(calculations.cgst) > 0 && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">CGST (2.5%):</span>
                    <strong className="text-gray-900">₹{calculations.cgst}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">SGST (2.5%):</span>
                    <strong className="text-gray-900">₹{calculations.sgst}</strong>
                  </div>
                </>
              )}
              {parseFloat(calculations.igst) > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">IGST (5%):</span>
                  <strong className="text-gray-900">₹{calculations.igst}</strong>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Round Off:</span>
                <strong className="text-gray-900">
                  {parseFloat(calculations.roundOff) >= 0 ? '+' : ''} ₹{calculations.roundOff}
                </strong>
              </div>
              <div className="flex justify-between py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-4 mt-2">
                <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                <strong className="text-2xl font-bold text-amber-700">₹{calculations.totalAmount}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {formData.challanIds.length > 0 && (
          <button 
            type="submit" 
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
          >
            <CheckCircle className="w-5 h-5" />
            Create Tax Invoice
          </button>
        )}
      </form>
    </div>
  );
}

export default TaxInvoice;