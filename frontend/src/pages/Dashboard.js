// frontend/src/components/PurchaseDashboardWidget.js
// TEMPORARY VERSION - Replace with full version later

import React from 'react';
import { useNavigate } from 'react-router-dom';

const PurchaseDashboardWidget = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '25px',
      marginBottom: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '22px' }}>
          Purchase Overview
        </h3>
        <button 
          onClick={() => navigate('/purchases')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          View All →
        </button>
      </div>
      
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '10px 0', color: '#666' }}>
          Purchase management system is being set up...
        </p>
        <p style={{ margin: '10px 0', color: '#999', fontSize: '14px' }}>
          Backend routes need to be configured first.
        </p>
        <button
          onClick={() => navigate('/create-purchase')}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Create First Purchase
        </button>
      </div>
    </div>
  );
};

export default PurchaseDashboardWidget;