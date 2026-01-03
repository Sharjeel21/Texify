//fronend/screen/pages/AddBales.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { deliveryChallanAPI } from '../services/api';

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
    
    // Show notification if continuing incomplete challan
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

      setMessage({ type: 'success', text: 'Bale updated!' });
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
      setMessage({ type: 'success', text: 'Bale deleted!' });
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
      
      setMessage({ type: 'success', text: 'Bales saved!' });
      
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
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="page-container">
        <div className="alert alert-error">Challan not found!</div>
      </div>
    );
  }

  const remainingBales = challan.expectedBalesCount - challan.completedBalesCount;
  const nextBaleNumber = challan.quality?.currentBaleNumber + 1 || 1;

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Delivery Challan #{challan.challanNumber}</h1>

      {showIncompleteNotification && (
        <div className="alert alert-info" style={{ animation: 'slideDown 0.3s ease-out' }}>
          ⚠️ Continuing incomplete challan
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <strong>Quality:</strong> {challan.qualityName}
          </div>
          <div>
            <strong>Progress:</strong> {challan.completedBalesCount}/{challan.expectedBalesCount}
          </div>
        </div>
      </div>

      {/* Existing Bales */}
      {existingBales.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #ecf0f1'
          }}>
            Saved Bales
          </div>
          
          {existingBales.map((bale, index) => (
            <div key={bale._id} className="bale-entry-mobile">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Bale #{bale.baleNumber}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {editingBaleId === bale._id ? (
                    <>
                      <button
                        onClick={() => saveEditedBale(bale)}
                        className="btn btn-success btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingBale}
                        className="btn btn-secondary btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingBale(bale)}
                        className="btn btn-primary btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteExistingBale(bale._id)}
                        className="btn btn-danger btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                      >
                        Del
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingBaleId === bale._id ? (
                <>
                  <div className="form-group-mobile">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={bale.date.split('T')[0]}
                      onChange={(e) => {
                        const updatedBales = existingBales.map(b => 
                          b._id === bale._id ? { ...b, date: e.target.value } : b
                        );
                        setExistingBales(updatedBales);
                      }}
                    />
                  </div>

                  {bale.cloths.map((cloth, clothIndex) => (
                    <div key={clothIndex} className="cloth-entry-mobile">
                      <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Piece {clothIndex + 1}</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={cloth.meter}
                          onChange={(e) => updateExistingCloth(bale._id, clothIndex, 'meter', e.target.value)}
                          placeholder="Meter"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={cloth.weight}
                          onChange={(e) => updateExistingCloth(bale._id, clothIndex, 'weight', e.target.value)}
                          placeholder="Weight"
                        />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: '0.75rem', background: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
                  <p style={{ margin: '0.25rem 0' }}><strong>Date:</strong> {new Date(bale.date).toLocaleDateString()}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Pieces:</strong> {bale.numberOfPieces}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Meters:</strong> {bale.totalMeter.toFixed(2)}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Weight:</strong> {bale.totalWeight.toFixed(2)} kg</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Bales Section */}
      {remainingBales > 0 && (
        <div>
          <div className="card" style={{ marginBottom: '1rem', background: '#e8f5e9', padding: '0.75rem' }}>
            <h2 style={{ color: '#27ae60', marginBottom: '0.25rem', fontSize: '1rem' }}>Add New Bales</h2>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Can add {remainingBales} more bale(s)</p>
          </div>

          {newBales.map((bale, baleIndex) => (
            <div key={baleIndex} className="bale-entry-mobile">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>
                  New Bale (Will be #{nextBaleNumber + baleIndex})
                </h3>
                {newBales.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNewBale(baleIndex)}
                    className="btn btn-danger btn-small"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group-mobile">
                <label>Date *</label>
                <input
                  type="date"
                  value={bale.date}
                  onChange={(e) => updateNewBale(baleIndex, 'date', e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  Cloth Details (Expected: {challan.expectedPiecesPerBale})
                </h4>
                
                {bale.cloths.map((cloth, clothIndex) => (
                  <div key={clothIndex} className="cloth-entry-mobile">
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Piece {clothIndex + 1}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={cloth.meter}
                        onChange={(e) => updateNewCloth(baleIndex, clothIndex, 'meter', e.target.value)}
                        placeholder="Meter"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={cloth.weight}
                        onChange={(e) => updateNewCloth(baleIndex, clothIndex, 'weight', e.target.value)}
                        placeholder="Weight (kg)"
                      />
                    </div>
                  </div>
                ))}

                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem', 
                  background: '#ecf0f1', 
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  <strong>Total:</strong> 
                  <span style={{ marginLeft: '0.5rem' }}>
                    {calculateBaleTotal(bale).pieces} pcs | 
                    {calculateBaleTotal(bale).totalMeter} m | 
                    {calculateBaleTotal(bale).totalWeight} kg
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Simplified Action Buttons */}
          <div className="action-buttons-mobile">
            {remainingBales > newBales.length && (
              <button
                type="button"
                onClick={addNewBale}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                + Add New Bale ({remainingBales - newBales.length} remaining)
              </button>
            )}

            <button
              onClick={() => handleSaveNewBales(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Save & Continue
            </button>

            <button
              onClick={() => handleSaveNewBales(true)}
              className="btn btn-success"
              style={{ width: '100%' }}
            >
              Save & Exit
            </button>
          </div>
        </div>
      )}

      {remainingBales === 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#d4edda', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#155724', marginBottom: '0.75rem', fontWeight: '600' }}>
            ✓ Challan Complete!
          </p>
          <button
            onClick={() => navigate('/view-challans')}
            className="btn btn-primary"
          >
            Go to View Challans
          </button>
        </div>
      )}
    </div>
  );
}

export default AddBales;