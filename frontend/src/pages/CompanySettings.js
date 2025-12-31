//frontend/src/pages/CompanySettings.js
import React, { useState, useEffect } from 'react';
import { companySettingsAPI } from '../services/api';

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
      taxDisplayStyle: 'combined',
      // Initialized new fields
      colorMode: 'color',
      fontFamily: 'Segoe UI',
      fontWeight: 'normal',
      fontSize: {
        base: 11,
        companyName: 48,
        heading: 12
      }
    },
    
    // Challan Format
    challanFormat: {
      template: 'detailed',
      showLogo: true,
      showGanthPress: true,
      showBaleDetails: true,
      showQualityBreakdown: true,
      showWeights: true,
      footerNote: 'Goods remain the property of the consignor until paid for',
      // Initialized new fields
      logoPosition: 'left',
      colorMode: 'color',
      fontFamily: 'Segoe UI',
      fontWeight: 'normal',
      fontSize: {
        base: 11,
        companyName: 22,
        heading: 12
      }
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
        // Deep merge to preserve defaults
        setFormData(prevData => ({
          ...prevData,
          ...data,
          numberSeries: data.numberSeries || prevData.numberSeries,
          invoiceFormat: {
            ...prevData.invoiceFormat,
            ...(data.invoiceFormat || {}),
            fontSize: {
              ...prevData.invoiceFormat.fontSize,
              ...(data.invoiceFormat?.fontSize || {})
            }
          },
          challanFormat: {
            ...prevData.challanFormat,
            ...(data.challanFormat || {}),
            fontSize: {
              ...prevData.challanFormat.fontSize,
              ...(data.challanFormat?.fontSize || {})
            }
          },
          terms: data.terms || prevData.terms,
          preferences: data.preferences || prevData.preferences
        }));
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

  const handleInvoiceFontSizeChange = (field) => (e) => {
    const value = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      invoiceFormat: {
        ...formData.invoiceFormat,
        fontSize: {
          ...formData.invoiceFormat.fontSize,
          [field]: value
        }
      }
    });
  };

  const handleChallanFontSizeChange = (field) => (e) => {
    const value = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      challanFormat: {
        ...formData.challanFormat,
        fontSize: {
          ...formData.challanFormat.fontSize,
          [field]: value
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Company Settings</h1>
        <p className="page-subtitle">Manage your company profile, branding, and document preferences</p>
      </div>

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
              <h2 className="modal-title">GST Verification</h2>
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
                    <label className="form-label">Enter CAPTCHA *</label>
                    <input
                      type="text"
                      className="form-control"
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
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          🏢 Company Details
        </button>
        <button 
          className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          🏦 Bank & Press
        </button>
        <button 
          className={`tab ${activeTab === 'numbering' ? 'active' : ''}`}
          onClick={() => setActiveTab('numbering')}
        >
          🔢 Number Series
        </button>
        <button 
          className={`tab ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          📄 Invoice Format
        </button>
        <button 
          className={`tab ${activeTab === 'challan' ? 'active' : ''}`}
          onClick={() => setActiveTab('challan')}
        >
          📋 Challan Format
        </button>
        <button 
          className={`tab ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          📝 Terms & Conditions
        </button>
        <button 
          className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          ⚙️ Preferences
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        
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
                      className="company-logo"
                      style={{ margin: '0 auto 1rem auto', display: 'block' }}
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
                <label className="form-label">GST Number *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    name="gstNumber"
                    className="form-control"
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
                <small className="text-muted">{formData.gstNumber.length}/15 characters</small>
              </div>

              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-control"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State Code *</label>
                  <input
                    type="text"
                    name="stateCode"
                    className="form-control"
                    value={formData.stateCode}
                    onChange={handleChange}
                    maxLength="2"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    className="form-control"
                    value={formData.mobile}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

       {/* Tab: Bank & Press Details */}
        {activeTab === 'bank' && (
          <div className="tab-content">
            {/* Bank Details */}
            <div className="card">
              <div className="card-header">Bank Details</div>
              
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  className="form-control"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="form-control"
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    className="form-control"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input
                  type="text"
                  name="branchName"
                  className="form-control"
                  value={formData.branchName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ganth Press Details */}
            <div className="card">
              <div className="card-header">Ganth Press Details</div>
              <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                These details will appear on delivery challans
              </p>
              
              <div className="form-group">
                <label className="form-label">Press Name</label>
                <input
                  type="text"
                  name="ganthPressName"
                  className="form-control"
                  value={formData.ganthPressName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Press Address</label>
                <textarea
                  name="ganthPressAddress"
                  className="form-control"
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
                  <label className="form-label">Prefix</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numberSeries.invoicePrefix}
                    onChange={handleNestedChange('numberSeries', 'invoicePrefix')}
                    placeholder="INV"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year Format</label>
                  <select
                    className="form-control"
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
                  <label className="form-label">Start Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.numberSeries.invoiceStartNumber}
                    onChange={handleNestedChange('numberSeries', 'invoiceStartNumber')}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.numberSeries.invoiceCurrentNumber}
                    onChange={handleNestedChange('numberSeries', 'invoiceCurrentNumber')}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.numberSeries.invoiceResetYearly}
                    onChange={handleNestedChange('numberSeries', 'invoiceResetYearly')}
                  />
                  <span>Reset counter yearly (on January 1st)</span>
                </label>
              </div>

              <div className="alert alert-info mt-3">
                <strong>Next Invoice Number: </strong>
                <span className="text-primary-gradient font-bold">{generateNumberPreview('invoice')}</span>
              </div>
            </div>

            {/* Challan Numbers */}
            <div className="card">
              <div className="card-header">Challan Number Series</div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prefix</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numberSeries.challanPrefix}
                    onChange={handleNestedChange('numberSeries', 'challanPrefix')}
                    placeholder="DC"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year Format</label>
                  <select
                    className="form-control"
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
                  <label className="form-label">Start Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.numberSeries.challanStartNumber}
                    onChange={handleNestedChange('numberSeries', 'challanStartNumber')}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.numberSeries.challanCurrentNumber}
                    onChange={handleNestedChange('numberSeries', 'challanCurrentNumber')}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.numberSeries.challanResetYearly}
                    onChange={handleNestedChange('numberSeries', 'challanResetYearly')}
                  />
                  <span>Reset counter yearly</span>
                </label>
              </div>

              <div className="alert alert-info mt-3">
                <strong>Next Challan Number: </strong>
                <span className="text-primary-gradient font-bold">{generateNumberPreview('challan')}</span>
              </div>
            </div>

            {/* Purchase Numbers */}
            <div className="card">
              <div className="card-header">Purchase Order Number Series</div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Prefix</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numberSeries.purchasePrefix}
                    onChange={handleNestedChange('numberSeries', 'purchasePrefix')}
                    placeholder="PO"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year Format</label>
                  <select
                    className="form-control"
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
                  <label className="form-label">Start Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.numberSeries.purchaseStartNumber}
                    onChange={handleNestedChange('numberSeries', 'purchaseStartNumber')}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.numberSeries.purchaseCurrentNumber}
                    onChange={handleNestedChange('numberSeries', 'purchaseCurrentNumber')}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.numberSeries.purchaseResetYearly}
                    onChange={handleNestedChange('numberSeries', 'purchaseResetYearly')}
                  />
                  <span>Reset counter yearly</span>
                </label>
              </div>

              <div className="alert alert-info mt-3">
                <strong>Next Purchase Number: </strong>
                <span className="text-primary-gradient font-bold">{generateNumberPreview('purchase')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Invoice Format (UPDATED) */}
        {activeTab === 'invoice' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">Invoice Layout Settings</div>
              <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                Configure how your tax invoices will appear when printed
              </p>
              
              {/* Logo Settings */}
              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat?.showLogo !== false}
                    onChange={handleNestedChange('invoiceFormat', 'showLogo')}
                  />
                  <strong>Show Company Logo</strong>
                </label>
              </div>

              {(formData.invoiceFormat?.showLogo !== false) && (
                <div className="form-group" style={{ marginLeft: '30px' }}>
                  <label className="form-label">Logo Position</label>
                  <select
                    className="form-control"
                    value={formData.invoiceFormat?.logoPosition || 'left'}
                    onChange={handleNestedChange('invoiceFormat', 'logoPosition')}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                  <small className="text-muted mt-1 block">
                    Position of the logo in the invoice header
                  </small>
                </div>
              )}

              {/* Color Mode */}
              <div className="form-group">
                <label className="form-label">Print Color Mode</label>
                <select
                  className="form-control"
                  value={formData.invoiceFormat?.colorMode || 'color'}
                  onChange={handleNestedChange('invoiceFormat', 'colorMode')}
                >
                  <option value="color">Color (Standard colors with backgrounds)</option>
                  <option value="black_white">Black & White (All elements in black)</option>
                </select>
                <small className="text-muted mt-1 block">
                  {formData.invoiceFormat?.colorMode === 'black_white' ? 
                    'Logo will also be converted to grayscale' : 
                    'Invoice will print with colored backgrounds and elements'}
                </small>
              </div>
            </div>

            {/* Typography Settings */}
            <div className="card">
              <div className="card-header">Typography Settings</div>
              
              <div className="form-group">
                <label className="form-label">Font Family</label>
                <select
                  className="form-control"
                  value={formData.invoiceFormat?.fontFamily || 'Segoe UI'}
                  onChange={handleNestedChange('invoiceFormat', 'fontFamily')}
                >
                  <option value="Segoe UI">Segoe UI (Modern, Clean)</option>
                  <option value="Arial">Arial (Classic, Universal)</option>
                  <option value="Times New Roman">Times New Roman (Traditional, Formal)</option>
                  <option value="Georgia">Georgia (Elegant, Serif)</option>
                  <option value="Courier New">Courier New (Monospace)</option>
                  <option value="Verdana">Verdana (Web-friendly)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Base Font Size (px)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.invoiceFormat?.fontSize?.base || 11}
                    onChange={handleInvoiceFontSizeChange('base')}
                    min="8"
                    max="16"
                  />
                  <small className="text-muted mt-1 block">Regular text (8-16)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name Size (px)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.invoiceFormat?.fontSize?.companyName || 48}
                    onChange={handleInvoiceFontSizeChange('companyName')}
                    min="24"
                    max="72"
                  />
                  <small className="text-muted mt-1 block">Header text (24-72)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Heading Size (px)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.invoiceFormat?.fontSize?.heading || 12}
                    onChange={handleInvoiceFontSizeChange('heading')}
                    min="10"
                    max="18"
                  />
                  <small className="text-muted mt-1 block">Section headings (10-18)</small>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Font Weight</label>
                <select
                  className="form-control"
                  value={formData.invoiceFormat?.fontWeight || 'normal'}
                  onChange={handleNestedChange('invoiceFormat', 'fontWeight')}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
                <small className="text-muted mt-1 block">Applies to regular text throughout the invoice</small>
              </div>
            </div>

            {/* Display Options */}
            <div className="card">
              <div className="card-header">Content Display Options</div>
              <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                When unchecked, the section heading will remain but content will be blank
              </p>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat?.showBankDetails !== false}
                    onChange={handleNestedChange('invoiceFormat', 'showBankDetails')}
                  />
                  <strong>Show Bank Details</strong>
                  <span className="text-muted text-sm ml-2">
                    (Account number, IFSC, PAN)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.invoiceFormat?.showTerms !== false}
                    onChange={handleNestedChange('invoiceFormat', 'showTerms')}
                  />
                  <strong>Show Terms & Conditions</strong>
                  <span className="text-muted text-sm ml-2">
                    (From Terms tab)
                  </span>
                </label>
              </div>
            </div>

            {/* Preview Note */}
            <div className="alert alert-success">
              <strong>💡 Preview Tip:</strong> Print an invoice after saving to see how these settings affect the layout
            </div>
          </div>
        )}

        {/* Tab: Challan Format (CORRECTED) */}
{activeTab === 'challan' && (
  <div className="tab-content">
    <div className="card">
      <div className="card-header">Challan Layout Settings</div>
      <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
        Configure how your delivery challans will appear when printed
      </p>
      
      {/* Logo Settings - Only show/hide toggle, no position */}
      <div className="form-group">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.challanFormat?.showLogo !== false}
            onChange={handleNestedChange('challanFormat', 'showLogo')}
          />
          <strong>Show Company Logo</strong>
        </label>
        <small className="text-muted mt-1 block ml-6">
          Logo will appear as a watermark in the background center of each challan
        </small>
      </div>

      {/* Color Mode */}
      <div className="form-group">
        <label className="form-label">Print Color Mode</label>
        <select
          className="form-control"
          value={formData.challanFormat?.colorMode || 'color'}
          onChange={handleNestedChange('challanFormat', 'colorMode')}
        >
          <option value="color">Color (Standard colors with backgrounds)</option>
          <option value="black_white">Black & White (All elements in black)</option>
        </select>
        <small className="text-muted mt-1 block">
          {formData.challanFormat?.colorMode === 'black_white' ? 
            'All colors including logo will be converted to grayscale' : 
            'Challan will print with colored backgrounds and elements'}
        </small>
      </div>
    </div>

    {/* Typography Settings */}
    <div className="card">
      <div className="card-header">Typography Settings</div>
      
      <div className="form-group">
        <label className="form-label">Font Family</label>
        <select
          className="form-control"
          value={formData.challanFormat?.fontFamily || 'Segoe UI'}
          onChange={handleNestedChange('challanFormat', 'fontFamily')}
        >
          <option value="Segoe UI">Segoe UI (Modern, Clean)</option>
          <option value="Arial">Arial (Classic, Universal)</option>
          <option value="Times New Roman">Times New Roman (Traditional, Formal)</option>
          <option value="Georgia">Georgia (Elegant, Serif)</option>
          <option value="Courier New">Courier New (Monospace)</option>
          <option value="Verdana">Verdana (Web-friendly)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Base Font Size (px)</label>
          <input
            type="number"
            className="form-control"
            value={formData.challanFormat?.fontSize?.base || 11}
            onChange={handleChallanFontSizeChange('base')}
            min="8"
            max="16"
          />
          <small className="text-muted mt-1 block">Regular text (8-16)</small>
        </div>

        <div className="form-group">
          <label className="form-label">Company Name Size (px)</label>
          <input
            type="number"
            className="form-control"
            value={formData.challanFormat?.fontSize?.companyName || 22}
            onChange={handleChallanFontSizeChange('companyName')}
            min="16"
            max="32"
          />
          <small className="text-muted mt-1 block">Header text (16-32)</small>
        </div>

        <div className="form-group">
          <label className="form-label">Heading Size (px)</label>
          <input
            type="number"
            className="form-control"
            value={formData.challanFormat?.fontSize?.heading || 12}
            onChange={handleChallanFontSizeChange('heading')}
            min="10"
            max="18"
          />
          <small className="text-muted mt-1 block">Section headings (10-18)</small>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Font Weight</label>
        <select
          className="form-control"
          value={formData.challanFormat?.fontWeight || 'normal'}
          onChange={handleNestedChange('challanFormat', 'fontWeight')}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
        </select>
        <small className="text-muted mt-1 block">Applies to regular text throughout the challan</small>
      </div>
    </div>

    {/* Display Options */}
    <div className="card">
      <div className="card-header">Content Display Options</div>
      
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.challanFormat?.showGanthPress !== false}
            onChange={handleNestedChange('challanFormat', 'showGanthPress')}
          />
          <strong>Show Ganth Press Details</strong>
          <span className="text-muted text-sm ml-2">
            (Press name and address)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.challanFormat?.showBaleDetails !== false}
            onChange={handleNestedChange('challanFormat', 'showBaleDetails')}
          />
          <strong>Show Bale Details Section</strong>
          <span className="text-muted text-sm ml-2">
            (Quality, Bale Number, Pieces count)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.challanFormat?.showWeights !== false}
            onChange={handleNestedChange('challanFormat', 'showWeights')}
          />
          <strong>Show Weight Column</strong>
          <span className="text-muted text-sm ml-2">
            (Weight in kg for each piece)
          </span>
        </label>
      </div>
    </div>

    {/* Preview Note */}
    <div className="alert alert-success">
      <strong>💡 Preview Tip:</strong> Print a challan after saving to see how these settings affect the layout
    </div>
  </div>
)}

        {/* Tab: Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">Invoice Terms & Conditions</div>
              <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                These will appear at the bottom of tax invoices (Maximum 100 characters per line)
              </p>
              
              <div className="form-group">
                <label className="form-label">Line 1</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.terms.invoice.line1}
                  onChange={handleTermsChange('invoice', 'line1')}
                  maxLength="100"
                  placeholder="E.g., Payment due within 30 days"
                />
                <small className="text-muted">{(formData.terms.invoice.line1 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label className="form-label">Line 2</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.terms.invoice.line2}
                  onChange={handleTermsChange('invoice', 'line2')}
                  maxLength="100"
                  placeholder="E.g., Goods once sold cannot be returned"
                />
                <small className="text-muted">{(formData.terms.invoice.line2 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label className="form-label">Line 3</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.terms.invoice.line3}
                  onChange={handleTermsChange('invoice', 'line3')}
                  maxLength="100"
                  placeholder="E.g., Subject to jurisdiction"
                />
                <small className="text-muted">{(formData.terms.invoice.line3 || '').length}/100</small>
              </div>

              <div className="form-group">
                <label className="form-label">Line 4</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.terms.invoice.line4}
                  onChange={handleTermsChange('invoice', 'line4')}
                  maxLength="100"
                  placeholder="E.g., Interest charged on overdue payments"
                />
                <small className="text-muted">{(formData.terms.invoice.line4 || '').length}/100</small>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Challan Terms & Conditions</div>
              <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                This will appear at the bottom of delivery challans (Maximum 150 characters)
              </p>
              
              <div className="form-group">
                <label className="form-label">Terms</label>
                <textarea
                  className="form-control"
                  value={formData.terms.challan.line1}
                  onChange={handleTermsChange('challan', 'line1')}
                  maxLength="150"
                  rows="3"
                  placeholder="E.g., Any type of complaint regarding weight and folding will be entertained within 48Hrs."
                />
                <small className="text-muted">{(formData.terms.challan.line1 || '').length}/150 characters</small>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Signature & Stamp</div>
              
              <div className="grid-2">
                <div>
                  <label className="form-label">Signature Image</label>
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
                  <label className="form-label">Stamp Image</label>
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
                <label className="form-label">Signature Text</label>
                <input
                  type="text"
                  name="signatureText"
                  className="form-control"
                  value={formData.signatureText}
                  onChange={handleChange}
                  placeholder="Authorized Signatory"
                />
                <small className="text-muted mt-1 block">Text that appears below the signature line</small>
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
                <label className="form-label">Default Tax Rate (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.preferences.defaultTaxRate}
                  onChange={handleNestedChange('preferences', 'defaultTaxRate')}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <select
                  className="form-control"
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
                <label className="form-label">Date Format</label>
                <select
                  className="form-control"
                  value={formData.preferences.dateFormat}
                  onChange={handleNestedChange('preferences', 'dateFormat')}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Number Format</label>
                <select
                  className="form-control"
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
        
        <button type="submit" className="btn btn-success mt-4 w-full">
          {exists ? 'Update Settings' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default CompanySettings;