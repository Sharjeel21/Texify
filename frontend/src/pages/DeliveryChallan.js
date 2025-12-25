  //fronend/src/pages/DeliveryChallan.js
  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { qualityAPI, deliveryChallanAPI } from '../services/api';

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
      
      // Check for incomplete challans
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
      navigate(`/delivery-challan/add-bales/${challan._id}`);
    };

    return (
      <div className="page-container">
        <h1 className="page-title">Create Delivery Challan</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {!selectedQuality && (
          <div className="card">
            <div className="card-header">Select Quality</div>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Choose the quality for which you want to create or continue a delivery challan
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {qualities.map((quality) => (
                <div
                  key={quality._id}
                  onClick={() => handleQualitySelect(quality)}
                  style={{
                    padding: '1.5rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3498db';
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <h3 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>{quality.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    {quality.balesPerChallan} bales per challan
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>
                    {quality.piecesPerBale} pieces per bale
                  </p>
                </div>
              ))}
            </div>

            {qualities.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
                No qualities found. Please add qualities first.
              </p>
            )}
          </div>
        )}

        {selectedQuality && (
          <div>
            <button
              onClick={() => setSelectedQuality(null)}
              className="btn btn-secondary"
              style={{ marginBottom: '1rem' }}
            >
              ← Back to Quality Selection
            </button>

            {incompleteChallans.length > 0 && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header">
                  ⚠️ Incomplete Delivery Challans for {selectedQuality.name}
                </div>
                
                <p style={{ marginBottom: '1rem', color: '#856404', background: '#fff3cd', padding: '1rem', borderRadius: '4px' }}>
                  You have {incompleteChallans.length} incomplete delivery challan(s). 
                  Click on a challan below to continue working on it.
                </p>

                {incompleteChallans.map((challan) => (
                  <div
                    key={challan._id}
                    onClick={() => continueExisting(challan)}
                    style={{
                      padding: '1rem',
                      background: '#fff3cd',
                      border: '2px solid #ffc107',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ffe69c';
                      e.currentTarget.style.borderColor = '#ff9800';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff3cd';
                      e.currentTarget.style.borderColor = '#ffc107';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{challan.challanNumber}</strong>
                        <p style={{ fontSize: '0.875rem', margin: '0.25rem 0', color: '#856404' }}>
                          Progress: {challan.completedBalesCount} / {challan.expectedBalesCount} bales
                        </p>
                        <p style={{ fontSize: '0.875rem', margin: 0, color: '#666' }}>
                          Created: {new Date(challan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#856404' }}>
                        Click to continue →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div className="card-header">Start New Delivery Challan</div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Create a new delivery challan for <strong>{selectedQuality.name}</strong>
              </p>
              <button
                onClick={() => createNewChallan(selectedQuality)}
                className="btn btn-primary"
              >
                + Create New Challan
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default DeliveryChallan;