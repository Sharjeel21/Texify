// frontend/src/pages/DeliveryChallan.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qualityAPI, deliveryChallanAPI } from '../services/api';
import { FileText, Package, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';

function DeliveryChallan() {
  const navigate = useNavigate();
  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [incompleteChallans, setIncompleteChallans] = useState([]);
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

  const handleQualitySelect = async (quality) => {
    setSelectedQuality(quality);
    
    try {
      const response = await deliveryChallanAPI.getIncomplete(quality._id);
      setIncompleteChallans(response.data);
    } catch (error) {
      console.error('Error checking incomplete challans:', error);
      setIncompleteChallans([]);
    }
  };

  const createNewChallan = async (quality) => {
    try {
      const response = await deliveryChallanAPI.create({ quality: quality._id });
      navigate(`/delivery-challan/add-bales/${response.data._id}`);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating delivery challan!' });
      console.error(error);
    }
  };

  const continueExisting = (challan) => {
    navigate(`/delivery-challan/add-bales/${challan._id}`, {
      state: { isIncomplete: true }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
          Create Delivery Challan
        </h1>
        <p className="text-base text-gray-600 font-medium">
          Select quality to start a new challan or continue an incomplete one
        </p>
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

      {/* Quality Selection View */}
      {!selectedQuality && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Quality</h2>
              <p className="text-sm text-gray-600">
                Choose the quality for your delivery challan
              </p>
            </div>
          </div>
          
          {qualities.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Qualities Found</h3>
              <p className="text-gray-600 mb-4">Please add qualities first before creating challans.</p>
              <button
                onClick={() => navigate('/qualities')}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
              >
                Go to Quality Management
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {qualities.map((quality) => (
                <button
                  key={quality._id}
                  onClick={() => handleQualitySelect(quality)}
                  className="group bg-gradient-to-br from-white to-amber-50 rounded-xl p-6 border-2 border-gray-200 hover:border-amber-400 transition-all duration-200 hover:shadow-lg text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                    {quality.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Bales per Challan:</span>
                      <span className="font-semibold text-gray-900">{quality.balesPerChallan}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pieces per Bale:</span>
                      <span className="font-semibold text-gray-900">{quality.piecesPerBale}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Quality View */}
      {selectedQuality && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedQuality(null)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-amber-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Quality Selection
          </button>

          {/* Incomplete Challans Alert */}
          {incompleteChallans.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    Incomplete Delivery Challans Found
                  </h3>
                  <p className="text-amber-800 mb-4">
                    You have {incompleteChallans.length} incomplete challan(s) for <strong>{selectedQuality.name}</strong>. 
                    Click on a challan below to continue working on it.
                  </p>

                  <div className="space-y-3">
                    {incompleteChallans.map((challan) => (
                      <button
                        key={challan._id}
                        onClick={() => continueExisting(challan)}
                        className="w-full bg-white rounded-lg p-4 border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-md text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-gray-900 text-lg">
                                {challan.challanNumber}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300">
                                INCOMPLETE
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p className="flex items-center gap-2">
                                <span className="font-semibold">Progress:</span>
                                <span className="text-amber-700 font-bold">
                                  {challan.completedBalesCount} / {challan.expectedBalesCount} bales
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="font-semibold">Created:</span>
                                {new Date(challan.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-amber-600 group-hover:text-amber-700 font-semibold">
                            Continue
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create New Challan Card */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Start New Delivery Challan
                </h3>
                <p className="text-gray-700 mb-4">
                  Create a new delivery challan for <strong className="text-amber-700">{selectedQuality.name}</strong>
                </p>

                {/* Quality Details */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 mb-4 border border-amber-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 block mb-1">Quality Name</span>
                      <span className="font-bold text-gray-900">{selectedQuality.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Bales per Challan</span>
                      <span className="font-bold text-gray-900">{selectedQuality.balesPerChallan}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Pieces per Bale</span>
                      <span className="font-bold text-gray-900">{selectedQuality.piecesPerBale}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Current Bale #</span>
                      <span className="font-bold text-blue-700">{selectedQuality.currentBaleNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Current Challan #</span>
                      <span className="font-bold text-green-700">{selectedQuality.currentChallanNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">HSN Code</span>
                      <span className="font-mono font-semibold text-gray-900">{selectedQuality.hsnCode}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => createNewChallan(selectedQuality)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto"
                >
                  <FileText className="w-5 h-5" />
                  Create New Challan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryChallan;