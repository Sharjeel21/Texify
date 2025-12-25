// frontend/src/pages/CompanySettings.js
import React, { useState, useEffect } from 'react';
import { companySettingsAPI } from '../services/api';
import './CompanySettings.css';

function CompanySettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [formData, setFormData] = useState({
    // Company Details
    companyName: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    mobile: '',
    email: '',
    gstNumber: '',
    logo: '',
    
    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    
    // Ganth Press
    ganthPressName: '',
    ganthPressAddress: '',
    
    // Number Series
    numberSeries: {
      invoicePrefix: 'INV',
      invoiceStartNumber: 1,
      invoiceCurrentNumber: 0,
      invoiceResetYearly: true,
      invoiceYearFormat: 'YY',
      challanPrefix: 'DC',
      challanStartNumber: 1,
      challanCurrentNumber: 0,
      challanResetYearly: true,
      challanYearFormat: 'YY',
      purchasePrefix: 'PO',
      purchaseStartNumber: 1,
      purchaseCurrentNumber: 0,
      purchaseResetYearly: true,
      purchaseYearFormat: 'YY'
    },
    
    // Invoice Format
    invoiceFormat: {
      template: 'classic',
      showLogo: true,
      logoPosition: 'left',
      primaryColor: '#2c3e50',
      accentColor: '#3498db',
      showBankDetails: true,
      showTerms: true,
      showSignature: true,
      showQRCode: false,
      footerText: 'Thank you for your business!',
      taxDisplayStyle: 'combined'
    },
    
    // Challan Format
    challanFormat: {
      template: 'detailed',
      showLogo: true,
      showGanthPress: true,
      showBaleDetails: true,
      showQualityBreakdown: true,
      showWeights: true,
      footerNote: 'Goods remain the property of the consignor until paid for'
    },
    
    // Terms
    terms: {
      invoice: {
        line1: '',
        line2: '',
        line3: '',
        line4: ''
      },
      challan: {
        line1: '',
        line2: '',
        line3: ''
      }
    },
    
    // Signature & Stamps
    signatureImage: '',
    signatureText: 'Authorized Signatory',
    stampImage: '',
    
    // Preferences
    preferences: {
      defaultTaxRate: 18,
      defaultCurrency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'indian'
    }
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  
  // CAPTCHA states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [pendingGSTNumber, setPendingGSTNumber] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await companySettingsAPI.get();
      
      if (response.data.exists && response.data.data) {
        const data = response.data.data;
        setFormData({
          ...formData,
          ...data,
          numberSeries: data.numberSeries || formData.numberSeries,
          invoiceFormat: data.invoiceFormat || formData.invoiceFormat,
          challanFormat: data.challanFormat || formData.challanFormat,
          terms: data.terms || formData.terms,
          preferences: data.preferences || formData.preferences
        });
        setExists(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Error loading settings' });
      setLoading(false);
    }
  };

  const handleGSTNumberChange = (e) => {
    const gstValue = e.target.value.toUpperCase();
    setFormData({ ...formData, gstNumber: gstValue });
  };

  const triggerGSTVerification = async () => {
    if (formData.gstNumber.length !== 15) {
      setMessage({ type: 'error', text: 'Please enter a valid 15-digit GST number' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstPattern.test(formData.gstNumber)) {
      setMessage({ type: 'error', text: 'Invalid GST number format!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setPendingGSTNumber(formData.gstNumber);
    await initializeCaptcha();
  };

  const initializeCaptcha = async () => {
    setCaptchaLoading(true);
    setShowCaptchaModal(true);
    setCaptchaInput('');
    
    try {
      const response = await companySettingsAPI.initCaptcha();
      
      if (response.data.success) {
        setCaptchaImage(response.data.captchaImage);
        setSessionId(response.data.sessionId);
        setMessage({ type: 'info', text: 'Please enter the CAPTCHA' });
      } else {
        setMessage({ type: 'error', text: 'Failed to load CAPTCHA' });
        setShowCaptchaModal(false);
      }
    } catch (error) {
      console.error('Error initializing CAPTCHA:', error);
      setMessage({ type: 'error', text: 'Error loading CAPTCHA' });
      setShowCaptchaModal(false);
    } finally {
      setCaptchaLoading(false);
    }
  };

  const verifyGSTWithCaptcha = async () => {
    if (!captchaInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter the CAPTCHA' });
      return;
    }

    setVerifyingGST(true);
    
    try {
      const response = await companySettingsAPI.verifyGST({
        sessionId: sessionId,
        gstNumber: pendingGSTNumber,
        captcha: captchaInput
      });

      if (response.data.success) {
        const gstData = response.data.data;
        
        setFormData({
          ...formData,
          gstNumber: pendingGSTNumber,
          companyName: gstData.name || '',
          address: gstData.address || '',
          city: gstData.city || '',
          state: gstData.state || '',
          stateCode: gstData.stateCode || '',
        });
        
        setMessage({ type: 'success', text: `✓ GST verified! Company: ${gstData.name}` });
        setShowCaptchaModal(false);
        setCaptchaInput('');
      } else {
        setMessage({ type: 'error', text: response.data.error || 'GST verification failed' });
        const stateCode = pendingGSTNumber.substring(0, 2);
        setFormData({ ...formData, gstNumber: pendingGSTNumber, stateCode });
        setShowCaptchaModal(false);
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error verifying GST:', error);
      setMessage({ type: 'error', text: 'Error verifying GST' });
      setShowCaptchaModal(false);
    } finally {
      setVerifyingGST(false);
    }
  };

  const closeCaptchaModal = () => {
    setShowCaptchaModal(false);
    setCaptchaInput('');
  };

  const handleImageUpload = (field) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please upload an image file' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field) => () => {
    setFormData({ ...formData, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await companySettingsAPI.createOrUpdate(formData);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: '✓ Settings saved successfully!' });
        setExists(true);
        await fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Error saving settings!' });
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error saving settings!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleNestedChange = (parent, field) => (e) => {
    const { value, type, checked } = e.target;
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: type === 'checkbox' ? checked : value
      }
    });
  };

  const handleTermsChange = (section, line) => (e) => {
    setFormData({
      ...formData,
      terms: {
        ...formData.terms,
        [section]: {
          ...formData.terms[section],
          [line]: e.target.value
        }
      }
    });
  };

  // Generate number preview
  const generateNumberPreview = (type) => {
    const series = formData.numberSeries;
    const year = new Date().getFullYear();
    let prefix = '';
    let yearPart = '';
    let number = '';
    
    switch(type) {
      case 'invoice':
        prefix = series.invoicePrefix;
        number = (series.invoiceCurrentNumber + 1).toString().padStart(4, '0');
        switch(series.invoiceYearFormat) {
          case 'YYYY': yearPart = `${year}`; break;
          case 'YY': yearPart = `${year.toString().slice(-2)}`; break;
          case 'YYYY-YY': yearPart = `${year}-${(year + 1).toString().slice(-2)}`; break;
          default: yearPart = '';
        }
        break;
      case 'challan':
        prefix = series.challanPrefix;
        number = (series.challanCurrentNumber + 1).toString().padStart(4, '0');
        switch(series.challanYearFormat) {
          case 'YYYY': yearPart = `${year}`; break;
          case 'YY': yearPart = `${year.toString().slice(-2)}`; break;
          case 'YYYY-YY': yearPart = `${year}-${(year + 1).toString().slice(-2)}`; break;
          default: yearPart = '';
        }
        break;
      case 'purchase':
        prefix = series.purchasePrefix;
        number = (series.purchaseCurrentNumber + 1).toString().padStart(4, '0');
        switch(series.purchaseYearFormat) {
          case 'YYYY': yearPart = `${year}`; break;
          case 'YY': yearPart = `${year.toString().slice(-2)}`; break;
          case 'YYYY-YY': yearPart = `${year}-${(year + 1).toString().slice(-2)}`; break;
          default: yearPart = '';
        }
        break;
    }
    
    return `${prefix}${yearPart ? '-' + yearPart : ''}-${number}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="page-container company-settings-container">
      <h1 className="page-title">Company Settings</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* CAPTCHA Modal */}
      {showCaptchaModal && (
        <div className="modal-overlay" onClick={closeCaptchaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>GST Verification</h2>
              <button className="modal-close" onClick={closeCaptchaModal}>×</button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Enter the CAPTCHA to verify: <strong>{pendingGSTNumber}</strong>
              </p>
              
              {captchaLoading ? (
                <div className="loading" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Loading CAPTCHA...</p>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={captchaImage} 
                      alt="CAPTCHA" 
                      style={{ 
                        maxWidth: '100%', 
                        border: '2px solid #ddd', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={initializeCaptcha}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Click image to refresh
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label>Enter CAPTCHA *</label>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter the text shown above"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') verifyGSTWithCaptcha();
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={verifyGSTWithCaptcha}
                      disabled={verifyingGST}
                      style={{ flex: 1 }}
                    >
                      {verifyingGST ? 'Verifying...' : 'Verify GST'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={closeCaptchaModal}
                      disabled={verifyingGST}
                      style={{ flex: 1 }}
                    >
                      Skip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          🏢 Company Details
        </button>
        <button 
          className={`tab-button ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          🏦 Bank & Press
        </button>
        <button 
          className={`tab-button ${activeTab === 'numbering' ? 'active' : ''}`}
          onClick={() => setActiveTab('numbering')}
        >
          🔢 Number Series
        </button>
        <button 
          className={`tab-button ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          📄 Invoice Format
        </button>
        <button 
          className={`tab-button ${activeTab === 'challan' ? 'active' : ''}`}
          onClick={() => setActiveTab('challan')}
        >
          📋 Challan Format
        </button>
        <button 
          className={`tab-button ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          📝 Terms & Conditions
        </button>
        <button 
          className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          ⚙️ Preferences
        </button>
      </div>

      <form onSubmit={handleSubmit}>
       {/* Tab: Bank & Press Details */}
        {activeTab === 'bank' && (
          <div className="tab-content">
            {/* Bank Details */}
            <div className="card">
              <div className="card-header">Bank Details</div>
              
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ganth Press Details */}
            <div className="card">
              <div className="card-header">Ganth Press Details</div>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                These details will appear on delivery challans
              </p>
              
              <div className="form-group">
                <label>Press Name</label>
                <input
                  type="text"
                  name="ganthPressName"
                  value={formData.ganthPressName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Press Address</label>
                <textarea
                  name="ganthPressAddress"
                  value={formData.ganthPressAddress}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Number Series */}
        {activeTab === 'numbering' && (
          <div className="tab-content">
            {/* Invoice Numbers */}
            <div className="card">
              <div className="card-header">Invoice Number Series</div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label>Prefix</label>
                  <input
                    type="text"
                    value={formData.numberSeries.invoicePrefix}
                    onChange={handleNestedChange('numberSeries', 'invoicePrefix')}
                    placeholder="INV"
                  />
                </div>

                <div className="form-group">
                  <label>Year Format</label>
                  <select
                    value={formData.numberSeries.invoiceYearFormat}
                    onChange={handleNestedChange('numberSeries', 'invoiceYearFormat')}
                  >
                    <option value="none">No Year</option>
                    <option value="YY">YY (24)</option>
                    <option value="YYYY">YYYY (2024)</option>
                    <option value="YYYY-YY">YYYY-YY (2024-25)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Start Number</label>
                  <input
                    type="number"
                    value={formData.numberSeries.invoiceStartNumber}
                    onChange={handleNestedChange('numberSeries', 'invoiceStartNumber')}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Current Number</label>
                  <input
                    type="number"
                    value={formData.numberSeries.invoiceCurrentNumber}
                    onChange={handleNestedChange('numberSeries', 'invoiceCurrentNumber')}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.numberSeries.invoiceResetYearly}
                    onChange={handleNestedChange('numberSeries', 'invoiceResetYearly')}
                  />
                  Reset counter yearly (on January 1st)
                </label>
              </div>

              <div className="preview-box">
                <strong>Next Invoice Number:</strong>
                <span className="preview-number">{generateNumberPreview('invoice')}</span>
              </div>
            </div>

            {/* Challan Numbers */}
            <div className="card">
              <div className="card-header">Challan Number Series</div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label>Prefix</label>
                  <input
                    type="text"
                    value={formData.numberSeries.challanPrefix}
                    onChange={handleNestedChange('numberSeries', 'challanPrefix')}
                    placeholder="DC"
                  />
                </div>

                <div className="form-group">
                  <label>Year Format</label>
                  <select
                    value={formData.numberSeries.challanYearFormat}
                    onChange={handleNestedChange('numberSeries', 'challanYearFormat')}
                  >
                    <option value="none">No Year</option>
                    <option value="YY">YY (24)</option>
                    <option value="YYYY">YYYY (2024)</option>
                    <option value="YYYY-YY">YYYY-YY (2024-25)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Start Number</label>
                  <input
                    type="number"
                    value={formData.numberSeries.challanStartNumber}
                    onChange={handleNestedChange('numberSeries', 'challanStartNumber')}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Current Number</label>
                  <input
                    type="number"
                    value={formData.numberSeries.challanCurrentNumber}
                    onChange={handleNestedChange('numberSeries', 'challanCurrentNumber')}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.numberSeries.challanResetYearly}
                    onChange={handleNestedChange('numberSeries', 'challanResetYearly')}
                  />
                  Reset counter yearly
                </label>
              </div>

              <div className="preview-box">
                <strong>Next Challan Number:</strong>
                <span className="preview-number">{generateNumberPreview('challan')}</span>
              </div>
            </div>

            {/* Purchase Numbers */}
            <div className="card">
              <div className="card-header">Purchase Order Number Series</div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label>Prefix</label>
                  <input
                    type="text"
                    value={formData.numberSeries.purchasePrefix}
                    onChange={handleNestedChange('numberSeries', 'purchasePrefix')}
                    placeholder="PO"
                  />
                </div>

                <div className="form-group">
                  <label>Year Format</label>
                  <select
                    value={formData.numberSeries.purchaseYearFormat}
                    onChange={handleNestedChange('numberSeries', 'purchaseYearFormat')}
                  >
                    <option value="none">No Year</option>
                    <option value="YY">YY (24)</option>
                    <option value="YYYY">YYYY (2024)</option>
                    <option value="YYYY-YY">YYYY-YY (2024-25)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Start Number</label>
                  <input
                    type="number"
                    value={formData.numberSeries.purchaseStartNumber}
                    onChange={handleNestedChange('numberSeries', 'purchaseStartNumber')}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Current Number</label>
                  <input
                    type="number"
                    value={formData.numberSeries.purchaseCurrentNumber}
                    onChange={handleNestedChange('numberSeries', 'purchaseCurrentNumber')}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.numberSeries.purchaseResetYearly}
                    onChange={handleNestedChange('numberSeries', 'purchaseResetYearly')}
                  />
                  Reset counter yearly
                </label>
              </div>

              <div className="preview-box">
                <strong>Next Purchase Number:</strong>
                <span className="preview-number">{generateNumberPreview('purchase')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Invoice Format */}
        {activeTab === 'invoice' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">Invoice Template & Layout</div>
              
              <div className="form-group">
                <label>Template Style</label>
                <select
                  value={formData.invoiceFormat.template}
                  onChange={handleNestedChange('invoiceFormat', 'template')}
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Logo Position</label>
                <select
                  value={formData.invoiceFormat.logoPosition}
                  onChange={handleNestedChange('invoiceFormat', 'logoPosition')}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    value={formData.invoiceFormat.primaryColor}
                    onChange={handleNestedChange('invoiceFormat', 'primaryColor')}
                  />
                </div>

                <div className="form-group">
                  <label>Accent Color</label>
                  <input
                    type="color"
                    value={formData.invoiceFormat.accentColor}
                    onChange={handleNestedChange('invoiceFormat', 'accentColor')}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Display Options</div>
              
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat.showLogo}
                    onChange={handleNestedChange('invoiceFormat', 'showLogo')}
                  />
                  Show Company Logo
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat.showBankDetails}
                    onChange={handleNestedChange('invoiceFormat', 'showBankDetails')}
                  />
                  Show Bank Details
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat.showTerms}
                    onChange={handleNestedChange('invoiceFormat', 'showTerms')}
                  />
                  Show Terms & Conditions
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat.showSignature}
                    onChange={handleNestedChange('invoiceFormat', 'showSignature')}
                  />
                  Show Signature
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat.showQRCode}
                    onChange={handleNestedChange('invoiceFormat', 'showQRCode')}
                  />
                  Show QR Code
                </label>
              </div>

              <div className="form-group">
                <label>Tax Display Style</label>
                <select
                  value={formData.invoiceFormat.taxDisplayStyle}
                  onChange={handleNestedChange('invoiceFormat', 'taxDisplayStyle')}
                >
                  <option value="combined">Combined (Total GST)</option>
                  <option value="separate">Separate (CGST + SGST)</option>
                  <option value="detailed">Detailed Breakdown</option>
                </select>
              </div>

              <div className="form-group">
                <label>Footer Text</label>
                <input
                  type="text"
                  value={formData.invoiceFormat.footerText}
                  onChange={handleNestedChange('invoiceFormat', 'footerText')}
                  placeholder="Thank you for your business!"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Challan Format */}
        {activeTab === 'challan' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">Challan Template</div>
              
              <div className="form-group">
                <label>Template Style</label>
                <select
                  value={formData.challanFormat.template}
                  onChange={handleNestedChange('challanFormat', 'template')}
                >
                  <option value="compact">Compact</option>
                  <option value="detailed">Detailed</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Display Options</div>
              
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.challanFormat.showLogo}
                    onChange={handleNestedChange('challanFormat', 'showLogo')}
                  />
                  Show Company Logo
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.challanFormat.showGanthPress}
                    onChange={handleNestedChange('challanFormat', 'showGanthPress')}
                  />
                  Show Ganth Press Details
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.challanFormat.showBaleDetails}
                    onChange={handleNestedChange('challanFormat', 'showBaleDetails')}
                  />
                  Show Bale Details
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.challanFormat.showQualityBreakdown}
                    onChange={handleNestedChange('challanFormat', 'showQualityBreakdown')}
                  />
                  Show Quality Breakdown
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={formData.challanFormat.showWeights}
                    onChange={handleNestedChange('challanFormat', 'showWeights')}
                  />
                  Show Weights
                </label>
              </div>

              <div className="form-group">
                <label>Footer Note</label>
                <input
                  type="text"
                  value={formData.challanFormat.footerNote}
                  onChange={handleNestedChange('challanFormat', 'footerNote')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">Invoice Terms & Conditions</div>
              
              <div className="form-group">
                <label>Line 1</label>
                <input
                  type="text"
                  value={formData.terms.invoice.line1}
                  onChange={handleTermsChange('invoice', 'line1')}
                  maxLength="100"
                />
                <small>{(formData.terms.invoice.line1 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label>Line 2</label>
                <input
                  type="text"
                  value={formData.terms.invoice.line2}
                  onChange={handleTermsChange('invoice', 'line2')}
                  maxLength="100"
                />
                <small>{(formData.terms.invoice.line2 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label>Line 3</label>
                <input
                  type="text"
                  value={formData.terms.invoice.line3}
                  onChange={handleTermsChange('invoice', 'line3')}
                  maxLength="100"
                />
                <small>{(formData.terms.invoice.line3 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label>Line 4</label>
                <input
                  type="text"
                  value={formData.terms.invoice.line4}
                  onChange={handleTermsChange('invoice', 'line4')}
                  maxLength="100"
                />
                <small>{(formData.terms.invoice.line4 || '').length}/100</small>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Challan Terms & Conditions</div>
              
              <div className="form-group">
                <label>Line 1</label>
                <input
                  type="text"
                  value={formData.terms.challan.line1}
                  onChange={handleTermsChange('challan', 'line1')}
                  maxLength="100"
                />
                <small>{(formData.terms.challan.line1 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label>Line 2</label>
                <input
                  type="text"
                  value={formData.terms.challan.line2}
                  onChange={handleTermsChange('challan', 'line2')}
                  maxLength="100"
                />
                <small>{(formData.terms.challan.line2 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label>Line 3</label>
                <input
                  type="text"
                  value={formData.terms.challan.line3}
                  onChange={handleTermsChange('challan', 'line3')}
                  maxLength="100"
                />
                <small>{(formData.terms.challan.line3 || '').length}/100</small>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Signature & Stamp</div>
              
              <div className="grid-2">
                <div>
                  <label>Signature Image</label>
                  {formData.signatureImage ? (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={formData.signatureImage} 
                        alt="Signature" 
                        style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd' }} 
                      />
                      <button
                        type="button"
                        onClick={removeImage('signatureImage')}
                        className="btn btn-danger btn-small"
                        style={{ display: 'block', margin: '10px auto' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="signature-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        Upload Signature
                      </label>
                      <input
                        id="signature-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload('signatureImage')}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label>Stamp Image</label>
                  {formData.stampImage ? (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={formData.stampImage} 
                        alt="Stamp" 
                        style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd' }} 
                      />
                      <button
                        type="button"
                        onClick={removeImage('stampImage')}
                        className="btn btn-danger btn-small"
                        style={{ display: 'block', margin: '10px auto' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="stamp-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        Upload Stamp
                      </label>
                      <input
                        id="stamp-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload('stampImage')}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Signature Text</label>
                <input
                  type="text"
                  name="signatureText"
                  value={formData.signatureText}
                  onChange={handleChange}
                  placeholder="Authorized Signatory"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Preferences */}
        {activeTab === 'preferences' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">General Preferences</div>
              
              <div className="form-group">
                <label>Default Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.preferences.defaultTaxRate}
                  onChange={handleNestedChange('preferences', 'defaultTaxRate')}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Default Currency</label>
                <select
                  value={formData.preferences.defaultCurrency}
                  onChange={handleNestedChange('preferences', 'defaultCurrency')}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date Format</label>
                <select
                  value={formData.preferences.dateFormat}
                  onChange={handleNestedChange('preferences', 'dateFormat')}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number Format</label>
                <select
                  value={formData.preferences.numberFormat}
                  onChange={handleNestedChange('preferences', 'numberFormat')}
                >
                  <option value="indian">Indian (1,00,000.00)</option>
                  <option value="international">International (100,000.00)</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab: Company Details */}
        {activeTab === 'company' && (
          <div className="tab-content">
            {/* Company Logo */}
            <div className="card">
              <div className="card-header">Company Logo</div>
              
              <div style={{ textAlign: 'center' }}>
                {formData.logo ? (
                  <div>
                    <img 
                      src={formData.logo} 
                      alt="Company Logo" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px', 
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }} 
                    />
                    <div>
                      <button
                        type="button"
                        onClick={removeImage('logo')}
                        className="btn btn-danger btn-small"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label 
                      htmlFor="logo-upload" 
                      className="btn btn-primary"
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      Upload Logo
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload('logo')}
                      style={{ display: 'none' }}
                    />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      Maximum size: 2MB | Formats: JPG, PNG, GIF
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Details Form */}
            <div className="card">
              <div className="card-header">Company Information</div>
              
              <div className="form-group">
                <label>GST Number *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleGSTNumberChange}
                    placeholder="Enter 15-digit GST Number"
                    maxLength="15"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={triggerGSTVerification}
                    className="btn btn-primary"
                    disabled={formData.gstNumber.length !== 15}
                  >
                    Verify GST
                  </button>
                </div>
                <small>{formData.gstNumber.length}/15 characters</small>
              </div>

              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State Code *</label>
                  <input
                    type="text"
                    name="stateCode"
                    value={formData.stateCode}
                    onChange={handleChange}
                    maxLength="2"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continued in next message due to length... */}
        
        <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '2rem' }}>
          {exists ? 'Update Settings' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default CompanySettings;