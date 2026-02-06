const axios = require('axios');

function normalizeIndianMobile(mobileNumber) {
  let clean = String(mobileNumber || '').replace(/\D/g, '');

  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.slice(2);
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  return clean;
}

async function sendSMS(phone, message) {
  const provider = String(process.env.SMS_PROVIDER || 'disabled').toLowerCase();
  const text = String(message || '');

  if (provider === 'disabled' || provider === 'off') {
    console.log(`[SMS DISABLED] Would send SMS to ${phone}: ${text.substring(0, 50)}...`);
    return {
      success: false,
      message: 'SMS service is disabled. Configure SMS_PROVIDER and provider credentials in .env',
      provider: 'disabled'
    };
  }

  // Default is India-first because this project validates Indian numbers elsewhere
  const normalized = normalizeIndianMobile(phone);
  if (!normalized) {
    return {
      success: false,
      message: 'Invalid mobile number',
      provider
    };
  }

  if (provider === 'msg91') {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID;
    const route = process.env.MSG91_ROUTE || '4';
    const countryCode = process.env.MSG91_COUNTRY_CODE || '91';

    if (!authKey || !senderId) {
      return {
        success: false,
        message: 'MSG91 credentials missing (MSG91_AUTH_KEY / MSG91_SENDER_ID)',
        provider: 'msg91'
      };
    }

    const mobiles = `${countryCode}${normalized}`;
    const url = 'https://api.msg91.com/api/sendhttp.php';

    try {
      const { data } = await axios.get(url, {
        timeout: 10000,
        params: {
          authkey: authKey,
          mobiles,
          message: text,
          sender: senderId,
          route
        }
      });

      return {
        success: true,
        message: 'SMS sent',
        provider: 'msg91',
        response: data
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data || error.message || 'MSG91 request failed',
        provider: 'msg91'
      };
    }
  }

  if (provider === 'textlocal') {
    const apiKey = process.env.TEXTLOCAL_API_KEY;
    const sender = process.env.TEXTLOCAL_SENDER || 'TXTLCL';

    if (!apiKey) {
      return {
        success: false,
        message: 'Textlocal credentials missing (TEXTLOCAL_API_KEY)',
        provider: 'textlocal'
      };
    }

    const url = 'https://api.textlocal.in/send/';

    try {
      const { data } = await axios.post(
        url,
        new URLSearchParams({
          apikey: apiKey,
          numbers: normalized,
          message: text,
          sender
        }).toString(),
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const ok = data && (data.status === 'success' || data.status === 'SUCCESS');
      return {
        success: Boolean(ok),
        message: ok ? 'SMS sent' : 'SMS not sent',
        provider: 'textlocal',
        response: data
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data || error.message || 'Textlocal request failed',
        provider: 'textlocal'
      };
    }
  }

  return {
    success: false,
    message: `Unsupported SMS provider: ${provider}`,
    provider
  };
}

module.exports = {
  sendSMS
};
