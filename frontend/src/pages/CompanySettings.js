// frontend/src/pages/CompanySettings.js
import React, { useState, useEffect } from 'react';
import { companySettingsAPI } from '../services/api';
import { 
  Save, Building2, CreditCard, Hash, FileText, ClipboardList, ScrollText, 
  Settings as SettingsIcon, Upload, X, Shield, RefreshCw, CheckCircle, 
  AlertCircle, Printer, ChevronRight, Menu
} from 'lucide-react';

function CompanySettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '', address: '', city: '', state: '', stateCode: '',
    mobile: '', email: '', gstNumber: '', logo: '',
    bankName: '', accountNumber: '', ifscCode: '', branchName: '',
    ganthPressName: '', ganthPressAddress: '',
    numberSeries: {
      invoicePrefix: 'INV', invoiceStartNumber: 1, invoiceCurrentNumber: 0,
      invoiceResetYearly: true, invoiceYearFormat: 'YY',
      challanPrefix: 'DC', challanStartNumber: 1, challanCurrentNumber: 0,
      challanResetYearly: true, challanYearFormat: 'YY',
      purchasePrefix: 'PO', purchaseStartNumber: 1, purchaseCurrentNumber: 0,
      purchaseResetYearly: true, purchaseYearFormat: 'YY'
    },
    invoiceFormat: {
      template: 'classic', showLogo: true, logoPosition: 'left',
      primaryColor: '#2c3e50', accentColor: '#3498db',
      showBankDetails: true, showTerms: true, showSignature: true,
      showQRCode: false, footerText: 'Thank you for your business!',
      taxDisplayStyle: 'combined', colorMode: 'color',
      fontFamily: 'Segoe UI', fontWeight: 'normal',
      fontSize: { base: 11, companyName: 48, heading: 12 }
    },
    challanFormat: {
      template: 'detailed', showLogo: true, showGanthPress: true,
      showBaleDetails: true, showQualityBreakdown: true, showWeights: true,
      footerNote: 'Goods remain the property of the consignor until paid for',
      logoPosition: 'left', colorMode: 'color', fontFamily: 'Segoe UI',
      fontWeight: 'normal', fontSize: { base: 11, companyName: 22, heading: 12 }
    },
    terms: {
      invoice: { line1: '', line2: '', line3: '', line4: '' },
      challan: { line1: '', line2: '', line3: '' }
    },
    signatureImage: '', signatureText: 'Authorized Signatory', stampImage: '',
    preferences: {
      defaultTaxRate: 18, defaultCurrency: 'INR',
      dateFormat: 'DD/MM/YYYY', numberFormat: 'indian'
    }
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [pendingGSTNumber, setPendingGSTNumber] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [verifyingGST, setVerifyingGST] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await companySettingsAPI.get();
      if (response.data.exists && response.data.data) {
        const data = response.data.data;
        setFormData(prevData => ({
          ...prevData, ...data,
          numberSeries: data.numberSeries || prevData.numberSeries,
          invoiceFormat: {
            ...prevData.invoiceFormat, ...(data.invoiceFormat || {}),
            fontSize: { ...prevData.invoiceFormat.fontSize, ...(data.invoiceFormat?.fontSize || {}) }
          },
          challanFormat: {
            ...prevData.challanFormat, ...(data.challanFormat || {}),
            fontSize: { ...prevData.challanFormat.fontSize, ...(data.challanFormat?.fontSize || {}) }
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
    setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() });
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
        sessionId, gstNumber: pendingGSTNumber, captcha: captchaInput
      });
      if (response.data.success) {
        const gstData = response.data.data;
        setFormData({
          ...formData, gstNumber: pendingGSTNumber,
          companyName: gstData.name || '', address: gstData.address || '',
          city: gstData.city || '', state: gstData.state || '',
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
      reader.onloadend = () => setFormData({ ...formData, [field]: reader.result });
      reader.readAsDataURL(file);
    }
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
      [parent]: { ...formData[parent], [field]: type === 'checkbox' ? checked : value }
    });
  };

  const handleTermsChange = (section, line) => (e) => {
    setFormData({
      ...formData,
      terms: {
        ...formData.terms,
        [section]: { ...formData.terms[section], [line]: e.target.value }
      }
    });
  };

  const handleInvoiceFontSizeChange = (field) => (e) => {
    const value = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      invoiceFormat: {
        ...formData.invoiceFormat,
        fontSize: { ...formData.invoiceFormat.fontSize, [field]: value }
      }
    });
  };

  const handleChallanFontSizeChange = (field) => (e) => {
    const value = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      challanFormat: {
        ...formData.challanFormat,
        fontSize: { ...formData.challanFormat.fontSize, [field]: value }
      }
    });
  };

  const generateNumberPreview = (type) => {
    const series = formData.numberSeries;
    const year = new Date().getFullYear();
    let prefix = '', yearPart = '', number = '';
    
    const config = {
      invoice: { prefix: series.invoicePrefix, current: series.invoiceCurrentNumber, format: series.invoiceYearFormat },
      challan: { prefix: series.challanPrefix, current: series.challanCurrentNumber, format: series.challanYearFormat },
      purchase: { prefix: series.purchasePrefix, current: series.purchaseCurrentNumber, format: series.purchaseYearFormat }
    }[type];

    prefix = config.prefix;
    number = (config.current + 1).toString().padStart(4, '0');
    switch(config.format) {
      case 'YYYY': yearPart = `${year}`; break;
      case 'YY': yearPart = `${year.toString().slice(-2)}`; break;
      case 'YYYY-YY': yearPart = `${year}-${(year + 1).toString().slice(-2)}`; break;
      default: yearPart = '';
    }
    return `${prefix}${yearPart ? '-' + yearPart : ''}-${number}`;
  };

  const tabs = [
    { id: 'company', label: 'Company Details', icon: Building2, description: 'Basic company information' },
    { id: 'bank', label: 'Bank & Press', icon: CreditCard, description: 'Banking and press details' },
    { id: 'numbering', label: 'Number Series', icon: Hash, description: 'Document numbering' },
    { id: 'invoice', label: 'Invoice Format', icon: FileText, description: 'Invoice layout settings' },
    { id: 'challan', label: 'Challan Format', icon: ClipboardList, description: 'Challan layout settings' },
    { id: 'terms', label: 'Terms & Conditions', icon: ScrollText, description: 'Legal terms' },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon, description: 'General preferences' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
            Company Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Manage your company profile, branding, and document preferences
          </p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
              : message.type === 'info'
              ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-500 text-cyan-800'
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <span className="text-sm sm:text-base">{message.text}</span>
          </div>
        )}

        {/* CAPTCHA Modal */}
        {showCaptchaModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCaptchaModal(false)}>
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 px-6 py-4 border-b-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-700" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">GST Verification</h3>
                </div>
                <button onClick={() => setShowCaptchaModal(false)} className="text-gray-600 hover:text-gray-900 text-2xl">×</button>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4 text-sm sm:text-base">
                  Enter the CAPTCHA to verify: <strong className="text-amber-700 break-all">{pendingGSTNumber}</strong>
                </p>
                {captchaLoading ? (
                  <div className="flex flex-col justify-center items-center py-12">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading CAPTCHA...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <img src={captchaImage} alt="CAPTCHA" className="max-w-full border-2 border-gray-300 rounded-lg cursor-pointer hover:border-amber-500 transition-colors mx-auto" onClick={initializeCaptcha} />
                      <button onClick={initializeCaptcha} className="mt-2 text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 mx-auto">
                        <RefreshCw className="w-4 h-4" />
                        Click to refresh CAPTCHA
                      </button>
                    </div>
                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-semibold text-gray-700">Enter CAPTCHA *</label>
                      <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} placeholder="Enter the text shown above" autoFocus
                        onKeyPress={(e) => { if (e.key === 'Enter') verifyGSTWithCaptcha(); }}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={verifyGSTWithCaptcha} disabled={verifyingGST}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:flex-1 text-sm sm:text-base">
                        {verifyingGST ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Verifying...</> : <><Shield className="w-4 h-4" />Verify GST</>}
                      </button>
                      <button onClick={() => setShowCaptchaModal(false)} disabled={verifyingGST}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:flex-1 text-sm sm:text-base">
                        Skip
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b-2 border-amber-200">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-amber-600" />
                  Settings Menu
                </h2>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all mb-1 text-left ${
                        activeTab === tab.id ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-400 shadow-sm' : 'hover:bg-amber-50 border-2 border-transparent'
                      }`}>
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${activeTab === tab.id ? 'text-amber-700' : 'text-gray-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold ${activeTab === tab.id ? 'text-amber-900' : 'text-gray-700'}`}>{tab.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                      </div>
                      {activeTab === tab.id && <ChevronRight className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full bg-white rounded-xl shadow-sm border-2 border-amber-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {React.createElement(tabs.find(t => t.id === activeTab)?.icon || SettingsIcon, { className: "w-5 h-5 text-amber-600" })}
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</div>
                  <div className="text-xs text-gray-500">{tabs.find(t => t.id === activeTab)?.description}</div>
                </div>
              </div>
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            {mobileMenuOpen && (
              <div className="mt-2 bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-all ${
                        activeTab === tab.id ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'hover:bg-amber-50'
                      }`}>
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-amber-700' : 'text-gray-500'}`} />
                      <div className="flex-1 text-left">
                        <div className={`font-semibold text-sm ${activeTab === tab.id ? 'text-amber-900' : 'text-gray-700'}`}>{tab.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tab: Company Details */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                  {/* Company Logo */}
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Company Logo</h3>
                    <div className="text-center">
                      {formData.logo ? (
                        <div className="space-y-4">
                          <img src={formData.logo} alt="Logo" className="max-h-32 mx-auto border-2 border-gray-200 rounded-lg p-2" />
                          <button type="button" onClick={() => setFormData({ ...formData, logo: '' })}
                            className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all text-sm sm:text-base">
                            <X className="w-4 h-4" />Remove Logo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label htmlFor="logo-upload" 
                            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all cursor-pointer shadow-sm hover:shadow-md text-sm sm:text-base">
                            <Upload className="w-4 sm:w-5 h-4 sm:h-5" />Upload Logo
                          </label>
                          <input id="logo-upload" type="file" accept="image/*" onChange={handleImageUpload('logo')} className="hidden" />
                          <p className="text-xs sm:text-sm text-gray-600">Maximum size: 2MB • Formats: JPG, PNG, GIF</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Company Information</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">GST Number *</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleGSTNumberChange}
                          placeholder="Enter 15-digit GST Number" maxLength="15" required
                          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-mono text-sm sm:text-base" />
                        <button type="button" onClick={triggerGSTVerification} disabled={formData.gstNumber.length !== 15}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base">
                          <Shield className="w-4 h-4" />Verify
                        </button>
                      </div>
                      <small className="text-gray-500 text-xs sm:text-sm">{formData.gstNumber.length}/15 characters</small>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Company Name *</label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Address *</label>
                      <textarea name="address" value={formData.address} onChange={handleChange} rows="3" required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical min-h-[100px] transition-all text-sm sm:text-base" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">City *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">State *</label>
                        <input type="text" name="state" value={formData.state} onChange={handleChange} required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">State Code *</label>
                        <input type="text" name="stateCode" value={formData.stateCode} onChange={handleChange} maxLength="2" required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Mobile</label>
                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Bank & Press Details */}
              {activeTab === 'bank' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Bank Details</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Bank Name</label>
                      <input type="text" name="bankName" value={formData.bankName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Account Number</label>
                        <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">IFSC Code</label>
                        <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} style={{ textTransform: 'uppercase' }}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Branch Name</label>
                      <input type="text" name="branchName" value={formData.branchName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Ganth Press Details</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">These details will appear on delivery challans</p>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Press Name</label>
                      <input type="text" name="ganthPressName" value={formData.ganthPressName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Press Address</label>
                      <textarea name="ganthPressAddress" value={formData.ganthPressAddress} onChange={handleChange} rows="3"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical min-h-[100px] transition-all text-sm sm:text-base" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Number Series */}
              {activeTab === 'numbering' && (
                <div className="space-y-6">
                  {['invoice', 'challan', 'purchase'].map((type) => (
                    <div key={type} className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Number Series
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Prefix</label>
                          <input type="text" value={formData.numberSeries[`${type}Prefix`]}
                            onChange={handleNestedChange('numberSeries', `${type}Prefix`)}
                            placeholder={type === 'invoice' ? 'INV' : type === 'challan' ? 'DC' : 'PO'}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Year Format</label>
                          <select value={formData.numberSeries[`${type}YearFormat`]}
                            onChange={handleNestedChange('numberSeries', `${type}YearFormat`)}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                            <option value="none">No Year</option>
                            <option value="YY">YY (24)</option>
                            <option value="YYYY">YYYY (2024)</option>
                            <option value="YYYY-YY">YYYY-YY (2024-25)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Start Number</label>
                          <input type="number" value={formData.numberSeries[`${type}StartNumber`]}
                            onChange={handleNestedChange('numberSeries', `${type}StartNumber`)} min="1"
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Current Number</label>
                          <input type="number" value={formData.numberSeries[`${type}CurrentNumber`]}
                            onChange={handleNestedChange('numberSeries', `${type}CurrentNumber`)} min="0"
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.numberSeries[`${type}ResetYearly`]}
                          onChange={handleNestedChange('numberSeries', `${type}ResetYearly`)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Reset counter yearly{type === 'invoice' ? ' (on January 1st)' : ''}</span>
                      </label>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-lg">
                        <p className="font-semibold text-green-800 text-sm sm:text-base">
                          Next {type.charAt(0).toUpperCase() + type.slice(1)} Number: <span className="text-green-600">{generateNumberPreview(type)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Invoice Format */}
              {activeTab === 'invoice' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Invoice Layout Settings</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">Configure how your tax invoices will appear when printed</p>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.invoiceFormat?.showLogo !== false}
                        onChange={handleNestedChange('invoiceFormat', 'showLogo')}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" />
                      <strong className="text-sm font-semibold text-gray-700">Show Company Logo</strong>
                    </label>

                    {(formData.invoiceFormat?.showLogo !== false) && (
                      <div className="ml-6 space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Logo Position</label>
                        <select value={formData.invoiceFormat?.logoPosition || 'left'}
                          onChange={handleNestedChange('invoiceFormat', 'logoPosition')}
                          className="w-full sm:w-64 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Print Color Mode</label>
                      <select value={formData.invoiceFormat?.colorMode || 'color'}
                        onChange={handleNestedChange('invoiceFormat', 'colorMode')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="color">Color (Standard colors with backgrounds)</option>
                        <option value="black_white">Black & White (All elements in black)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Typography Settings</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Font Family</label>
                      <select value={formData.invoiceFormat?.fontFamily || 'Segoe UI'}
                        onChange={handleNestedChange('invoiceFormat', 'fontFamily')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="Segoe UI">Segoe UI (Modern, Clean)</option>
                        <option value="Arial">Arial (Classic, Universal)</option>
                        <option value="Times New Roman">Times New Roman (Traditional, Formal)</option>
                        <option value="Georgia">Georgia (Elegant, Serif)</option>
                        <option value="Courier New">Courier New (Monospace)</option>
                        <option value="Verdana">Verdana (Web-friendly)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { field: 'base', label: 'Base Font Size', min: 8, max: 16, hint: 'Regular text (8-16)' },
                        { field: 'companyName', label: 'Company Name Size', min: 24, max: 72, hint: 'Header text (24-72)' },
                        { field: 'heading', label: 'Heading Size', min: 10, max: 18, hint: 'Section headings (10-18)' }
                      ].map(({ field, label, min, max, hint }) => (
                        <div key={field} className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">{label} (px)</label>
                          <input type="number" value={formData.invoiceFormat?.fontSize?.[field] || (field === 'companyName' ? 48 : field === 'heading' ? 12 : 11)}
                            onChange={handleInvoiceFontSizeChange(field)} min={min} max={max}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                          <small className="block text-gray-500 text-xs">{hint}</small>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Font Weight</label>
                      <select value={formData.invoiceFormat?.fontWeight || 'normal'}
                        onChange={handleNestedChange('invoiceFormat', 'fontWeight')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Content Display Options</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">When unchecked, the section heading will remain but content will be blank</p>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.invoiceFormat?.showBankDetails !== false}
                          onChange={handleNestedChange('invoiceFormat', 'showBankDetails')}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 mt-0.5" />
                        <div>
                          <strong className="text-sm font-semibold text-gray-700">Show Bank Details</strong>
                          <span className="text-xs sm:text-sm text-gray-500 ml-2">(Account number, IFSC, PAN)</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.invoiceFormat?.showTerms !== false}
                          onChange={handleNestedChange('invoiceFormat', 'showTerms')}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 mt-0.5" />
                        <div>
                          <strong className="text-sm font-semibold text-gray-700">Show Terms & Conditions</strong>
                          <span className="text-xs sm:text-sm text-gray-500 ml-2">(From Terms tab)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-lg flex items-start gap-3">
                    <Printer className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-green-800 text-sm sm:text-base">Preview Tip:</strong>
                      <p className="text-green-700 text-xs sm:text-sm mt-1">Print an invoice after saving to see how these settings affect the layout</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Challan Format */}
              {activeTab === 'challan' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Challan Layout Settings</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">Configure how your delivery challans will appear when printed</p>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.challanFormat?.showLogo !== false}
                          onChange={handleNestedChange('challanFormat', 'showLogo')}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" />
                        <strong className="text-sm font-semibold text-gray-700">Show Company Logo</strong>
                      </label>
                      <small className="block text-gray-500 ml-6 text-xs sm:text-sm">Logo will appear as a watermark in the background center of each challan</small>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Print Color Mode</label>
                      <select value={formData.challanFormat?.colorMode || 'color'}
                        onChange={handleNestedChange('challanFormat', 'colorMode')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="color">Color (Standard colors with backgrounds)</option>
                        <option value="black_white">Black & White (All elements in black)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Typography Settings</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Font Family</label>
                      <select value={formData.challanFormat?.fontFamily || 'Segoe UI'}
                        onChange={handleNestedChange('challanFormat', 'fontFamily')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="Segoe UI">Segoe UI (Modern, Clean)</option>
                        <option value="Arial">Arial (Classic, Universal)</option>
                        <option value="Times New Roman">Times New Roman (Traditional, Formal)</option>
                        <option value="Georgia">Georgia (Elegant, Serif)</option>
                        <option value="Courier New">Courier New (Monospace)</option>
                        <option value="Verdana">Verdana (Web-friendly)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { field: 'base', label: 'Base Font Size', min: 8, max: 16, hint: 'Regular text (8-16)' },
                        { field: 'companyName', label: 'Company Name Size', min: 16, max: 32, hint: 'Header text (16-32)' },
                        { field: 'heading', label: 'Heading Size', min: 10, max: 18, hint: 'Section headings (10-18)' }
                      ].map(({ field, label, min, max, hint }) => (
                        <div key={field} className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">{label} (px)</label>
                          <input type="number" value={formData.challanFormat?.fontSize?.[field] || (field === 'companyName' ? 22 : field === 'heading' ? 12 : 11)}
                            onChange={handleChallanFontSizeChange(field)} min={min} max={max}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                          <small className="block text-gray-500 text-xs">{hint}</small>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Font Weight</label>
                      <select value={formData.challanFormat?.fontWeight || 'normal'}
                        onChange={handleNestedChange('challanFormat', 'fontWeight')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Content Display Options</h3>
                    
                    <div className="space-y-3">
                      {[
                        { field: 'showGanthPress', label: 'Show Ganth Press Details', hint: '(Press name and address)' },
                        { field: 'showBaleDetails', label: 'Show Bale Details Section', hint: '(Quality, Bale Number, Pieces count)' },
                        { field: 'showWeights', label: 'Show Weight Column', hint: '(Weight in kg for each piece)' }
                      ].map(({ field, label, hint }) => (
                        <label key={field} className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.challanFormat?.[field] !== false}
                            onChange={handleNestedChange('challanFormat', field)}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 mt-0.5" />
                          <div>
                            <strong className="text-sm font-semibold text-gray-700">{label}</strong>
                            <span className="text-xs sm:text-sm text-gray-500 ml-2">{hint}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-lg flex items-start gap-3">
                    <Printer className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-green-800 text-sm sm:text-base">Preview Tip:</strong>
                      <p className="text-green-700 text-xs sm:text-sm mt-1">Print a challan after saving to see how these settings affect the layout</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Terms & Conditions */}
              {activeTab === 'terms' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Invoice Terms & Conditions</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">These will appear at the bottom of tax invoices (Maximum 100 characters per line)</p>
                    
                    {[1, 2, 3, 4].map(num => (
                      <div key={num} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Line {num}</label>
                        <input type="text" value={formData.terms.invoice[`line${num}`]}
                          onChange={handleTermsChange('invoice', `line${num}`)} maxLength="100"
                          placeholder={
                            num === 1 ? 'E.g., Payment due within 30 days' :
                            num === 2 ? 'E.g., Goods once sold cannot be returned' :
                            num === 3 ? 'E.g., Subject to jurisdiction' :
                            'E.g., Interest charged on overdue payments'
                          }
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                        <small className="text-gray-500 text-xs sm:text-sm">{(formData.terms.invoice[`line${num}`] || '').length}/100</small>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Challan Terms & Conditions</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">This will appear at the bottom of delivery challans (Maximum 150 characters)</p>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Terms</label>
                      <textarea value={formData.terms.challan.line1} onChange={handleTermsChange('challan', 'line1')}
                        maxLength="150" rows="3" placeholder="E.g., Any type of complaint regarding weight and folding will be entertained within 48Hrs."
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-vertical min-h-[100px] transition-all text-sm sm:text-base" />
                      <small className="text-gray-500 text-xs sm:text-sm">{(formData.terms.challan.line1 || '').length}/150 characters</small>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Signature & Stamp</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['signatureImage', 'stampImage'].map((field) => (
                        <div key={field} className="space-y-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            {field === 'signatureImage' ? 'Signature' : 'Stamp'} Image
                          </label>
                          {formData[field] ? (
                            <div className="text-center space-y-3">
                              <img src={formData[field]} alt={field === 'signatureImage' ? 'Signature' : 'Stamp'}
                                className="max-w-[200px] max-h-[100px] border-2 border-gray-200 rounded mx-auto" />
                              <button type="button" onClick={() => setFormData({ ...formData, [field]: '' })}
                                className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all text-sm sm:text-base">
                                <X className="w-4 h-4" />Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <label htmlFor={`${field}-upload`}
                                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all cursor-pointer shadow-sm hover:shadow-md text-sm sm:text-base">
                                <Upload className="w-4 sm:w-5 h-4 sm:h-5" />
                                Upload {field === 'signatureImage' ? 'Signature' : 'Stamp'}
                              </label>
                              <input id={`${field}-upload`} type="file" accept="image/*"
                                onChange={handleImageUpload(field)} className="hidden" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Signature Text</label>
                      <input type="text" name="signatureText" value={formData.signatureText}
                        onChange={handleChange} placeholder="Authorized Signatory"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                      <small className="block text-gray-500 mt-1 text-xs sm:text-sm">Text that appears below the signature line</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Preferences */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6 space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">General Preferences</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Default Tax Rate (%)</label>
                      <input type="number" value={formData.preferences.defaultTaxRate}
                        onChange={handleNestedChange('preferences', 'defaultTaxRate')} min="0" max="100" step="0.01"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Default Currency</label>
                      <select value={formData.preferences.defaultCurrency}
                        onChange={handleNestedChange('preferences', 'defaultCurrency')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Date Format</label>
                      <select value={formData.preferences.dateFormat}
                        onChange={handleNestedChange('preferences', 'dateFormat')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Number Format</label>
                      <select value={formData.preferences.numberFormat}
                        onChange={handleNestedChange('preferences', 'numberFormat')}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all text-sm sm:text-base">
                        <option value="indian">Indian (1,00,000.00)</option>
                        <option value="international">International (100,000.00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" 
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md text-sm sm:text-base">
                <Save className="w-5 h-5" />
                {exists ? 'Update Settings' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanySettings;