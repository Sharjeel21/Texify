// frontend/src/pages/InvoiceDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';
import '../components/InvoicePrint.css';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [invoiceResponse, companyResponse] = await Promise.all([
        api.get(`/api/tax-invoices/${id}`),
        api.get('/api/company-settings')
      ]);
      
      setInvoiceData(invoiceResponse.data);
      setCompanySettings(companyResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper functions
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseFloat(num).toString();
  };

  const formatDecimal = (num) => {
    if (num === null || num === undefined) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  const formatWhole = (num) => {
    if (num === null || num === undefined) return '0';
    return Math.round(num).toString();
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

    return convertToWords(Math.round(num)).trim() + ' Rupees Only';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 p-6 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Invoice Not Found</h3>
            <p className="text-sm">The requested invoice could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const calculateTotals = () => {
    const totalPieces = invoiceData.totalPieces || 0;
    const totalMetres = parseFloat(invoiceData.totalMeters) || 0;
    // ALWAYS use discounted rate for display on bill
    const discountedRate = parseFloat(invoiceData.discountedRate) || 0;
    const subtotal = parseFloat(invoiceData.subtotal) || 0;
    const cgst = parseFloat(invoiceData.cgst) || 0;
    const sgst = parseFloat(invoiceData.sgst) || 0;
    const igst = parseFloat(invoiceData.igst) || 0;
    const roundOff = parseFloat(invoiceData.roundOff) || 0;
    const totalAmount = invoiceData.totalAmount || 0;
    
    return { totalPieces, totalMetres, discountedRate, subtotal, cgst, sgst, igst, roundOff, totalAmount };
  };

  const getAllBales = () => {
    if (!invoiceData.challanDetails) return [];
    
    const bales = [];
    invoiceData.challanDetails.forEach(challan => {
      if (challan.bales) {
        challan.bales.forEach(bale => {
          bales.push({
            baleNo: bale.baleNumber,
            pieces: bale.numberOfPieces,
            metres: formatNumber(bale.totalMeter)
          });
        });
      }
    });
    return bales;
  };

  const totals = calculateTotals();
  const bales = getAllBales();

  return (
    <div className="invoice-wrapper min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <button 
            onClick={() => navigate('/view-invoices')} 
            className="inline-flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Invoices
          </button>
          <button 
            onClick={handlePrint} 
            className="inline-flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
          >
            <Printer className="w-5 h-5" />
            Print Invoice
          </button>
        </div>
      </div>

      <div className="invoice-container">
        <div className="invoice-page">
          
          {/* HEADER - TAX INVOICE */}
          <table className="invoice-table full-width">
            <tbody>
              <tr>
                <td colSpan="2" className="header-title">TAX INVOICE</td>
              </tr>
            </tbody>
          </table>

          {/* COMPANY NAME & ADDRESS */}
          <table className="invoice-table full-width">
            <tbody>
              <tr>
                <td colSpan="2" className="company-name">{companySettings?.companyName || 'S S FABRICS'}</td>
              </tr>
              <tr>
                <td colSpan="2" className="center small-text">{companySettings?.address || ''}</td>
              </tr>
              <tr>
                <td colSpan="2" className="center small-text">Mobile No. {companySettings?.mobile || ''}</td>
              </tr>
              <tr>
                <td colSpan="2" className="center small-text underline">
                  Subject to {companySettings?.jurisdiction || 'MALEGAON'} Jurisdiction
                </td>
              </tr>
            </tbody>
          </table>

          {/* INVOICE DETAILS & TRANSPORT */}
          <table className="invoice-table full-width">
            <tbody>
              <tr>
                <td className="label-cell">Reverse:</td>
                <td className="value-cell">{invoiceData.reverso || ''}</td>
                <td className="label-cell">Transport Name:</td>
                <td className="value-cell">{invoiceData.transportName || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">Invoice No.:</td>
                <td className="value-cell bold">{invoiceData.billNumber || ''}</td>
                <td className="label-cell">Vehicle No.:</td>
                <td className="value-cell">{invoiceData.vehicleNo || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">Invoice Date:</td>
                <td className="value-cell bold">{new Date(invoiceData.date).toLocaleDateString() || ''}</td>
                <td className="label-cell">L.R. No. & Date:</td>
                <td className="value-cell">{invoiceData.lrNo || ''} {invoiceData.lrDate || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">State:</td>
                <td className="value-cell bold">
                  {companySettings?.state || 'Maharashtra'}
                  <span className="state-code">Code: <b>{companySettings?.stateCode || '27'}</b></span>
                </td>
                <td className="label-cell">Despatch To:</td>
                <td className="value-cell">{invoiceData.despatchTo || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">GSTIN:</td>
                <td className="value-cell bold">{companySettings?.gstNumber || ''}</td>
                <td className="label-cell">Place of Supply</td>
                <td className="value-cell">{invoiceData.partyDetails?.state || ''}</td>
              </tr>
            </tbody>
          </table>

          {/* BUYER & CONSIGNEE */}
          <table className="invoice-table full-width">
            <tbody>
              <tr>
                <td colSpan="2" className="section-header">Name & Address of Buyer</td>
                <td colSpan="2" className="section-header">Name & Address of Consignee</td>
              </tr>
              <tr>
                <td className="label-cell">Name:</td>
                <td className="value-cell bold">{invoiceData.partyDetails?.name || ''}</td>
                <td className="label-cell">Name:</td>
                <td className="value-cell">{invoiceData.consigneeName || invoiceData.partyDetails?.name || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">Address:</td>
                <td className="value-cell">{invoiceData.partyDetails?.address || ''}</td>
                <td className="label-cell">Address:</td>
                <td className="value-cell">{invoiceData.consigneeAddress || invoiceData.partyDetails?.address || ''}</td>
              </tr>
              <tr>
                <td colSpan="2" className="empty-row"></td>
                <td colSpan="2" className="empty-row"></td>
              </tr>
              <tr>
                <td className="label-cell">GSTIN:</td>
                <td className="value-cell bold">{invoiceData.partyDetails?.gstNumber || ''}</td>
                <td className="label-cell">GSTIN:</td>
                <td className="value-cell">{invoiceData.consigneeGSTIN || invoiceData.partyDetails?.gstNumber || ''}</td>
              </tr>
              <tr>
                <td className="label-cell">State:</td>
                <td className="value-cell bold">
                  {invoiceData.partyDetails?.state || ''}
                  <span className="state-code">Code: <b>{invoiceData.partyDetails?.stateCode || ''}</b></span>
                </td>
                <td className="label-cell">State:</td>
                <td className="value-cell">
                  {invoiceData.consigneeState || invoiceData.partyDetails?.state || ''}
                  <span className="state-code">Code: <b>{invoiceData.partyDetails?.stateCode || ''}</b></span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ITEMS TABLE */}
          <table className="invoice-table full-width items-table">
            <thead>
              <tr>
                <th className="desc-col">Description of Goods</th>
                <th className="bale-col">Bale Nos.</th>
                <th className="pieces-col">No. of<br/>Pieces</th>
                <th className="metres-col">Metres</th>
                <th className="rate-col">Rate per<br/>Metre</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bales.map((bale, index) => (
                <tr key={index}>
                  <td className="desc-col">
                    {index === 0 && (invoiceData.qualityName || '')}
                  </td>
                  <td className="bale-col center bold">{bale.baleNo}</td>
                  <td className="pieces-col center bold">{bale.pieces}</td>
                  <td className="metres-col center bold">{bale.metres}</td>
                  <td className="rate-col"></td>
                  <td className="amount-col"></td>
                </tr>
              ))}
              
              {/* HSN Code Row */}
              <tr className="hsn-row">
                <td className="desc-col">
                  <b>HSN Code:</b> <span className="hsn-value">{invoiceData.hsnCode || '54076900'}</span>
                </td>
                <td className="bale-col"></td>
                <td className="pieces-col"></td>
                <td className="metres-col"></td>
                <td className="rate-col"></td>
                <td className="amount-col"></td>
              </tr>

              {/* Total Row */}
              <tr className="total-row">
                <td className="desc-col center bold">Total:</td>
                <td className="bale-col"></td>
                <td className="pieces-col center bold">{totals.totalPieces}</td>
                <td className="metres-col center bold">{formatNumber(totals.totalMetres)}</td>
                <td className="rate-col center bold">{formatNumber(totals.discountedRate)}</td>
                <td className="amount-col right bold">{formatDecimal(totals.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* BANK DETAILS & TAX SUMMARY */}
          <table className="invoice-table full-width">
            <tbody>
              <tr>
                <td colSpan="2" className="section-header">Bank Details:</td>
                <td className="tax-label right">Total Amount Before Tax:</td>
                <td className="tax-value right bold">{formatDecimal(totals.subtotal)}</td>
              </tr>
              <tr>
                <td className="label-cell">Bank Name:</td>
                <td className="value-cell">{companySettings?.bankName || ''}</td>
                {parseFloat(totals.cgst) > 0 && (
                  <>
                    <td className="tax-label right">Add CGST @ 2.5%</td>
                    <td className="tax-value right bold">{formatDecimal(totals.cgst)}</td>
                  </>
                )}
                {parseFloat(totals.igst) > 0 && (
                  <>
                    <td className="tax-label right">Add IGST @ 5%</td>
                    <td className="tax-value right bold">{formatDecimal(totals.igst)}</td>
                  </>
                )}
              </tr>
              <tr>
                <td className="label-cell">Account No.:</td>
                <td className="value-cell">{companySettings?.accountNumber || ''}</td>
                {parseFloat(totals.sgst) > 0 && (
                  <>
                    <td className="tax-label right">Add SGST @ 2.5%</td>
                    <td className="tax-value right bold">{formatDecimal(totals.sgst)}</td>
                  </>
                )}
                {parseFloat(totals.igst) > 0 && (
                  <>
                    <td className="tax-label right"></td>
                    <td className="tax-value right bold"></td>
                  </>
                )}
              </tr>
              <tr>
                <td className="label-cell">IFSC Code:</td>
                <td className="value-cell">{companySettings?.ifscCode || ''}</td>
                <td className="tax-label right">Tax Amount:</td>
                <td className="tax-value right bold">
                  {formatDecimal(parseFloat(totals.cgst) + parseFloat(totals.sgst) + parseFloat(totals.igst))}
                </td>
              </tr>
              <tr>
                <td className="label-cell">Branch:</td>
                <td className="value-cell">{companySettings?.branchName || ''}</td>
                <td className="tax-label right">Round Off:</td>
                <td className="tax-value right bold">
                  {parseFloat(totals.roundOff) >= 0 ? '+' : ''} {formatDecimal(totals.roundOff)}
                </td>
              </tr>
              <tr>
                <td colSpan="2"></td>
                <td className="tax-label right bold">Total Amount After Tax:</td>
                <td className="tax-value right bold">{formatWhole(totals.totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          {/* AMOUNT IN WORDS */}
          <table className="invoice-table full-width">
            <tbody>
              <tr>
                <td className="words-row">
                  <b>Total Amount in Words:</b> <span style={{marginLeft: '20px'}}>{numberToWords(totals.totalAmount)}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* TERMS & SIGNATURE */}
          <table className="invoice-table full-width terms-table">
            <tbody>
              <tr>
                <td className="terms-cell">
                  <div className="terms-amount">E. & O.E.</div>
                  {companySettings?.termsLine1 && <div className="term-item">1) {companySettings.termsLine1}</div>}
                  {companySettings?.termsLine2 && <div className="term-item">2) {companySettings.termsLine2}</div>}
                  {companySettings?.termsLine3 && <div className="term-item">3) {companySettings.termsLine3}</div>}
                  {companySettings?.termsLine4 && <div className="term-item">4) {companySettings.termsLine4}</div>}
                </td>
                <td className="signature-cell">
                  <div className="signature-for">For <b>{companySettings?.companyName || 'S S FABRICS'}</b></div>
                  <div className="signature-line">
                    <div className="signature-text">Proprietor / Authorized Signatory</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;