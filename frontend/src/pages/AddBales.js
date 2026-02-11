// frontend/src/pages/AddBales.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { deliveryChallanAPI } from '../services/api';
import { Save, X, Plus, Trash2, Edit, AlertCircle, CheckCircle, Package } from 'lucide-react';

function AddBales() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [challan, setChallan] = useState(null);
  const [existingBales, setExistingBales] = useState([]);
  const [newBales, setNewBales] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [editingBaleId, setEditingBaleId] = useState(null);
  const [showIncompleteNotification, setShowIncompleteNotification] = useState(false);

  useEffect(() => {
    fetchChallan();
    
    if (location.state?.isIncomplete) {
      setShowIncompleteNotification(true);
      setTimeout(() => setShowIncompleteNotification(false), 5000);
    }
  }, [id]);

  const fetchChallan = async () => {
    try {
      const response = await deliveryChallanAPI.getById(id);
      setChallan(response.data);
      setExistingBales(response.data.bales);
      
      initializeNewBales(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching challan:', error);
      setMessage({ type: 'error', text: 'Error loading challan!' });
      setLoading(false);
    }
  };

  const initializeNewBales = (challanData) => {
    const initialBales = [{
      date: new Date().toISOString().split('T')[0],
      cloths: Array(challanData.expectedPiecesPerBale).fill(null).map(() => ({
        meter: '',
        weight: ''
      }))
    }];
    
    setNewBales(initialBales);
  };

  const addNewBale = () => {
    if (!challan) return;
    
    const remainingBales = challan.expectedBalesCount - challan.completedBalesCount - newBales.length;
    
    if (remainingBales <= 0) {
      setMessage({ type: 'error', text: 'Maximum bales reached!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }

    setNewBales([
      ...newBales,
      {
        date: new Date().toISOString().split('T')[0],
        cloths: Array(challan.expectedPiecesPerBale).fill(null).map(() => ({
          meter: '',
          weight: ''
        }))
      }
    ]);
  };

  const removeNewBale = (baleIndex) => {
    if (newBales.length === 1) {
      setMessage({ type: 'error', text: 'At least one bale required!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }
    setNewBales(newBales.filter((_, index) => index !== baleIndex));
  };

  const updateNewBale = (baleIndex, field, value) => {
    const updatedBales = [...newBales];
    updatedBales[baleIndex][field] = value;
    setNewBales(updatedBales);
  };

  const updateNewCloth = (baleIndex, clothIndex, field, value) => {
    const updatedBales = [...newBales];
    updatedBales[baleIndex].cloths[clothIndex][field] = value;
    setNewBales(updatedBales);
  };

  const startEditingBale = (bale) => {
    setEditingBaleId(bale._id);
  };

  const cancelEditingBale = () => {
    setEditingBaleId(null);
    fetchChallan();
  };

  const updateExistingCloth = (baleId, clothIndex, field, value) => {
    const updatedBales = existingBales.map(bale => {
      if (bale._id === baleId) {
        const updatedCloths = [...bale.cloths];
        updatedCloths[clothIndex] = {
          ...updatedCloths[clothIndex],
          [field]: value
        };
        return { ...bale, cloths: updatedCloths };
      }
      return bale;
    });
    setExistingBales(updatedBales);
  };

  const saveEditedBale = async (bale) => {
    try {
      const filteredCloths = bale.cloths.filter(c => c.meter && c.weight);
      
      if (filteredCloths.length === 0) {
        setMessage({ type: 'error', text: 'At least one cloth entry required!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        return;
      }

      await deliveryChallanAPI.updateBale(id, bale._id, {
        date: bale.date,
        cloths: filteredCloths
      });

      setMessage({ type: 'success', text: '✓ Bale updated!' });
      setEditingBaleId(null);
      await fetchChallan();
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating bale!' });
      console.error(error);
    }
  };

  const deleteExistingBale = async (baleId) => {
    if (!window.confirm('Delete this bale?')) {
      return;
    }

    try {
      await deliveryChallanAPI.deleteBale(id, baleId);
      setMessage({ type: 'success', text: '✓ Bale deleted!' });
      await fetchChallan();
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting bale!' });
      console.error(error);
    }
  };

  const calculateBaleTotal = (bale) => {
    const totalMeter = bale.cloths.reduce((sum, cloth) => sum + (parseFloat(cloth.meter) || 0), 0);
    const totalWeight = bale.cloths.reduce((sum, cloth) => sum + (parseFloat(cloth.weight) || 0), 0);
    const filledPieces = bale.cloths.filter(c => c.meter && c.weight).length;
    
    return { 
      totalMeter: totalMeter.toFixed(2), 
      totalWeight: totalWeight.toFixed(2),
      pieces: filledPieces
    };
  };

  const validateNewBales = () => {
    for (let i = 0; i < newBales.length; i++) {
      const bale = newBales[i];
      
      if (!bale.date) {
        setMessage({ type: 'error', text: `Select date for Bale ${i + 1}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        return false;
      }

      const filledCloths = bale.cloths.filter(c => c.meter || c.weight);
      if (filledCloths.length === 0) {
        setMessage({ type: 'error', text: `Add at least one cloth for Bale ${i + 1}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        return false;
      }

      for (let j = 0; j < bale.cloths.length; j++) {
        const cloth = bale.cloths[j];
        if ((cloth.meter && !cloth.weight) || (!cloth.meter && cloth.weight)) {
          setMessage({ type: 'error', text: `Fill both meter & weight for Bale ${i + 1}, Piece ${j + 1}` });
          setTimeout(() => setMessage({ type: '', text: '' }), 2000);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveNewBales = async (saveAndExit = false) => {
    if (!validateNewBales()) {
      return;
    }

    try {
      const processedBales = newBales.map(bale => ({
        ...bale,
        cloths: bale.cloths.filter(c => c.meter && c.weight)
      }));

      await deliveryChallanAPI.addBales(id, { bales: processedBales });
      
      setMessage({ type: 'success', text: '✓ Bales saved!' });
      
      if (saveAndExit) {
        setTimeout(() => {
          navigate('/view-challans');
        }, 1000);
      } else {
        await fetchChallan();
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving bales!' });
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading challan...</p>
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg">
          Challan not found!
        </div>
      </div>
    );
  }

  const remainingBales = challan.expectedBalesCount - challan.completedBalesCount;
  const nextBaleNumber = challan.quality?.currentBaleNumber + 1 || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
          Delivery Challan #{challan.challanNumber}
        </h1>
        <p className="text-sm text-gray-600">
          Quality: <strong>{challan.qualityName}</strong> • Progress: <strong>{challan.completedBalesCount}/{challan.expectedBalesCount}</strong> bales
        </p>
      </div>

      {/* Incomplete Notification */}
      {showIncompleteNotification && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 text-cyan-800 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>⚠️ Continuing incomplete challan</span>
        </div>
      )}

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

      {/* Existing Bales */}
      {existingBales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 md:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Saved Bales
          </h2>
          
          <div className="space-y-4">
            {existingBales.map((bale) => (
              <div key={bale._id} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">Bale #{bale.baleNumber}</h3>
                  <div className="flex gap-2">
                    {editingBaleId === bale._id ? (
                      <>
                        <button
                          onClick={() => saveEditedBale(bale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditingBale}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 transition-all"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditingBale(bale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExistingBale(bale._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Del
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingBaleId === bale._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={bale.date.split('T')[0]}
                        onChange={(e) => {
                          const updatedBales = existingBales.map(b => 
                            b._id === bale._id ? { ...b, date: e.target.value } : b
                          );
                          setExistingBales(updatedBales);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      {bale.cloths.map((cloth, clothIndex) => (
                        <div key={clothIndex} className="bg-white rounded-lg border border-gray-200 p-3">
                          <span className="block text-sm font-semibold text-gray-700 mb-2">Piece {clothIndex + 1}</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={cloth.meter}
                              onChange={(e) => updateExistingCloth(bale._id, clothIndex, 'meter', e.target.value)}
                              placeholder="Meter"
                              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={cloth.weight}
                              onChange={(e) => updateExistingCloth(bale._id, clothIndex, 'weight', e.target.value)}
                              placeholder="Weight"
                              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 text-sm space-y-1">
                    <p><strong>Date:</strong> {new Date(bale.date).toLocaleDateString()}</p>
                    <p><strong>Pieces:</strong> {bale.numberOfPieces}</p>
                    <p><strong>Meters:</strong> {bale.totalMeter.toFixed(2)}</p>
                    <p><strong>Weight:</strong> {bale.totalWeight.toFixed(2)} kg</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Bales Section */}
      {remainingBales > 0 && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 p-4">
            <h2 className="text-lg font-bold text-green-800 mb-1">Add New Bales</h2>
            <p className="text-sm text-green-700">Can add <strong>{remainingBales}</strong> more bale(s)</p>
          </div>

          {newBales.map((bale, baleIndex) => (
            <div key={baleIndex} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">
                  New Bale (Will be #{nextBaleNumber + baleIndex})
                </h3>
                {newBales.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNewBale(baleIndex)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={bale.date}
                    onChange={(e) => updateNewBale(baleIndex, 'date', e.target.value)}
                    required
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Cloth Details (Expected: {challan.expectedPiecesPerBale})
                  </h4>
                  
                  <div className="space-y-2">
                    {bale.cloths.map((cloth, clothIndex) => (
                      <div key={clothIndex} className="bg-white rounded-lg border border-gray-200 p-3">
                        <span className="block text-sm font-semibold text-gray-700 mb-2">Piece {clothIndex + 1}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={cloth.meter}
                            onChange={(e) => updateNewCloth(baleIndex, clothIndex, 'meter', e.target.value)}
                            placeholder="Meter"
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={cloth.weight}
                            onChange={(e) => updateNewCloth(baleIndex, clothIndex, 'weight', e.target.value)}
                            placeholder="Weight (kg)"
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 bg-gray-100 rounded-lg p-3 text-sm">
                    <strong>Total:</strong> 
                    <span className="ml-2">
                      {calculateBaleTotal(bale).pieces} pcs | 
                      {calculateBaleTotal(bale).totalMeter} m | 
                      {calculateBaleTotal(bale).totalWeight} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="space-y-3">
            {remainingBales > newBales.length && (
              <button
                type="button"
                onClick={addNewBale}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add New Bale ({remainingBales - newBales.length} remaining)
              </button>
            )}

            <button
              onClick={() => handleSaveNewBales(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
            >
              <Save className="w-5 h-5" />
              Save & Continue
            </button>

            <button
              onClick={() => handleSaveNewBales(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
            >
              <CheckCircle className="w-5 h-5" />
              Save & Exit
            </button>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {remainingBales === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 font-bold text-lg mb-4">✓ Challan Complete!</p>
          <button
            onClick={() => navigate('/view-challans')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
          >
            Go to View Challans
          </button>
        </div>
      )}
    </div>
  );
}

export default AddBales;