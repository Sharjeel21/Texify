// frontend/src/pages/ViewInvoices.js
import React, { useState, useEffect, useRef } from 'react';
import { taxInvoiceAPI, companySettingsAPI, partyAPI, qualityAPI } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { 
  Printer, 
  Trash2, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

function ViewInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [parties, setParties] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterParty, setFilterParty] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
    fetchCompanySettings();
    fetchParties();
    fetchQualities();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await taxInvoiceAPI.getAll();
      setInvoices(response.data);
      
      // Debug: Log first invoice to see structure
      if (response.data && response.data.length > 0) {
        console.log('Sample Invoice Structure:', {
          party: response.data[0].party,
          partyDetails: response.data[0].partyDetails,
          quality: response.data[0].quality,
          qualityName: response.data[0].qualityName
        });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await companySettingsAPI.get();
      if (response.data.exists) {
        setCompanySettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await partyAPI.getAll();
      setParties(response.data);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const fetchQualities = async () => {
    try {
      const response = await qualityAPI.getAll();
      setQualities(response.data);
    } catch (error) {
      console.error('Error fetching qualities:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax invoice? This will mark the associated challans as unsold.')) {
      try {
        await taxInvoiceAPI.delete(id);
        setMessage({ type: 'success', text: '✓ Tax invoice deleted successfully!' });
        fetchInvoices();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting tax invoice!' });
      }
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4 portrait !important;
        margin: 8mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        html, body {
          width: 210mm !important;
          height: 297mm !important;
        }
        * {
          page-break-inside: avoid;
        }
      }
    `,
    documentTitle: 'Tax Invoice'
  });

 const getFilteredInvoices = () => {
  let filtered = [...invoices]; // Creates a copy instead of reference

  if (filterParty !== 'all') {
    filtered = filtered.filter(inv => {
      const partyId = inv.party?._id || inv.party || inv.partyDetails?._id;
      return partyId === filterParty;
    });
  }

  if (filterQuality !== 'all') {
    filtered = filtered.filter(inv => {
      const qualityId = inv.quality?._id || inv.quality;
      return qualityId === filterQuality;
    });
  }

  return filtered;
};

  const filteredInvoices = getFilteredInvoices();

  const calculateTotals = (invoice) => {
    const totalPieces = invoice.totalPieces || 0;
    const totalMetres = invoice.totalMeters || 0;
    const ratePerMeter = parseFloat(invoice.discountedRate || invoice.ratePerMeter || 0);
    const amount = totalMetres * ratePerMeter;
    const cgst = parseFloat(invoice.cgst || 0);
    const sgst = parseFloat(invoice.sgst || 0);
    const igst = parseFloat(invoice.igst || 0);
    
    const totalTax = cgst + sgst + igst;
    const totalBeforeRound = amount + totalTax;
    const totalAmount = Math.round(totalBeforeRound);
    const roundOff = totalAmount - totalBeforeRound;
    
    return { 
      totalPieces, 
      totalMetres, 
      ratePerMeter, 
      amount, 
      cgst, 
      sgst, 
      igst,
      roundOff,
      totalAmount 
    };
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertToWords = (n) => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convertToWords(n % 100);
      if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand ' + convertToWords(n % 1000);
      if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh ' + convertToWords(n % 100000);
      return convertToWords(Math.floor(n / 10000000)) + ' Crore ' + convertToWords(n % 10000000);
    };

    return convertToWords(Math.floor(num)).trim() + ' Rupees Only';
  };

  const extractBales = (invoice) => {
    const bales = [];
    
    if (invoice.challanDetails) {
      invoice.challanDetails.forEach(challan => {
        if (challan.bales && Array.isArray(challan.bales)) {
          challan.bales.forEach(bale => {
            bales.push({
              baleNo: bale.baleNumber || bale.baleNo || '',
              pieces: bale.numberOfPieces || bale.pieces || '',
              metres: bale.totalMeter || bale.metres || ''
            });
          });
        } else {
          bales.push({
            baleNo: challan.challanNumber || '',
            pieces: challan.totalPieces || '',
            metres: challan.totalMeters || ''
          });
        }
      });
    }
    
    while (bales.length < 10) {
      bales.push({ baleNo: '', pieces: '', metres: '' });
    }
    
    return bales.slice(0, 10);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'billNumber',
      header: 'Bill No.',
      render: (invoice) => (
        <span className="font-bold text-amber-700">{invoice.billNumber}</span>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (invoice) => (
        <span className="text-sm text-gray-600">
          {new Date(invoice.date).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'party',
      header: 'Party',
      render: (invoice) => (
        <span className="font-medium text-gray-900">{invoice.partyDetails?.name}</span>
      )
    },
    {
      key: 'quality',
      header: 'Quality',
      render: (invoice) => (
        <span className="text-sm text-gray-700">{invoice.qualityName}</span>
      )
    },
    {
      key: 'challans',
      header: 'Challans',
      render: (invoice) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-300">
          {invoice.challanDetails?.length} challan(s)
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Total Amount',
      render: (invoice) => (
        <span className="font-bold text-green-700">₹{Math.round(invoice.totalAmount)}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (invoice) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvoice(invoice);
              setTimeout(handlePrint, 100);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
            title="Print Invoice"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Print</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(invoice._id);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all shadow-sm hover:shadow-md"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Delete</span>
          </button>
        </div>
      )
    }
  ];


  const PrintableInvoice = () => {
    const invoice = selectedInvoice;
    if (!invoice) return null;

    const totals = calculateTotals(invoice);
    const baleRows = extractBales(invoice);
    
    const format = companySettings?.invoiceFormat || {};
    
    const showLogo = format.showLogo !== false;
    const logoPosition = format.logoPosition || 'left';
    const showBankDetails = format.showBankDetails !== false;
    const showTerms = format.showTerms !== false;
    
    const fontFamily = format.fontFamily || 'Segoe UI';
    const fontWeight = format.fontWeight || 'normal';
    const baseFontSize = format.fontSize?.base || 11;
    const companyNameSize = format.fontSize?.companyName || 48;
    const headingSize = format.fontSize?.heading || 12;
    
    const colorMode = format.colorMode || 'color';
    const isBlackWhite = colorMode === 'black_white';
    
    const textColor = isBlackWhite ? '#000000' : '#212529';
    const headerBg = isBlackWhite ? '#ffffff' : '#f8f9fa';
    const tableBg = isBlackWhite ? '#f5f5f5' : '#e9ecef';
    const lightBg = isBlackWhite ? '#ffffff' : '#f8f9fa';
    const borderColor = isBlackWhite ? '#000000' : '#333333';
    const mutedText = isBlackWhite ? '#000000' : '#6c757d';
    const companyNameColor = isBlackWhite ? '#000000' : '#2c3e50';
    
    const hasLogo = showLogo && companySettings?.logo;

    const cellStyle = {
      border: `1px solid ${borderColor}`,
      padding: '4px 7px',
      fontSize: `${baseFontSize}px`,
      lineHeight: '1.2',
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      color: textColor
    };

    return (
      <div style={{ 
        width: '210mm',
        height: '297mm',
        margin: '0 auto',
        background: 'white',
        boxSizing: 'border-box',
        padding: '0',
        fontFamily: fontFamily,
        color: textColor
      }}>
        <div style={{
          border: `2px solid ${borderColor}`,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* HEADER with Logo */}
          <div style={{
            borderBottom: `2px solid ${borderColor}`,
            padding: '8px 10px 10px',
            background: headerBg,
            position: 'relative'
          }}>
            {hasLogo && (
              <div style={{
                position: 'absolute',
                left: logoPosition === 'left' ? '20px' : logoPosition === 'right' ? 'auto' : '50%',
                right: logoPosition === 'right' ? '20px' : 'auto',
                top: '50%',
                transform: logoPosition === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)'
              }}>
                <img 
                  src={companySettings.logo} 
                  alt="Logo" 
                  style={{ 
                    maxWidth: '90px', 
                    maxHeight: '90px', 
                    objectFit: 'contain',
                    filter: isBlackWhite ? 'grayscale(100%)' : 'none'
                  }}
                />
              </div>
            )}
            
            <div style={{
              textAlign: 'center',
              paddingLeft: hasLogo && logoPosition === 'left' ? '110px' : '0',
              paddingRight: hasLogo && logoPosition === 'right' ? '110px' : '0'
            }}>
              <div style={{ 
                fontSize: `${baseFontSize}px`, 
                fontStyle: 'italic', 
                textDecoration: 'underline', 
                color: mutedText
              }}>
                Tax Invoice
              </div>
              
              <div style={{ 
                fontSize: `${companyNameSize}px`, 
                fontWeight: 'bold', 
                letterSpacing: '10px', 
                fontFamily: 'Georgia, serif', 
                color: companyNameColor,
                lineHeight: '1.1',
                marginBottom: '3px'
              }}>
                {companySettings?.companyName || 'S S FABRICS'}
              </div>
              
              <div style={{ fontSize: `${baseFontSize}px`, color: textColor }}>
                {companySettings?.address}
              </div>
              
              <div style={{ fontSize: `${baseFontSize}px`, color: textColor }}>
                Mobile: {companySettings?.mobile}
              </div>
              
              <div style={{ 
                fontSize: `${baseFontSize - 1}px`, 
                fontStyle: 'italic', 
                color: mutedText,
                marginTop: '2px'
              }}>
                Subject to {companySettings?.city} Jurisdiction
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `2px solid ${borderColor}` }}>
            <tbody>
              <tr>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: lightBg}}>Invoice No.:</td>
                <td style={{...cellStyle, width: '35%', fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {invoice.billNumber}
                </td>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: lightBg}}>Transport:</td>
                <td style={{...cellStyle, width: '35%'}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>Date:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {new Date(invoice.date).toLocaleDateString('en-GB')}
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>Vehicle No.:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>State:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {companySettings?.state}
                  <span style={{ float: 'right', borderLeft: `1px solid ${borderColor}`, paddingLeft: '10px' }}>
                    Code: <b>{companySettings?.stateCode}</b>
                  </span>
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>L.R. No.:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>GSTIN:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {companySettings?.gstNumber}
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>Despatch To:</td>
                <td style={{...cellStyle}}></td>
              </tr>
            </tbody>
          </table>

          {/* Party Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `2px solid ${borderColor}` }}>
            <tbody>
              <tr>
                <td colSpan="2" style={{
                  ...cellStyle, 
                  fontWeight: 'bold', 
                  fontSize: `${headingSize}px`,
                  textAlign: 'center', 
                  borderRight: `2px solid ${borderColor}`, 
                  background: tableBg, 
                  padding: '6px'
                }}>
                  Buyer Details
                </td>
                <td colSpan="2" style={{
                  ...cellStyle, 
                  fontWeight: 'bold',
                  fontSize: `${headingSize}px`, 
                  textAlign: 'center', 
                  background: tableBg, 
                  padding: '6px'
                }}>
                  Consignee Details
                </td>
              </tr>
              <tr>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: lightBg}}>Name:</td>
                <td style={{...cellStyle, width: '35%', fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {invoice.partyDetails?.name}
                </td>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: lightBg}}>Name:</td>
                <td style={{...cellStyle, width: '35%'}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', verticalAlign: 'top', background: lightBg}}>Address:</td>
                <td style={{...cellStyle, borderRight: `2px solid ${borderColor}`, minHeight: '45px'}}>
                  {invoice.partyDetails?.address}
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', verticalAlign: 'top', background: lightBg}}>Address:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>GSTIN:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {invoice.partyDetails?.gstNumber}
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>GSTIN:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>State:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: `2px solid ${borderColor}`}}>
                  {invoice.partyDetails?.state}
                  <span style={{ float: 'right', borderLeft: `1px solid ${borderColor}`, paddingLeft: '10px' }}>
                    Code: <b>{invoice.partyDetails?.stateCode}</b>
                  </span>
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>State:</td>
                <td style={{...cellStyle}}></td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', flex: '1' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${borderColor}`, background: tableBg }}>
                <th style={{
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  padding: '6px 7px',
                  fontSize: `${headingSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: textColor,
                  width: '28%'
                }}>Description</th>
                <th style={{
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  padding: '6px 7px',
                  fontSize: `${headingSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: textColor,
                  width: '14%'
                }}>Bale No.</th>
                <th style={{
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  padding: '6px 7px',
                  fontSize: `${headingSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: textColor,
                  width: '15%'
                }}>Pieces</th>
                <th style={{
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  padding: '6px 7px',
                  fontSize: `${headingSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: textColor,
                  width: '14%'
                }}>Metres</th>
                <th style={{
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  padding: '6px 7px',
                  fontSize: `${headingSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: textColor,
                  width: '14%'
                }}>Rate/Mtr</th>
                <th style={{
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderTop: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  padding: '6px 7px',
                  fontSize: `${headingSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: textColor,
                  width: '15%'
                }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {baleRows.map((bale, index) => (
                <tr key={index} style={{ height: "28px" }}>
                  {index === 0 ? (
                    <td rowSpan={10} style={{ 
                      borderLeft: 'none',
                      borderRight: `1px solid ${borderColor}`,
                      borderTop: 'none',
                      borderBottom: 'none',
                      padding: '7px',
                      fontSize: `${baseFontSize}px`,
                      fontFamily: fontFamily,
                      fontWeight: fontWeight,
                      textAlign: "center", 
                      verticalAlign: "middle", 
                      background: lightBg,
                      color: textColor
                    }}>
                      <div style={{ fontWeight: "bold", fontSize: `${baseFontSize + 2}px` }}>
                        Quality: {invoice.qualityName}
                      </div>
                      <div style={{ fontSize: `${baseFontSize}px`, marginTop: '4px' }}>
                        HSN: <strong>{invoice.hsnCode || '5407'}</strong>
                      </div>
                    </td>
                  ) : null}
                  <td style={{ 
                    borderLeft: 'none',
                    borderRight: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    borderBottom: 'none',
                    padding: '4px 7px',
                    fontSize: `${baseFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    textAlign: "center",
                    color: textColor
                  }}>{bale.baleNo}</td>
                  <td style={{ 
                    borderLeft: 'none',
                    borderRight: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    borderBottom: 'none',
                    padding: '4px 7px',
                    fontSize: `${baseFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    textAlign: "center",
                    color: textColor
                  }}>{bale.pieces}</td>
                  <td style={{ 
                    borderLeft: 'none',
                    borderRight: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    borderBottom: 'none',
                    padding: '4px 7px',
                    fontSize: `${baseFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    textAlign: "center",
                    color: textColor
                  }}>
                    {bale.metres ? Math.round(bale.metres) : ""}
                  </td>
                  <td style={{ 
                    borderLeft: 'none',
                    borderRight: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    borderBottom: 'none',
                    padding: '4px 7px',
                    fontSize: `${baseFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: textColor
                  }}></td>
                  <td style={{ 
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none',
                    padding: '4px 7px',
                    fontSize: `${baseFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: textColor
                  }}></td>
                </tr>
              ))}
              
              {/* Total Row */}
              <tr style={{ borderTop: `2px solid ${borderColor}`, background: tableBg, height: '30px' }}>
                <td style={{ 
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${borderColor}`,
                  borderBottom: 'none',
                  padding: '5px 7px',
                  fontSize: `${baseFontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: textColor
                }}>Total:</td>
                <td style={{ 
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${borderColor}`,
                  borderBottom: 'none',
                  padding: '5px 7px',
                  fontSize: `${baseFontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: fontWeight,
                  color: textColor
                }}></td>
                <td style={{ 
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${borderColor}`,
                  borderBottom: 'none',
                  padding: '5px 7px',
                  fontSize: `${baseFontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: textColor
                }}>
                  {totals.totalPieces}
                </td>
                <td style={{ 
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${borderColor}`,
                  borderBottom: 'none',
                  padding: '5px 7px',
                  fontSize: `${baseFontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: textColor
                }}>
                  {Math.round(totals.totalMetres)}
                </td>
                <td style={{ 
                  borderLeft: 'none',
                  borderRight: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${borderColor}`,
                  borderBottom: 'none',
                  padding: '5px 7px',
                  fontSize: `${baseFontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: textColor
                }}>
                  {totals.ratePerMeter.toFixed(2)}
                </td>
                <td style={{ 
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderTop: `2px solid ${borderColor}`,
                  borderBottom: 'none',
                  padding: '5px 7px',
                  fontSize: `${baseFontSize}px`,
                  fontFamily: fontFamily,
                  fontWeight: "bold",
                  textAlign: "right",
                  color: textColor
                }}>
                  {totals.amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bank & Tax Section */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `1px double ${borderColor}` }}>
            <tbody>
              <tr>
                <td colSpan="2" style={{
                  ...cellStyle, 
                  fontWeight: 'bold',
                  fontSize: `${headingSize}px`, 
                  textAlign: 'center', 
                  borderRight: `2px solid ${borderColor}`, 
                  background: tableBg, 
                  padding: '6px'
                }}>
                  Bank Details
                </td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', width: '25%'}}>
                  {parseFloat(invoice.cgst) > 0 ? 'CGST @ 2.5%' : 'IGST @ 5%'}
                </td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', width: '15%'}}>
                  {parseFloat(invoice.cgst) > 0 ? totals.cgst.toFixed(2) : totals.igst.toFixed(2)}
                </td>
              </tr>
              
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg, width: '15%'}}>
                  {showBankDetails ? 'Bank:' : ''}
                </td>
                <td style={{...cellStyle, borderRight: `2px solid ${borderColor}`, width: '45%'}}>
                  {showBankDetails ? companySettings?.bankName : ''}
                </td>
                {parseFloat(invoice.cgst) > 0 ? (
                  <>
                    <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold'}}>SGST @ 2.5%</td>
                    <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold'}}>
                      {totals.sgst.toFixed(2)}
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{...cellStyle}}></td>
                    <td style={{...cellStyle}}></td>
                  </>
                )}
              </tr>
              
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>
                  {showBankDetails ? 'Account:' : ''}
                </td>
                <td style={{...cellStyle, borderRight: `2px solid ${borderColor}`}}>
                  {showBankDetails ? companySettings?.accountNumber : ''}
                </td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold'}}>Round Off:</td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold'}}>
                  {totals.roundOff >= 0 ? '+' : ''}{totals.roundOff.toFixed(2)}
                </td>
              </tr>
              
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>
                  {showBankDetails ? 'IFSC:' : ''}
                </td>
                <td style={{...cellStyle, borderRight: `2px solid ${borderColor}`}}>
                  {showBankDetails ? companySettings?.ifscCode : ''}
                </td>
                <td style={{...cellStyle}}></td>
                <td style={{...cellStyle}}></td>
              </tr>
              
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: lightBg}}>
                  {showBankDetails ? 'PAN:' : ''}
                </td>
                <td style={{...cellStyle, borderRight: `2px solid ${borderColor}`}}>
                  {showBankDetails ? companySettings?.panNumber : ''}
                </td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', background: tableBg}}>
                  Total:
                </td>
                <td style={{
                  ...cellStyle, 
                  textAlign: 'right', 
                  fontWeight: 'bold', 
                  fontSize: `${baseFontSize + 2}px`, 
                  background: tableBg
                }}>
                  ₹{totals.totalAmount}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in Words */}
          <div style={{ 
            borderBottom: `2px solid ${borderColor}`, 
            padding: '10px', 
            fontSize: `${baseFontSize}px`, 
            background: tableBg, 
            textAlign: 'center',
            fontFamily: fontFamily,
            color: textColor
          }}>
            <span style={{ fontWeight: 'normal' }}>Amount in Words:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>
              {numberToWords(totals.totalAmount)}
            </span>
          </div>

          {/* Terms & Signature */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{
                  ...cellStyle, 
                  width: '60%', 
                  verticalAlign: 'top', 
                  borderRight: `2px solid ${borderColor}`, 
                  borderBottom: 'none', 
                  background: lightBg, 
                  padding: '14px',
                  minHeight: '120px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: `${headingSize}px` }}>
                    Terms & Conditions
                  </div>
                  
                  {showTerms && (
                    <>
                      {companySettings?.terms?.invoice?.line1 && (
                        <div style={{ marginBottom: '6px', fontSize: `${baseFontSize}px` }}>
                          1) {companySettings.terms.invoice.line1}
                        </div>
                      )}
                      {companySettings?.terms?.invoice?.line2 && (
                        <div style={{ marginBottom: '6px', fontSize: `${baseFontSize}px` }}>
                          2) {companySettings.terms.invoice.line2}
                        </div>
                      )}
                      {companySettings?.terms?.invoice?.line3 && (
                        <div style={{ marginBottom: '6px', fontSize: `${baseFontSize}px` }}>
                          3) {companySettings.terms.invoice.line3}
                        </div>
                      )}
                      {companySettings?.terms?.invoice?.line4 && (
                        <div style={{ marginBottom: '6px', fontSize: `${baseFontSize}px` }}>
                          4) {companySettings.terms.invoice.line4}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td style={{...cellStyle, width: '40%', verticalAlign: 'top', borderBottom: 'none', padding: '14px'}}>
                  <div style={{ 
                    fontSize: `${baseFontSize + 1}px`, 
                    fontWeight: 'bold', 
                    textAlign: 'right', 
                    marginBottom: '80px' 
                  }}>
                    For <b>{companySettings?.companyName}</b>
                  </div>
                  {companySettings?.signatureImage && (
                    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                      <img 
                        src={companySettings.signatureImage} 
                        alt="Signature" 
                        style={{ 
                          maxWidth: '150px', 
                          maxHeight: '60px',
                          filter: isBlackWhite ? 'grayscale(100%)' : 'none'
                        }}
                      />
                    </div>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      borderTop: `1px solid ${borderColor}`, 
                      display: 'inline-block', 
                      minWidth: '200px', 
                      paddingTop: '8px', 
                      fontSize: `${baseFontSize}px`, 
                      textAlign: 'center' 
                    }}>
                      {companySettings?.signatureText || 'Authorized Signatory'}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
            View Tax Invoices
          </h1>
          <p className="text-base text-gray-600 font-medium">
            View and manage your tax invoices
          </p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md w-full md:w-auto md:hidden"
        >
          <Filter className="w-5 h-5" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
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

      {/* Filters Card */}
      <div className={`bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 transition-all ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">Filter Invoices</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Filter by Party:</label>
            <select 
              value={filterParty} 
              onChange={(e) => setFilterParty(e.target.value)} 
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
            >
              <option value="all">All Parties</option>
              {parties.map(party => (
                <option key={party._id} value={party._id}>{party.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Filter by Quality:</label>
            <select 
              value={filterQuality} 
              onChange={(e) => setFilterQuality(e.target.value)} 
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
            >
              <option value="all">All Qualities</option>
              {qualities.map(quality => (
                <option key={quality._id} value={quality._id}>{quality.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Invoices Found</h3>
          <p className="text-gray-600">
            {invoices.length === 0 
              ? "You haven't created any tax invoices yet." 
              : "No invoices match the selected filters."}
          </p>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={filteredInvoices}
          className="hover:bg-amber-50"
        />
      )}

      {/* Hidden Print Component */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm', overflow: 'hidden' }}>
        {selectedInvoice && (
          <div ref={printRef}>
            <PrintableInvoice />
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewInvoices;