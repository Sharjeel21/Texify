// frontend/src/pages/VeiwInvoices.js
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
    const hasLogo = companySettings?.logo;

    const cellStyle = {
      border: '1px solid #666',
      padding: '4px 7px',
      fontSize: '11px',
      lineHeight: '1.2'
    };

    return (
      <div style={{ 
        width: '210mm',
        height: '297mm',
        margin: '0 auto',
        background: 'white',
        boxSizing: 'border-box',
        padding: '0'
      }}>
        <div style={{
          border: '2px solid #333',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* COMPANY NAME & ADDRESS - WITH OR WITHOUT LOGO */}
          <div style={{
            borderBottom: '2px solid #333',
            padding: '8px 10px 10px',
            background: '#f8f9fa',
            position: 'relative'
          }}>
            {/* Logo Section - Only show if logo exists - Positioned absolutely on left */}
            {hasLogo && (
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={companySettings.logo} 
                  alt="Company Logo" 
                  style={{
                    maxWidth: '90px',
                    maxHeight: '90px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Company Details Section - Always centered */}
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: hasLogo ? '110px' : '0',
              paddingRight: hasLogo ? '110px' : '0'
            }}>
              {/* TAX INVOICE - Smaller, underlined, italic */}
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                fontWeight: '500',
                fontStyle: 'italic',
                textDecoration: 'underline',
                letterSpacing: '0.5px',
                color: '#6c757d'
              }}>Tax Invoice</div>
              
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                letterSpacing: '10px',
                fontFamily: 'Georgia, serif',
                marginBottom: '6px',
                color: '#2c3e50'
              }}>
                {companySettings?.companyName || 'S S FABRICS'}
              </div>
              
              <div style={{ fontSize: '11px', marginBottom: '2px', color: '#495057' }}>
                {companySettings?.address || 'S. No. 133, P. No. 107, Golden Nagar, Malegaon - 423203 (Nasik)'}
              </div>
              
              <div style={{ fontSize: '11px', marginBottom: '2px', color: '#495057' }}>
                Mobile No. {companySettings?.mobile || '9823671261'}
              </div>
              
              <div style={{ fontSize: '10px', marginTop: '6px', color: '#6c757d', fontStyle: 'italic' }}>
                Subject to {companySettings?.city} Jurisdiction
              </div>
            </div>
          </div>

          {/* INVOICE & TRANSPORT DETAILS */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #333' }}>
            <tbody>
              <tr>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: '#f8f9fa'}}>Reverso:</td>
                <td style={{...cellStyle, width: '35%', borderRight: '2px solid #333'}}></td>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: '#f8f9fa'}}>Transport Name:</td>
                <td style={{...cellStyle, width: '35%'}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>Invoice No.:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: '2px solid #333'}}>{invoice.billNumber}</td>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>Vehicle No.:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>Invoice Date:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: '2px solid #333'}}>
                  {new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>L.R. No. & Date:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>State:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: '2px solid #333'}}>
                  {companySettings?.state || 'Maharashtra'}
                  <span style={{ float: 'right', borderLeft: '1px solid #666', paddingLeft: '10px', marginLeft: '10px' }}>
                    Code: <b>{companySettings?.stateCode || '27'}</b>
                  </span>
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>Despatch To:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>GSTIN:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: '2px solid #333'}}>{companySettings?.gstNumber || '27AKTPS4299Q1ZN'}</td>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>Place of Supply:</td>
                <td style={{...cellStyle}}></td>
              </tr>
            </tbody>
          </table>

          {/* BUYER & CONSIGNEE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #333' }}>
            <tbody>
              <tr>
                <td colSpan="2" style={{...cellStyle, fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #333', fontSize: '11px', background: '#e9ecef', color: '#2c3e50', padding: '6px'}}>
                  Name & Address of Buyer
                </td>
                <td colSpan="2" style={{...cellStyle, fontWeight: 'bold', textAlign: 'center', fontSize: '11px', background: '#e9ecef', color: '#2c3e50', padding: '6px'}}>
                  Name & Address of Consignee
                </td>
              </tr>
              <tr>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: '#f8f9fa'}}>Name:</td>
                <td style={{...cellStyle, width: '35%', fontWeight: 'bold', borderRight: '2px solid #333'}}>{invoice.partyDetails?.name}</td>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: '#f8f9fa'}}>Name:</td>
                <td style={{...cellStyle, width: '35%'}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', verticalAlign: 'top', background: '#f8f9fa'}}>Address:</td>
                <td style={{...cellStyle, borderRight: '2px solid #333', minHeight: '45px'}}>{invoice.partyDetails?.address}</td>
                <td style={{...cellStyle, fontWeight: 'bold', verticalAlign: 'top', background: '#f8f9fa'}}>Address:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>GSTIN:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: '2px solid #333'}}>{invoice.partyDetails?.gstNumber}</td>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>GSTIN:</td>
                <td style={{...cellStyle}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>State:</td>
                <td style={{...cellStyle, fontWeight: 'bold', borderRight: '2px solid #333'}}>
                  {invoice.partyDetails?.state || 'MAHARASHTRA'}
                  <span style={{ float: 'right', borderLeft: '1px solid #666', paddingLeft: '10px', marginLeft: '10px' }}>
                    Code: <b>{invoice.partyDetails?.stateCode || '27'}</b>
                  </span>
                </td>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>State:</td>
                <td style={{...cellStyle}}>
                  <span style={{ float: 'right', borderLeft: '1px solid #666', paddingLeft: '10px', width:'70px' }}>Code:</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ITEMS TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', flex: '1' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333', background: '#e9ecef' }}>
                <th style={{...cellStyle, width: '28%', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#2c3e50', padding: '8px'}}>Description of Goods</th>
                <th style={{...cellStyle, width: '14%', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#2c3e50', borderLeft: '1px solid #666', padding: '8px'}}>Bale Nos.</th>
                <th style={{...cellStyle, width: '15%', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#2c3e50', borderLeft: '1px solid #666', padding: '8px'}}>No. of Pieces</th>
                <th style={{...cellStyle, width: '14%', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#2c3e50', borderLeft: '1px solid #666', padding: '8px'}}>Metres</th>
                <th style={{...cellStyle, width: '14%', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#2c3e50', borderLeft: '1px solid #666', padding: '8px'}}>Rate/Mtr</th>
                <th style={{...cellStyle, width: '15%', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', color: '#2c3e50', borderLeft: '1px solid #666', padding: '8px'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...baleRows,
                ...Array(10 - baleRows.length).fill({})
              ].map((bale, index) => (
                <tr key={index} style={{ height: "28px" }}>
                  
                  {index === 0 ? (
                    <td
                      rowSpan={10}
                      style={{
                        border: "none",
                        borderRight: "1px solid #666",
                        background: "#f8f9fa",
                        textAlign: "center",
                        verticalAlign: "middle",
                        fontSize: "12px",
                        width: "120px",
                        padding: "4px"
                      }}
                    >
                      <div style={{ margin: "2px 0", fontSize: "13px", fontWeight: "bold" }}>
                        Quality: {invoice.qualityName || "N/A"}
                      </div>
                      <div style={{ fontSize: "11px", margin: "2px 0" }}>
                       HSN Code: <strong>{invoice.hsnCode || '5407'}</strong>
                      </div>

                    </td>
                  ) : null}

                  <td
                    style={{
                      border: "none",
                      borderLeft: "1px solid #666",
                      borderRight: "1px solid #666",
                      padding: "4px",
                      textAlign: "center",
                      fontSize: "12px"
                    }}
                  >
                    {bale.baleNo || ""}
                  </td>

                  <td
                    style={{
                      border: "none",
                      borderRight: "1px solid #666",
                      padding: "4px",
                      textAlign: "center",
                      fontSize: "12px"
                    }}
                  >
                    {bale.pieces || ""}
                  </td>

                  <td
                    style={{
                      border: "none",
                      borderRight: "1px solid #666",
                      padding: "4px",
                      textAlign: "center",
                      fontSize: "12px"
                    }}
                  >
                    {bale.metres ? Math.round(bale.metres) : ""}
                  </td>

                  <td
                    style={{
                      border: "none",
                      borderRight: "1px solid #666",
                      padding: "4px"
                    }}
                  ></td>

                  <td
                    style={{
                      border: "none",
                      borderRight: "1px solid #666",
                      padding: "4px"
                    }}
                  ></td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr
                style={{
                  borderTop: "2px solid #333",
                  borderBottom: "2px solid #333",
                  background: "#e9ecef",
                  height: "28px"
                }}
              >
                <td
                  style={{
                    border: "none",
                    borderRight: "1px solid #666",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "12px",
                    padding: "2px"
                  }}
                >
                  Total:
                </td>

                <td
                  style={{
                    border: "none",
                    borderLeft: "1px solid #666",
                    borderRight: "1px solid #666",
                    padding: "2px"
                  }}
                ></td>

                <td
                  style={{
                    border: "none",
                    borderRight: "1px solid #666",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "12px",
                    padding: "2px"
                  }}
                >
                  {totals.totalPieces}
                </td>

                <td
                  style={{
                    border: "none",
                    borderRight: "1px solid #666",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "12px",
                    padding: "2px"
                  }}
                >
                  {Math.round(totals.totalMetres)}
                </td>

                <td
                  style={{
                    border: "none",
                    borderRight: "1px solid #666",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "11px",
                    padding: "2px"
                  }}
                >
                  {totals.ratePerMeter}
                </td>

                <td
                  style={{
                    border: "none",
                    borderRight: "1px solid #666",
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: "12px",
                    padding: "2px"
                  }}
                >
                  {totals.amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* BANK DETAILS & TAX */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px double #333' }}>
            <tbody>
              <tr>
                <td colSpan="2" style={{...cellStyle, fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #333', fontSize: '11px', background: '#e9ecef', color: '#2c3e50', padding: '6px'}}>
                  Bank Details
                </td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>
                  {parseFloat(invoice.cgst) > 0 ? 'Add CGST @ 2.5%' : 'Add IGST @ 5%'}
                </td>
                <td style={{...cellStyle, width: '18%', textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>
                  {parseFloat(invoice.cgst) > 0 ? totals.cgst.toFixed(2) : totals.igst.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{...cellStyle, width: '15%', fontWeight: 'bold', background: '#f8f9fa'}}>Bank Name:</td>
                <td style={{...cellStyle, width: '35%', borderRight: '2px solid #333', fontSize: '10px'}}>{companySettings?.bankName || ''}</td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>
                  {parseFloat(invoice.cgst) > 0 ? 'Add SGST @ 2.5%' : ''}
                </td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>
                  {parseFloat(invoice.cgst) > 0 ? totals.sgst.toFixed(2) : ''}
                </td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>Account No.:</td>
                <td style={{...cellStyle, borderRight: '2px solid #333', fontSize: '10px'}}>{companySettings?.accountNumber || ''}</td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>Round Off:</td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>
                  {totals.roundOff >= 0 ? '+' : ''}{totals.roundOff.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>IFSC Code:</td>
                <td style={{...cellStyle, borderRight: '2px solid #333', fontSize: '10px'}}>{companySettings?.ifscCode || ''}</td>
                 <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}></td>
                 <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}></td>
              </tr>
              <tr>
                <td style={{...cellStyle, fontWeight: 'bold', background: '#f8f9fa'}}>PAN No:</td>
                <td style={{...cellStyle, borderRight: '2px solid #333', fontSize: '10px'}}>{companySettings?.panNumber || ''}</td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', background: '#e9ecef', fontSize: '11px'}}>Total Amount:</td>
                <td style={{...cellStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '13px', background: '#e9ecef'}}>₹{totals.totalAmount}</td>
              </tr>
            </tbody>
          </table>

          {/* AMOUNT IN WORDS */}
          <div
            style={{
              borderBottom: '2px solid #333',
              padding: '10px',
              fontSize: '11px',
              background: '#e9ecef',
              textAlign: 'center'
            }}
          >
            <span style={{ fontWeight: 'normal', color: '#000000ff' }}>
              Amount in Words:
            </span>
            <span style={{ fontWeight: 'bold', marginLeft: '8px', color: '#495057' }}>
              {numberToWords(totals.totalAmount)}
            </span>
          </div>

          {/* TERMS & SIGNATURE */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{...cellStyle, width: '60%', verticalAlign: 'center', borderRight: '2px solid #333', borderBottom: 'none', background: '#f8f9fa', padding: '14px'}}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '12px', color: '#2c3e50' }}>Terms & Conditions</div>
                  {companySettings?.termsLine1 && (
                    <div style={{ marginBottom: '6px', lineHeight: '1.6', fontSize: '10px', color: '#495057' }}>1) {companySettings.termsLine1}</div>
                  )}
                  {companySettings?.termsLine2 && (
                    <div style={{ marginBottom: '6px', lineHeight: '1.6', fontSize: '10px', color: '#495057' }}>2) {companySettings.termsLine2}</div>
                  )}
                  {companySettings?.termsLine3 && (
                    <div style={{ marginBottom: '6px', lineHeight: '1.6', fontSize: '10px', color: '#495057' }}>3) {companySettings.termsLine3}</div>
                  )}
                  {companySettings?.termsLine4 && (
                    <div style={{ marginBottom: '6px', lineHeight: '1.6', fontSize: '10px', color: '#495057' }}>4) {companySettings.termsLine4}</div>
                  )}
                </td>
                <td style={{...cellStyle, width: '40%', verticalAlign: 'top', borderBottom: 'none', padding: '14px'}}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'right', marginBottom: '100px', color: '#2c3e50' }}>
                    For <b>{companySettings?.companyName}</b>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '40px' }}>
                    <div style={{ 
                      borderTop: '1px solid #666', 
                      display: 'inline-block', 
                      minWidth: '200px', 
                      paddingTop: '8px', 
                      fontSize: '11px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      Proprietor / Authorized Signatory
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
        <div ref={printRef} className="invoice-print-container">
          <style>{`
            @media print {
              @page {
                size: A4 portrait !important;
                margin: 8mm !important;
              }
              .invoice-print-container {
                width: 210mm !important;
                height: 297mm !important;
              }
              body {
                width: 210mm !important;
                height: 297mm !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}</style>
          <PrintableInvoice />
        </div>
      </div>
    </div>
  );
}

export default ViewInvoices;