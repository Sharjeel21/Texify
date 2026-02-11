// frontend/src/pages/ViewChallans.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryChallanAPI, qualityAPI, companySettingsAPI } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import { formatDate } from '../utils/formatters';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { 
  Printer, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';

function ViewChallans() {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
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
        setMessage({ type: 'success', text: '✓ Delivery challan deleted successfully!' });
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

  const getQualityFilteredChallans = () => {
    if (filterQuality === 'all') {
      return challans;
    }
    return challans.filter(c => c.quality && c.quality._id === filterQuality);
  };

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

  const getStatusBadge = (challan) => {
    if (challan.isSold) {
      return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300';
    } else if (challan.status === 'complete') {
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
    } else {
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusText = (challan) => {
    if (challan.isSold) return 'SOLD';
    return challan.status.toUpperCase();
  };

  const getStatusIcon = (challan) => {
    if (challan.isSold) {
      return <AlertCircle className="w-3 h-3" />;
    } else if (challan.status === 'complete') {
      return <CheckCircle className="w-3 h-3" />;
    } else {
      return <Clock className="w-3 h-3" />;
    }
  };

  const generateEmptyRows = (existingPieces, expectedPieces) => {
    const emptyRowsNeeded = Math.max(0, expectedPieces - existingPieces);
    return Array(emptyRowsNeeded).fill(null);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'challanNumber',
      header: 'Challan No.',
      render: (challan) => (
        <span className="font-bold text-amber-700">{challan.challanNumber}</span>
      )
    },
    {
      key: 'quality',
      header: 'Quality',
      render: (challan) => (
        <span className="font-medium text-gray-900">{challan.qualityName}</span>
      )
    },
    {
      key: 'bales',
      header: 'Bale Numbers',
      render: (challan) => (
        <span className="text-sm text-gray-600">{getBaleNumbers(challan)}</span>
      )
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (challan) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${challan.status === 'complete' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-yellow-500 to-amber-600'}`}
              style={{ width: `${(challan.completedBalesCount / challan.expectedBalesCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold whitespace-nowrap text-gray-700">
            {challan.completedBalesCount}/{challan.expectedBalesCount}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (challan) => (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(challan)}`}>
          {getStatusIcon(challan)}
          {getStatusText(challan)}
        </span>
      )
    },
    {
      key: 'created',
      header: 'Created',
      render: (challan) => (
        <span className="text-sm text-gray-600">
          {new Date(challan.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (challan) => (
        <div className="flex flex-wrap gap-2">
          {!challan.isSold && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContinue(challan);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
              title={challan.status === 'incomplete' ? 'Continue' : 'View/Edit'}
            >
              {challan.status === 'incomplete' ? (
                <Edit className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="hidden md:inline">
                {challan.status === 'incomplete' ? 'Continue' : 'View/Edit'}
              </span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChallan(challan);
              setTimeout(() => {
                if (printRef.current) {
                  handlePrint();
                }
              }, 150);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
            title="Print"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Print</span>
          </button>
          {!challan.isSold && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(challan._id);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all shadow-sm hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}
        </div>
      )
    }
  ];

  const PrintableChallan = React.forwardRef((props, ref) => {
    const { challan, settings } = props;
    if (!challan) return null;

    const format = settings?.challanFormat || {};
    const showLogo = format.showLogo !== false;
    const showGanthPress = format.showGanthPress !== false;
    const showWeights = format.showWeights !== false;
    const fontFamily = format.fontFamily || 'Segoe UI';
    const fontWeight = format.fontWeight || 'normal';
    const baseFontSize = format.fontSize?.base || 11;
    const companyNameSize = format.fontSize?.companyName || 22;
    const headingSize = format.fontSize?.heading || 12;
    const colorMode = format.colorMode || 'color';
    const isBlackWhite = colorMode === 'black_white';
    const textColor = isBlackWhite ? '#000000' : '#212529';
    const headerBg = isBlackWhite ? '#ffffff' : '#f8f9fa';
    const tableBg = isBlackWhite ? '#f5f5f5' : '#e9ecef';
    const borderColor = isBlackWhite ? '#000000' : '#333333';
    const mutedText = isBlackWhite ? '#000000' : '#6c757d';
    const companyNameColor = isBlackWhite ? '#000000' : '#2c3e50';
    const dateFormat = settings?.preferences?.dateFormat || 'DD/MM/YYYY';
    const footerNote = settings?.terms?.challan?.line1 || 'Any type of complaint regarding weight and folding will be entertained within 48Hrs.';

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
      <div ref={ref} className="print-container" style={{ width: '297mm', background: 'white' }}>
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
                const emptyRows = generateEmptyRows(bale.cloths.length, challan.expectedPiecesPerBale);

                return (
                  <div 
                    key={baleIndex} 
                    style={{ 
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
                    }}
                  >
                    
                    {/* Background Logo Watermark */}
                    {hasLogo && (
                      <div 
                        style={{ 
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
                        }}
                      >
                        <img 
                          src={settings.logo} 
                          alt="" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            width: 'auto', 
                            height: 'auto', 
                            objectFit: 'contain', 
                            filter: 'grayscale(100%)' 
                          }} 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                      </div>
                    )}

                    {/* Header */}
                    <div 
                      style={{ 
                        borderBottom: `2px solid ${borderColor}`, 
                        padding: '10px 6px 8px', 
                        background: headerBg, 
                        position: 'relative', 
                        zIndex: 1 
                      }}
                    >
                      <div 
                        style={{ 
                          textAlign: 'center', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <div 
                          style={{ 
                            marginTop: '2px', 
                            fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`, 
                            fontWeight: '500', 
                            fontStyle: 'italic', 
                            textDecoration: 'underline', 
                            letterSpacing: '0.3px', 
                            color: mutedText, 
                            fontFamily: fontFamily 
                          }}
                        >
                          Delivery Challan
                        </div>
                        <div 
                          style={{ 
                            fontSize: columnCount === 5 ? `${companyNameSize - 4}px` : `${companyNameSize}px`, 
                            fontWeight: 'bold', 
                            letterSpacing: columnCount === 5 ? '2.5px' : '4px', 
                            fontFamily: 'Georgia, serif', 
                            marginBottom: '3px', 
                            color: companyNameColor, 
                            lineHeight: '1.1' 
                          }}
                        >
                          {settings?.companyName || 'S S FABRICS'}
                        </div>
                        <div 
                          style={{ 
                            fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`, 
                            marginBottom: '1px', 
                            color: textColor, 
                            lineHeight: '1.2', 
                            fontFamily: fontFamily, 
                            fontWeight: fontWeight 
                          }}
                        >
                          {settings?.mobile || '9823671261'}
                        </div>
                      </div>
                    </div>

                    {/* Ganth Press */}
                    {showGanthPress && (
                      <div 
                        style={{ 
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
                        }}
                      >
                        {settings?.ganthPressName || 'New National Ganth Press'}
                        {settings?.ganthPressAddress && `, ${settings.ganthPressAddress}`}
                      </div>
                    )}

                    {/* Bale Details */}
                    <div 
                      style={{ 
                        borderBottom: `2px solid ${borderColor}`, 
                        padding: '6px', 
                        background: '#fff', 
                        position: 'relative', 
                        zIndex: 1 
                      }}
                    >
                      <div style={{ marginBottom: '6px' }}>
                        <div 
                          style={{ 
                            border: `1px solid ${borderColor}`, 
                            borderRadius: '4px', 
                            padding: '5px 8px', 
                            background: tableBg, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`, 
                              color: mutedText, 
                              fontWeight: '500', 
                              fontFamily: fontFamily 
                            }}
                          >
                            Quality
                          </span>
                          <span 
                            style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 2}px`, 
                              fontWeight: 'bold', 
                              color: companyNameColor, 
                              fontFamily: fontFamily 
                            }}
                          >
                            {challan.qualityName}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div 
                          style={{ 
                            flex: 1, 
                            border: `1px solid ${borderColor}`, 
                            borderRadius: '4px', 
                            padding: '5px 8px', 
                            background: tableBg, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`, 
                              color: mutedText, 
                              fontWeight: '500', 
                              fontFamily: fontFamily 
                            }}
                          >
                            Bale No
                          </span>
                          <span 
                            style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 2}px`, 
                              fontWeight: 'bold', 
                              color: companyNameColor, 
                              fontFamily: fontFamily 
                            }}
                          >
                            {bale.baleNumber}
                          </span>
                        </div>
                        <div 
                          style={{ 
                            flex: 1, 
                            border: `1px solid ${borderColor}`, 
                            borderRadius: '4px', 
                            padding: '5px 8px', 
                            background: tableBg, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`, 
                              color: mutedText, 
                              fontWeight: '500', 
                              fontFamily: fontFamily 
                            }}
                          >
                            Pieces
                          </span>
                          <span 
                            style={{ 
                              fontSize: columnCount === 5 ? `${baseFontSize}px` : `${baseFontSize + 2}px`, 
                              fontWeight: 'bold', 
                              color: companyNameColor, 
                              fontFamily: fontFamily 
                            }}
                          >
                            {bale.numberOfPieces}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div 
                      style={{ 
                        borderBottom: `2px solid ${borderColor}`, 
                        padding: '5px 8px', 
                        background: headerBg, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        position: 'relative', 
                        zIndex: 1 
                      }}
                    >
                      <span 
                        style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 2}px` : `${baseFontSize - 1}px`, 
                          fontWeight: '600', 
                          color: mutedText, 
                          fontFamily: fontFamily 
                        }}
                      >
                        Date:
                      </span>
                      <span 
                        style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 1}px` : `${baseFontSize + 1}px`, 
                          fontWeight: 'bold', 
                          color: companyNameColor, 
                          fontFamily: fontFamily 
                        }}
                      >
                        {formatDate(bale.date, dateFormat)}
                      </span>
                    </div>

                    {/* Table */}
                    <div 
                      style={{ 
                        flex: '1', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        position: 'relative', 
                        zIndex: 1, 
                        minHeight: 0, 
                        overflow: 'hidden' 
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', flex: '1' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${borderColor}`, background: tableBg }}>
                            <th 
                              style={{ 
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
                              }}
                            >
                              Sr No
                            </th>
                            <th 
                              style={{ 
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
                              }}
                            >
                              Meter
                            </th>
                            {showWeights && (
                              <th 
                                style={{ 
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
                                }}
                              >
                                Weight (kg)
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {bale.cloths.map((cloth, idx) => (
                            <tr key={idx} style={{ height: columnCount === 5 ? '18px' : '20px' }}>
                              <td 
                                style={{ 
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
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td 
                                style={{ 
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
                                }}
                              >
                                {cloth.meter ? Math.round(cloth.meter) : ''}
                              </td>
                              {showWeights && (
                                <td 
                                  style={{ 
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
                                  }}
                                >
                                  {cloth.weight ? cloth.weight.toFixed(2) : ''}
                                </td>
                              )}
                            </tr>
                          ))}
                          {emptyRows.map((_, idx) => (
                            <tr key={`empty-${idx}`} style={{ height: columnCount === 5 ? '18px' : '20px' }}>
                              <td 
                                style={{ 
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
                                }}
                              >
                                {bale.cloths.length + idx + 1}
                              </td>
                              <td 
                                style={{ 
                                  borderLeft: 'none', 
                                  borderRight: showWeights ? `1px solid ${borderColor}` : 'none', 
                                  borderTop: 'none', 
                                  borderBottom: 'none', 
                                  padding: '3px' 
                                }}
                              ></td>
                              {showWeights && (
                                <td 
                                  style={{ 
                                    borderLeft: 'none', 
                                    borderRight: 'none', 
                                    borderTop: 'none', 
                                    borderBottom: 'none', 
                                    padding: '3px' 
                                  }}
                                ></td>
                              )}
                            </tr>
                          ))}
                          <tr 
                            style={{ 
                              borderTop: `2px solid ${borderColor}`, 
                              background: tableBg, 
                              height: columnCount === 5 ? '22px' : '24px' 
                            }}
                          >
                            <td 
                              style={{ 
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
                              }}
                            >
                              TOTAL
                            </td>
                            <td 
                              style={{ 
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
                              }}
                            >
                              {Math.round(bale.totalMeter)}
                            </td>
                            {showWeights && (
                              <td 
                                style={{ 
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
                                }}
                              >
                                {bale.totalWeight.toFixed(2)}
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Terms */}
                    <div 
                      style={{ 
                        borderTop: `2px solid ${borderColor}`, 
                        padding: '6px', 
                        background: headerBg, 
                        position: 'relative', 
                        zIndex: 1 
                      }}
                    >
                      <div 
                        style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`, 
                          fontWeight: 'bold', 
                          marginBottom: '3px', 
                          color: companyNameColor, 
                          fontFamily: fontFamily 
                        }}
                      >
                        Terms & Conditions
                      </div>
                      <div 
                        style={{ 
                          fontSize: columnCount === 5 ? `${baseFontSize - 4}px` : `${baseFontSize - 3}px`, 
                          lineHeight: '1.4', 
                          color: textColor, 
                          fontFamily: fontFamily, 
                          fontWeight: fontWeight 
                        }}
                      >
                        {footerNote}
                      </div>
                    </div>

                    {/* Signature */}
                    <div 
                      style={{ 
                        borderTop: `1px solid ${borderColor}`, 
                        padding: '8px 6px 6px', 
                        textAlign: 'center', 
                        position: 'relative', 
                        zIndex: 1 
                      }}
                    >
                      <div 
                        style={{ 
                          borderTop: `1px solid ${borderColor}`, 
                          display: 'inline-block', 
                          minWidth: '60%', 
                          paddingTop: '4px', 
                          fontSize: columnCount === 5 ? `${baseFontSize - 3}px` : `${baseFontSize - 2}px`, 
                          color: mutedText, 
                          fontFamily: fontFamily 
                        }}
                      >
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
            View Delivery Challans
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Manage and print your delivery challans
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
          <h2 className="text-lg font-bold text-gray-900">Filter Challans</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Filter by Quality:</label>
            <select 
              value={filterQuality} 
              onChange={(e) => setFilterQuality(e.target.value)} 
              className="w-full md:w-auto md:min-w-[250px] px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
            >
              <option value="all">All Qualities</option>
              {qualities.map(quality => (
                <option key={quality._id} value={quality._id}>{quality.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Filter by Status:</label>
            <div className="grid grid-cols-2 md:flex gap-3">
              {[
                { id: 'all', label: 'All', count: statusCounts.all },
                { id: 'incomplete', label: 'Incomplete', count: statusCounts.incomplete },
                { id: 'complete', label: 'Complete', count: statusCounts.complete },
                { id: 'sold', label: 'Sold', count: statusCounts.sold }
              ].map(status => (
                <button 
                  key={status.id}
                  onClick={() => setFilterStatus(status.id)} 
                  className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                    filterStatus === status.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:bg-amber-50'
                  }`}
                >
                  {status.label} ({status.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      {filteredChallans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Challans Found</h3>
          <p className="text-gray-600 mb-4">No delivery challans match the selected filters.</p>
          <p className="text-sm text-gray-500">Try adjusting your filter settings.</p>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={filteredChallans}
          className="hover:bg-amber-50"
        />
      )}

      {/* Hidden Print Component */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '297mm', overflow: 'hidden' }}>
        {selectedChallan && (
          <PrintableChallan ref={printRef} challan={selectedChallan} settings={companySettings} />
        )}
      </div>
    </div>
  );
}

export default ViewChallans;