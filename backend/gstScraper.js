//getScraper.js
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

// Store sessions temporarily
const sessions = new Map();

/**
 * Initialize session and get CAPTCHA
 */
async function initCaptcha() {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };

    console.log(`[${sessionId}] Loading GST portal...`);
    
    // Load main page
    await client.get('https://services.gst.gov.in/services/searchtp', {
      headers: headers,
      maxRedirects: 5
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch CAPTCHA
    const captchaResponse = await client.get(
      'https://services.gst.gov.in/services/captcha',
      {
        headers: {
          ...headers,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://services.gst.gov.in/services/searchtp',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'same-origin'
        },
        responseType: 'arraybuffer'
      }
    );

    // Store session
    sessions.set(sessionId, {
      jar: jar,
      timestamp: Date.now(),
      cookies: await jar.getCookies('https://services.gst.gov.in')
    });

    // Clean old sessions (>10 minutes)
    for (const [key, value] of sessions.entries()) {
      if (Date.now() - value.timestamp > 600000) {
        sessions.delete(key);
      }
    }

    const captchaBase64 = Buffer.from(captchaResponse.data).toString('base64');

    return {
      success: true,
      sessionId,
      captchaImage: `data:image/jpeg;base64,${captchaBase64}`
    };

  } catch (error) {
    console.error('Error fetching CAPTCHA:', error.message);
    return {
      success: false,
      error: 'Failed to fetch CAPTCHA'
    };
  }
}

/**
 * Search GST with CAPTCHA
 */
async function searchGST(sessionId, gstin, captcha) {
  try {
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinPattern.test(gstin.toUpperCase())) {
      return {
        success: false,
        error: 'Invalid GSTIN format'
      };
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session expired'
      };
    }

    const client = wrapper(axios.create({ jar: session.jar }));

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json; charset=UTF-8',
      'Origin': 'https://services.gst.gov.in',
      'Referer': 'https://services.gst.gov.in/services/searchtp',
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };

    const searchResponse = await client.post(
      'https://services.gst.gov.in/services/api/search/tp',
      {
        gstin: gstin.toUpperCase(),
        captcha: captcha
      },
      {
        headers: headers,
        timeout: 15000
      }
    );

    sessions.delete(sessionId);

    const gstData = searchResponse.data;

    if (gstData.errorCode || gstData.error) {
      return {
        success: false,
        error: gstData.errorMsg || gstData.error || 'GST verification failed'
      };
    }

    if (!gstData || Object.keys(gstData).length === 0) {
      return {
        success: false,
        error: 'No data found for this GSTIN'
      };
    }

// -------------------------
// UNIVERSAL CITY EXTRACTOR
// -------------------------
function extractCityFromAddress(address) {
  if (!address || typeof address !== "string") return "";

  // Split by comma → trim spaces → remove empty values
  const parts = address
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);

  // GST address always ends with: CITY, DISTRICT, STATE, PINCODE
  if (parts.length < 3) return "";

  // 3rd last element = CITY
  const city = parts[parts.length - 4];

  return city.replace(/[^a-zA-Z0-9\s.-]/g, "").trim();
}


// -------------------------
// MAIN SCRAPER LOGIC
// -------------------------
let fullAddress = "";
let city = "";
const stateCode = gstin.substring(0, 2);

// Build address from GST data
if (gstData.pradr?.adr && typeof gstData.pradr.adr === "string") {
  fullAddress = gstData.pradr.adr;
} else if (gstData.pradr?.addr) {
  const a = gstData.pradr.addr;

  const parts = [
    a.bno,
    a.bnm,
    a.st,
    a.loc,
    a.city,
    a.dst,
    a.stcd,
    a.pncd
  ].filter(Boolean);

  fullAddress = parts.join(", ");
}

// Extract city using the reliable GST address pattern
city = extractCityFromAddress(fullAddress);

// Final cleaned output
return {
  success: true,
  data: {
    name: gstData.tradeNam || gstData.lgnm || "",
    address: fullAddress || "Address not available",
    city: city || "",
    state: getStateName(stateCode),
    stateCode: stateCode,
    legalName: gstData.lgnm,
    tradeName: gstData.tradeNam,
    status: gstData.sts,
    registrationDate: gstData.rgdt
  }
};





  } catch (error) {
    console.error('GST search error:', error.message);
    return {
      success: false,
      error: 'Failed to fetch GST details'
    };
  }
}

function getStateName(stateCode) {
  const states = {
    '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli',
    '27': 'Maharashtra', '28': 'Andhra Pradesh', '29': 'Karnataka',
    '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
    '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana', '37': 'Andhra Pradesh (New)', '38': 'Ladakh'
  };
  return states[stateCode] || 'Unknown';
}

module.exports = { initCaptcha, searchGST };