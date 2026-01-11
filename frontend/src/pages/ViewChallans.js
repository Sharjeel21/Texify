  import React, { useState, useEffect, useRef } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { deliveryChallanAPI, qualityAPI, companySettingsAPI } from '../services/api';
  import { useReactToPrint } from 'react-to-print';
  import { formatDate } from '../utils/formatters';

  function ViewChallans() {
    const navigate = useNavigate();
    const [challans, setChallans] = useState([]);
    const [qualities, setQualities] = useState([]);
    const [companySettings, setCompanySettings] = useState(null);
    const [selectedChallan, setSelectedChallan] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterQuality, setFilterQuality] = useState('all');
    const printRef = useRef();

    useEffect(() => {
      fetchQualities();
      fetchChallans();
      fetchCompanySettings();
    }, []);

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

    const fetchQualities = async () => {
      try {
        const response = await qualityAPI.getAll();
        setQualities(response.data);
      } catch (error) {
        console.error('Error fetching qualities:', error);
      }
    };

    const fetchChallans = async () => {
      try {
        const response = await deliveryChallanAPI.getAll();
        setChallans(response.data);
      } catch (error) {
        console.error('Error fetching challans:', error);
      }
    };

    const handleContinue = (challan) => {
      navigate(`/delivery-challan/add-bales/${challan._id}`);
    };

    const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this delivery challan?')) {
        try {
          await deliveryChallanAPI.delete(id);
          setMessage({ type: 'success', text: 'Delivery challan deleted successfully!' });
          fetchChallans();
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
          setMessage({ type: 'error', text: error.response?.data?.message || 'Error deleting delivery challan!' });
        }
      }
    };

    const handlePrint = useReactToPrint({
      contentRef: printRef,
      pageStyle: `
        @page {
          size: A4 landscape;
          margin: 4mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: initial !important;
            overflow: initial !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `
    });

    // First filter by quality
  const getQualityFilteredChallans = () => {
    if (filterQuality === 'all') {
      return challans;
    }
    return challans.filter(c => c.quality && c.quality._id === filterQuality);
  };

  // Then apply status filter
  const getFilteredChallans = () => {
    let filtered = getQualityFilteredChallans();

    if (filterStatus === 'sold') {
      filtered = filtered.filter(c => c.isSold);
    } else if (filterStatus === 'incomplete') {
      filtered = filtered.filter(c => c.status === 'incomplete' && !c.isSold);
    } else if (filterStatus === 'complete') {
      filtered = filtered.filter(c => c.status === 'complete' && !c.isSold);
    }

    return filtered;
  };

  // Get counts based on quality-filtered challans
  const getStatusCounts = () => {
    const qualityFiltered = getQualityFilteredChallans();
    return {
      all: qualityFiltered.length,
      incomplete: qualityFiltered.filter(c => c.status === 'incomplete' && !c.isSold).length,
      complete: qualityFiltered.filter(c => c.status === 'complete' && !c.isSold).length,
      sold: qualityFiltered.filter(c => c.isSold).length
    };
  };

    const filteredChallans = getFilteredChallans();
  const statusCounts = getStatusCounts();

    const getBaleNumbers = (challan) => {
      if (challan.bales.length === 0) return 'No bales';
      if (challan.bales.length === 1) return `Bale #${challan.bales[0].baleNumber}`;
      const baleNums = challan.bales.map(b => b.baleNumber).sort((a, b) => a - b);
      return `Bales #${baleNums[0]} to #${baleNums[baleNums.length - 1]}`;
    };

    const generateEmptyRows = (existingPieces, expectedPieces) => {
      const emptyRowsNeeded = Math.max(0, expectedPieces - existingPieces);
      return Array(emptyRowsNeeded).fill(null);
    };

    const PrintableChallan = React.forwardRef((props, ref) => {
      const { challan, settings } = props;
      if (!challan) return null;

      // Get challan format settings with proper defaults
      const format = settings?.challanFormat || {};
      
      // Display settings
      const showLogo = format.showLogo !== false;
      const logoPosition = format.logoPosition || 'left';
      const showGanthPress = format.showGanthPress !== false;
      const showWeights = format.showWeights !== false;
      
      // Typography settings
      const fontFamily = format.fontFamily || 'Segoe UI';
      const fontWeight = format.fontWeight || 'normal';
      const baseFontSize = format.fontSize?.base || 11;
      const companyNameSize = format.fontSize?.companyName || 22;
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
      
      // Get preferences
      const dateFormat = settings?.preferences?.dateFormat || 'DD/MM/YYYY';
      const footerNote = settings?.terms?.challan?.line1 || 
        'Any type of complaint regarding weight and folding will be entertained within 48Hrs.';

      const balesArray = challan.bales;
      const baleCount = balesArray.length;
      const hasLogo = showLogo && settings?.logo;

      const pages = [];
      if (baleCount <= 5) {
        pages.push(balesArray);
      } else {
        for (let i = 0; i < balesArray.length; i += 4) {
          pages.push(balesArray.slice(i, i + 4));
        }
      }

      return (
        <div 
          ref={ref} 
          className="print-container"
          style={{ 
            width: '297mm',
            background: 'white'
          }}
        >
          {pages.map((pageBales, pageIndex) => {
            const columnCount = pageBales.length;
            const columnWidth = columnCount === 5 ? '19%' : '24%';

            return (
              <div 
                key={pageIndex} 
                style={{
                  width: '297mm',
                  height: '202mm',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: columnCount === 5 ? '2.5mm' : '3mm',
                  padding: '4mm',
                  boxSizing: 'border-box',
                  pageBreakBefore: pageIndex > 0 ? 'always' : 'auto',
                  pageBreakAfter: 'auto',
                  pageBreakInside: 'avoid'
                }}
              >
                {pageBales.map((bale, baleIndex) => {
                  const emptyRows = generateEmptyRows(
                    bale.cloths.length,
                    challan.expectedPiecesPerBale
                  );

                  return (
                    <div key={baleIndex} style={{
                      width: columnWidth,
                      flex: `0 0 ${columnWidth}`,
                      border: `2px solid ${borderColor}`,
                      boxSizing: 'border-box',
                      fontFamily: fontFamily,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'white',
                      position: 'relative',
                      height: '100%'
                    }}>
                      
                      {/* Logo Watermark - Only if enabled */}
                      {hasLogo && (
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          bottom: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 0,
                          opacity: 0.08,
                          pointerEvents: 'none',
                          padding: '20px'
                        }}>
                          <img 
                            src={settings.logo} 
                            alt="" 
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              filter: isBlackWhite ? 'grayscale(100%)' : 'grayscale(100%)'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Header */}
                      <div style={{
                        borderBottom: `2px solid ${borderColor}`,
                        padding: '10px 6px 8px',
                        background: headerBg,
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            marginTop: '2px',
                            fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`,
                            fontWeight: '500',
                            fontStyle: 'italic',
                            textDecoration: 'underline',
                            letterSpacing: '0.3px',
                            color: mutedText,
                            fontFamily: fontFamily
                          }}>Delivery Challan</div>
                          
                          <div style={{
                            fontSize: columnCount === 5 ? `${companyNameSize - 4}px` : `${companyNameSize}px`,
                            fontWeight: 'bold',
                            letterSpacing: columnCount === 5 ? '2.5px' : '4px',
                            fontFamily: 'Georgia, serif',
                            marginBottom: '3px',
                            color: companyNameColor,
                            lineHeight: '1.1'
                          }}>
                            {settings?.companyName || 'S S FABRICS'}
                          </div>
                          
                          <div style={{ 
                            fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`,
                            marginBottom: '1px', 
                            color: textColor,
                            lineHeight: '1.2',
                            fontFamily: fontFamily,
                            fontWeight: fontWeight
                          }}>
                            {settings?.mobile || '9823671261'}
                          </div>
                        </div>
                      </div>

                      {/* Ganth Press - Only show if enabled */}
                      {showGanthPress && (
                        <div style={{
                          borderBottom: `2px solid ${borderColor}`,
                          padding: '6px',
                          fontSize: columnCount === 5 ? `${baseFontSize - 1}px` : `${baseFontSize}px`,
                          fontWeight: 'bold',
                          textAlign: 'center',
                          background: tableBg,
                          color: companyNameColor,
                          position: 'relative',
                          zIndex: 1,
                          fontFamily: fontFamily
                        }}>
                          {settings?.ganthPressName || 'New National Ganth Press'}
                          {settings?.ganthPressAddress && `, ${settings.ganthPressAddress}`}
                        </div>
                      )}

                      {/* Quality and Bale Details */}
                      <div style={{
                        borderBottom: `2px solid ${borderColor}`,
                        padding: '6px',
                        background: '#fff',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{
                            border: `1px solid ${borderColor}`,
                            borderRadius: '4px',
                            padding: '5px 8px',
                            background: tableBg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`,
                              color: mutedText,
                              fontWeight: '500',
                              fontFamily: fontFamily
                            }}>Quality</span>
                            <span style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 2}px`,
                              fontWeight: 'bold', 
                              color: companyNameColor,
                              fontFamily: fontFamily
                            }}>
                              {challan.qualityName}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div style={{
                            flex: 1,
                            border: `1px solid ${borderColor}`,
                            borderRadius: '4px',
                            padding: '5px 8px',
                            background: tableBg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`,
                              color: mutedText,
                              fontWeight: '500',
                              fontFamily: fontFamily
                            }}>Bale No</span>
                            <span style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 2}px`,
                              fontWeight: 'bold', 
                              color: companyNameColor,
                              fontFamily: fontFamily
                            }}>
                              {bale.baleNumber}
                            </span>
                          </div>
                          
                          <div style={{
                            flex: 1,
                            border: `1px solid ${borderColor}`,
                            borderRadius: '4px',
                            padding: '5px 8px',
                            background: tableBg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`,
                              color: mutedText,
                              fontWeight: '500',
                              fontFamily: fontFamily
                            }}>Pieces</span>
                            <span style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 2}px`,
                              fontWeight: 'bold', 
                              color: companyNameColor,
                              fontFamily: fontFamily
                            }}>
                              {bale.numberOfPieces}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div style={{
                        borderBottom: `2px solid ${borderColor}`,
                        padding: '5px 8px',
                        background: headerBg,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <span style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`,
                          fontWeight: '600',
                          color: mutedText,
                          fontFamily: fontFamily
                        }}>Date:</span>
                        <span style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 1}px` : `${baseFontSize + 1}px`,
                          fontWeight: 'bold', 
                          color: companyNameColor,
                          fontFamily: fontFamily
                        }}>
                          {formatDate(bale.date, dateFormat)}
                        </span>
                      </div>

                      {/* Cloth Details Table - UPDATED WITH BORDERLESS ROWS */}
                      <div style={{ 
                        flex: '1', 
                        display: 'flex', 
                        flexDirection: 'column',
                        position: 'relative',
                        zIndex: 1,
                        minHeight: 0,
                        overflow: 'hidden'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', flex: '1' }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid ${borderColor}`, background: tableBg }}>
                              <th style={{
                                borderLeft: 'none',
                                borderRight: `1px solid ${borderColor}`,
                                borderTop: 'none',
                                borderBottom: `2px solid ${borderColor}`,
                                padding: columnCount === 5 ? '5px 3px' : '6px 4px',
                                fontSize: columnCount === 5 ? `${headingSize - 1}px` : `${headingSize}px`,
                                fontFamily: fontFamily,
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: textColor
                              }}>Sr No</th>
                              <th style={{
                                borderLeft: 'none',
                                borderRight: `1px solid ${borderColor}`,
                                borderTop: 'none',
                                borderBottom: `2px solid ${borderColor}`,
                                padding: columnCount === 5 ? '5px 3px' : '6px 4px',
                                fontSize: columnCount === 5 ? `${headingSize - 1}px` : `${headingSize}px`,
                                fontFamily: fontFamily,
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: textColor
                              }}>Meter</th>
                              {/* Weight column - Only show if enabled */}
                              {showWeights && (
                                <th style={{
                                  borderLeft: 'none',
                                  borderRight: 'none',
                                  borderTop: 'none',
                                  borderBottom: `2px solid ${borderColor}`,
                                  padding: columnCount === 5 ? '5px 3px' : '6px 4px',
                                  fontSize: columnCount === 5 ? `${headingSize - 1}px` : `${headingSize}px`,
                                  fontFamily: fontFamily,
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  color: textColor
                                }}>Weight (kg)</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {bale.cloths.map((cloth, idx) => (
                              <tr key={idx} style={{ height: columnCount === 5 ? '18px' : '20px' }}>
                                <td style={{
                                  borderLeft: 'none',
                                  borderRight: `1px solid ${borderColor}`,
                                  borderTop: 'none',
                                  borderBottom: 'none',
                                  padding: '3px',
                                  textAlign: 'center',
                                  fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                  fontFamily: fontFamily,
                                  fontWeight: '600',
                                  color: companyNameColor
                                }}>
                                  {idx + 1}
                                </td>
                                <td style={{
                                  borderLeft: 'none',
                                  borderRight: showWeights ? `1px solid ${borderColor}` : 'none',
                                  borderTop: 'none',
                                  borderBottom: 'none',
                                  padding: '3px 6px',
                                  textAlign: 'center',
                                  fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                  fontFamily: fontFamily,
                                  fontWeight: '600',
                                  color: companyNameColor
                                }}>
                                  {cloth.meter ? Math.round(cloth.meter) : ''}
                                </td>
                                {showWeights && (
                                  <td style={{
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    borderTop: 'none',
                                    borderBottom: 'none',
                                    padding: '3px',
                                    textAlign: 'center',
                                    fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                    fontFamily: fontFamily,
                                    fontWeight: '600',
                                    color: companyNameColor
                                  }}>
                                    {cloth.weight ? cloth.weight.toFixed(2) : ''}
                                  </td>
                                )}
                              </tr>
                            ))}
                            {emptyRows.map((_, idx) => (
                              <tr key={`empty-${idx}`} style={{ height: columnCount === 5 ? '18px' : '20px' }}>
                                <td style={{
                                  borderLeft: 'none',
                                  borderRight: `1px solid ${borderColor}`,
                                  borderTop: 'none',
                                  borderBottom: 'none',
                                  padding: '3px',
                                  textAlign: 'center',
                                  fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                  fontFamily: fontFamily,
                                  fontWeight: '600',
                                  color: companyNameColor
                                }}>
                                  {bale.cloths.length + idx + 1}
                                </td>
                                <td style={{
                                  borderLeft: 'none',
                                  borderRight: showWeights ? `1px solid ${borderColor}` : 'none',
                                  borderTop: 'none',
                                  borderBottom: 'none',
                                  padding: '3px'
                                }}></td>
                                {showWeights && (
                                  <td style={{
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    borderTop: 'none',
                                    borderBottom: 'none',
                                    padding: '3px'
                                  }}></td>
                                )}
                              </tr>
                            ))}
                            
                            {/* Total Row */}
                            <tr style={{
                              borderTop: `2px solid ${borderColor}`,
                              background: tableBg,
                              height: columnCount === 5 ? '22px' : '24px'
                            }}>
                              <td style={{
                                borderLeft: 'none',
                                borderRight: `1px solid ${borderColor}`,
                                borderTop: `2px solid ${borderColor}`,
                                borderBottom: 'none',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                fontFamily: fontFamily,
                                padding: '4px',
                                color: companyNameColor
                              }}>
                                TOTAL
                              </td>
                              <td style={{
                                borderLeft: 'none',
                                borderRight: showWeights ? `1px solid ${borderColor}` : 'none',
                                borderTop: `2px solid ${borderColor}`,
                                borderBottom: 'none',
                                padding: '4px 6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                fontFamily: fontFamily,
                                color: companyNameColor
                              }}>
                                {Math.round(bale.totalMeter)}
                              </td>
                              {showWeights && (
                                <td style={{
                                  borderLeft: 'none',
                                  borderRight: 'none',
                                  borderTop: `2px solid ${borderColor}`,
                                  borderBottom: 'none',
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 1}px`,
                                  fontFamily: fontFamily,
                                  padding: '4px',
                                  color: companyNameColor
                                }}>
                                  {bale.totalWeight.toFixed(2)}
                                </td>
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Terms */}
                      <div style={{
                        borderTop: `2px solid ${borderColor}`,
                        padding: '6px',
                        background: headerBg,
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`,
                          fontWeight: 'bold', 
                          marginBottom: '3px', 
                          color: companyNameColor,
                          fontFamily: fontFamily
                        }}>Terms & Conditions</div>
                        <div style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 4}px` : `${baseFontSize - 3}px`,
                          lineHeight: '1.4', 
                          color: textColor,
                          fontFamily: fontFamily,
                          fontWeight: fontWeight
                        }}>
                          {footerNote}
                        </div>
                      </div>

                      {/* Signature */}
                      <div style={{
                        borderTop: `1px solid ${borderColor}`,
                        padding: '8px 6px 6px',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{ 
                          borderTop: `1px solid ${borderColor}`,
                          display: 'inline-block', 
                          minWidth: '60%', 
                          paddingTop: '4px', 
                          fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`,
                          color: mutedText,
                          fontFamily: fontFamily
                        }}>
                          {settings?.signatureText || 'Authorized Signature'}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    });

    return (
      <div className="page-container">
        <h1 className="page-title">View Delivery Challans</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Filter Challans</div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Filter by Quality:
            </label>
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              style={{ 
                padding: '0.5rem', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                minWidth: '200px'
              }}
            >
              <option value="all">All Qualities</option>
              {qualities.map(quality => (
                <option key={quality._id} value={quality._id}>
                  {quality.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Filter by Status:
            </label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <button
      onClick={() => setFilterStatus('all')}
      className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'} btn-small`}
    >
      All ({statusCounts.all})
    </button>
    <button
      onClick={() => setFilterStatus('incomplete')}
      className={`btn ${filterStatus === 'incomplete' ? 'btn-primary' : 'btn-secondary'} btn-small`}
    >
      Incomplete ({statusCounts.incomplete})
    </button>
    <button
      onClick={() => setFilterStatus('complete')}
      className={`btn ${filterStatus === 'complete' ? 'btn-primary' : 'btn-secondary'} btn-small`}
    >
      Complete ({statusCounts.complete})
    </button>
    <button
      onClick={() => setFilterStatus('sold')}
      className={`btn ${filterStatus === 'sold' ? 'btn-primary' : 'btn-secondary'} btn-small`}
    >
      Sold ({statusCounts.sold})
    </button>
  </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Quality</th>
                <th>Bale Numbers</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.map((challan) => (
                <tr key={challan._id}>
                  <td><strong>{challan.challanNumber}</strong></td>
                  <td>{challan.qualityName}</td>
                  <td style={{ fontSize: '0.875rem' }}>{getBaleNumbers(challan)}</td>
                  <td>{challan.completedBalesCount} / {challan.expectedBalesCount} bales</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      background: challan.isSold ? '#e74c3c' : 
                                  challan.status === 'complete' ? '#27ae60' : '#f39c12',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}>
                      {challan.isSold ? 'SOLD' : challan.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                  <td>
                    {!challan.isSold && (
                      <button
                        onClick={() => handleContinue(challan)}
                        className="btn btn-success btn-small"
                        style={{ marginRight: '0.5rem' }}
                      >
                        {challan.status === 'incomplete' ? 'Continue' : 'View/Edit'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedChallan(challan);
                        setTimeout(() => {
                          if (printRef.current) {
                            handlePrint();
                          }
                        }, 150);
                      }}
                      className="btn btn-primary btn-small"
                      style={{ marginRight: '0.5rem' }}
                    >
                      Print
                    </button>
                    {!challan.isSold && (
                      <button
                        onClick={() => handleDelete(challan._id)}
                        className="btn btn-danger btn-small"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredChallans.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
              No delivery challans found for selected filters.
            </p>
          )}
        </div>

        <div style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          width: '297mm',
          overflow: 'hidden'
        }}>
          {selectedChallan && (
            <PrintableChallan 
              ref={printRef} 
              challan={selectedChallan}
              settings={companySettings}
            />
          )}
        </div>
      </div>
    );
  }

  export default ViewChallans;