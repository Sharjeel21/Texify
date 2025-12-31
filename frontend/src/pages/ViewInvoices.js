import React, { useState, useEffect, useRef } from 'react';
import { taxInvoiceAPI, companySettingsAPI } from '../services/api';
import { useReactToPrint } from 'react-to-print';

function ViewInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const printRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
    fetchCompanySettings();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await taxInvoiceAPI.getAll();
      setInvoices(response.data);
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax invoice? This will mark the associated challans as unsold.')) {
      try {
        await taxInvoiceAPI.delete(id);
        setMessage({ type: 'success', text: 'Tax invoice deleted successfully!' });
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

  const PrintableInvoice = () => {
    const invoice = selectedInvoice;
    if (!invoice) return null;

    const totals = calculateTotals(invoice);
    const baleRows = extractBales(invoice);
    
    // Extract all settings with proper defaults
    const format = companySettings?.invoiceFormat || {};
    
    // Display settings
    const showLogo = format.showLogo !== false;
    const logoPosition = format.logoPosition || 'left';
    const showBankDetails = format.showBankDetails !== false;
    const showTerms = format.showTerms !== false;
    
    // Typography settings
    const fontFamily = format.fontFamily || 'Segoe UI';
    const fontWeight = format.fontWeight || 'normal';
    const baseFontSize = format.fontSize?.base || 11;
    const companyNameSize = format.fontSize?.companyName || 48;
    const headingSize = format.fontSize?.heading || 12;
    
    // Color mode
    const colorMode = format.colorMode || 'color';
    const isBlackWhite = colorMode === 'black_white';
    
    // Dynamic colors based on mode
    const textColor = isBlackWhite ? '#000000' : '#212529';
    const headerBg = isBlackWhite ? '#ffffff' : '#f8f9fa';
    const tableBg = isBlackWhite ? '#f5f5f5' : '#e9ecef';
    const lightBg = isBlackWhite ? '#ffffff' : '#f8f9fa';
    const borderColor = isBlackWhite ? '#000000' : '#333333';
    const mutedText = isBlackWhite ? '#000000' : '#6c757d';
    const companyNameColor = isBlackWhite ? '#000000' : '#2c3e50';
    
    const hasLogo = showLogo && companySettings?.logo;

    // Base cell style with applied settings
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
            {/* Logo - positioned based on settings */}
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
            
            {/* Company details - centered with padding for logo */}
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

          {/* Items Table - UPDATED WITH BORDERLESS ROWS */}
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
    <div className="page-container">
      <h1 className="page-title">View Tax Invoices</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Bill No.</th>
              <th>Date</th>
              <th>Party</th>
              <th>Quality</th>
              <th>Challans</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td><strong>{invoice.billNumber}</strong></td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>{invoice.partyDetails?.name}</td>
                <td>{invoice.qualityName}</td>
                <td>{invoice.challanDetails?.length} challan(s)</td>
                <td><strong>₹{Math.round(invoice.totalAmount)}</strong></td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setTimeout(handlePrint, 100);
                    }}
                    className="btn btn-primary btn-small"
                    style={{ marginRight: '0.5rem' }}
                  >
                    Print
                  </button>
                  <button
                    onClick={() => handleDelete(invoice._id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
            No tax invoices found.
          </p>
        )}
      </div>

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintableInvoice />
        </div>
      </div>
    </div>
  );
}

export default ViewInvoices;