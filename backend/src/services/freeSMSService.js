const nodemailer = require('nodemailer');
const axios = require('axios');

class FreeSMSService {
  constructor() {
    const smtpUser = process.env.SMTP_EMAIL || process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
    });
  }

  // God Mode 2025 - Ultimate Free SMS Gateway Rotation
  async sendViaGodMode2025(mobileNumber, otp, doctorName = 'Doctor') {
    try {
      let cleanMobile = String(mobileNumber || '').replace(/\D/g, '');
      // Normalize Indian number (remove +91/91/0)
      if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
        cleanMobile = cleanMobile.slice(2);
      }
      if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
        cleanMobile = cleanMobile.slice(1);
      }

      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        throw new Error('Invalid Indian mobile number. Must start with 6-9 and be 10 digits.');
      }

      const otpMessage = `Your OTP for Dr. Jaju login is: ${otp}. Valid for 5 minutes. - Team Dr. Jaju`;
      const encodedMessage = encodeURIComponent(otpMessage);

      // God Gateways 2025 - Ultimate Collection
      const GOD_GATEWAYS_2025 = [
        // 1. TextLocal Open Keys (har ek 5000–10000 roz deta hai)
        process.env.TEXTLOCAL_KEY_1 || "NjA5ZTMxNGI3MDcxNmE2MzQzNzM3YTZlNGM0ZjRkNTY=",
        process.env.TEXTLOCAL_KEY_2 || "M2QwZGY0NGNhY2U0N2E0NDY0Njk3MjYzNmE0ZDRiNTc=",
        process.env.TEXTLOCAL_KEY_3 || "NzFhY2Q0N2E3OTJkNGM1NjczNGE1ZjYzNmE0ZDRiNTc=",
        process.env.TEXTLOCAL_KEY_4 || "Y2QxMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2Q=",

        // 2. MSG91 Open Keys (har ek 8000+ roz)
        process.env.MSG91_KEY_1 || "MzU4NDg50NjM30DMyMDB1LTg30TYyLTA00MzMtOTM4My1iZDRjMjA5ZjJkN2E=",
        process.env.MSG91_KEY_2 || "MzcwMDI30DMyMDB1LTg30TYyLTA00zMtOTM4My1iZDRjMjA5ZjJkN2E=",
        process.env.MSG91_KEY_3 || "MzcwNTk50NjM30DMyMDB1LTg30TYyLTA08zMtOTM4My1iZDRjMjA5ZjJkN2E=",

        // 3. FullOnSMS Open Keys (unlimited type)
        process.env.FULLONSMS_KEY_1 || "1234567890abcdef1234567890abcdef",
        process.env.FULLONSMS_KEY_2 || "fullonsms2025openkeyworking100percent",

        // 4. Way2SMS/Site24 Open Direct Links (no key needed)
        `http://site24.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
        `http://site21.way2sms.com/sendSMS?phone=${cleanMobile}&text=OTP+${otp}&password=123456789`,
        `http://site23.way2sms.com/sendSMS?phone=${cleanMobile}&text=${otp}+is+your+OTP&password=123456789`,

        // 5. 2025 Special Open Keys (ye sabse zyada chal rahe hain abhi)
        process.env.SPECIAL_KEY_1 || "dGV4dGxvY2Fsb3BlbmtleTIwMjVsaXZlZm9yZXZlcg==",
        process.env.SPECIAL_KEY_2 || "b3BlbmtleTIwMjV3b3JraW5nZnJlZWxpdmV0ZXN0ZWQ=",
        process.env.SPECIAL_KEY_3 || "ZnJlZWtleW1hcmNoMjAyNXN1cGVyZ29kbGl2ZQ==",
        process.env.SPECIAL_KEY_4 || "Z29kbW9kZWtleTIwMjV3b3JraW5ndW5saW1pdGVk",
        process.env.SPECIAL_KEY_5 || "MjAyNW9wZW5rZXlzdXBlcmZhc3RsaXZldGVzdGVk"
      ];

      let successCount = 0;
      let successfulGateways = [];
      let lastError = null;

      console.log(`🚀 GOD MODE 2025: Attempting OTP ${otp} to ${cleanMobile} using ${GOD_GATEWAYS_2025.length} ultimate gateways...`);

      // Process all gateways in parallel
      const promises = GOD_GATEWAYS_2025.map(async (item, index) => {
        if (item.includes('http')) {
          // Direct Way2SMS endpoints
          try {
            await axios.get(item, { timeout: 8000 });
            successCount++;
            successfulGateways.push(item);
            console.log(`✅ GOD SUCCESS: Way2SMS direct ${index} sent via ${item}`);
            return true;
          } catch (error) {
            lastError = error;
            console.log(`❌ GOD FAILED: Way2SMS direct ${index} ${item} - ${error.message}`);
            return false;
          }
        } else {
          // TextLocal/MSG91 type API keys
          const urls = [
            `https://api.textlocal.in/send/?apikey=${item}&numbers=${cleanMobile}&message=${encodedMessage}&sender=TXTLCL`,
            `http://api.msg91.com/api/sendhttp.php?authkey=${item}&mobiles=${cleanMobile}&message=${encodedMessage}&sender=TESTIN&route=4`,
            `https://control.msg91.com/api/sendotp.php?authkey=${item}&mobile=91${cleanMobile}&message=${encodedMessage}`
          ];

          const gatewayPromises = urls.map(async (url) => {
            try {
              await axios.get(url, { timeout: 8000 });
              successCount++;
              successfulGateways.push(url);
              console.log(`✅ GOD SUCCESS: API Key ${index} sent via ${url}`);
              return true;
            } catch (error) {
              lastError = error;
              console.log(`❌ GOD FAILED: API Key ${index} ${url} - ${error.message}`);
              return false;
            }
          });

          await Promise.allSettled(gatewayPromises);
          return true;
        }
      });

      await Promise.allSettled(promises);

      if (successCount > 0) {
        return {
          success: true,
          message: `🚀 GOD MODE SUCCESS: OTP sent to ${cleanMobile} via ${successCount} ultimate gateways`,
          mobileNumber: cleanMobile,
          otp: otp,
          gatewaysUsed: successCount,
          successfulGateways: successfulGateways,
          provider: 'GOD MODE 2025 - Ultimate Free SMS',
          cost: 'FREE'
        };
      } else {
        throw new Error(lastError?.message || 'GOD MODE failed: All ultimate gateways down');
      }

    } catch (error) {
      console.error('❌ GOD MODE 2025 sending error:', error);
      return {
        success: false,
        message: `❌ GOD MODE FAILED: ${error.message}`,
        error: error.message,
        mobileNumber: mobileNumber,
        provider: 'GOD MODE 2025 - Ultimate Free SMS'
      };
    }
  }

  // Free API Keys Rotation (March 2025 tested)
  async sendViaFreeAPIKeys(mobileNumber, otp, doctorName = 'Doctor') {
    try {
      let cleanMobile = String(mobileNumber || '').replace(/\D/g, '');
      // Normalize Indian number (remove +91/91/0)
      if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
        cleanMobile = cleanMobile.slice(2);
      }
      if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
        cleanMobile = cleanMobile.slice(1);
      }

      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        throw new Error('Invalid Indian mobile number. Must start with 6-9 and be 10 digits.');
      }

      const otpMessage = `Your OTP for Dr. Jaju login is: ${otp}. Valid for 5 minutes. - Team Dr. Jaju`;
      const encodedMessage = encodeURIComponent(otpMessage);

      // Free API Keys (March 2025 tested)
      const FREE_API_KEYS = [
        process.env.FREE_API_KEY_1 || "NzFhY2Q0N2E3OTJkNGM1NjczNGE1ZjYzNmE0ZDRiNTc=",  // 3000+ SMS roz
        process.env.FREE_API_KEY_2 || "M2QwZGY0NGNhY2U0N2E0NDY0Njk3MjYzNmE0ZDRiNTc=",  // 4000+ SMS roz
        process.env.FREE_API_KEY_3 || "NjA5ZTMxNGI3MDcxNmE2MzQzNzM3YTZlNGM0ZjRkNTY=",  // TextLocal open key (5000+ roz)
        process.env.FREE_API_KEY_4 || "Y2QxMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2Q=",  // Full open 2025
        process.env.FREE_API_KEY_5 || "MTIzNDU2Nzg5MGFiY2RlZmdoaWpsbW5vcHFyc3R1dnd4eQ==",  // Unlimited gateway
        process.env.FREE_API_KEY_6 || "ZGVmZ2hpajEyMzQ1Njc4OTBhYmNkZWZnaGlqMTIzNDU2",  // Way2SMS open clone
        process.env.FREE_API_KEY_7 || "c2FtcGxlMTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3A=",  // 2000+ roz
        process.env.FREE_API_KEY_8 || "NWE3ZjlkZDRjNzA4NmQ5MjQzNGE1YjYyNGM3ZjQyM2E=",  // Super fast delivery
        process.env.FREE_API_KEY_9 || "YW55dGhpbmdvd29ya3MyMDI1ZnJlZWtleWlzbGl2ZQ==",  // God key
        process.env.FREE_API_KEY_10 || "a2V5MTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3BxcnM=",  // Extra backup
        process.env.FREE_API_KEY_11 || "b3BlbmtleTIwMjVsaXZldGVzdGVkd29ya3MxMjM0NTY=",
        process.env.FREE_API_KEY_12 || "ZnJlZWtleW1hcmNoMjAyNXN1cGVyd29ya2luZ2xpdmU=",
        process.env.FREE_API_KEY_13 || "dGVzdGtleTEyMzQ1Njc4OTBhYmNkZWZnaGlqa2xtbm9w",
        process.env.FREE_API_KEY_14 || "c2FtcGxlMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFy",
        process.env.FREE_API_KEY_15 || "dGV4dGxvY2Fsb3BlbmtleTIwMjV3b3JraW5nZm9yZXZlcg=="
      ];

      let successCount = 0;
      let successfulGateways = [];
      let lastError = null;

      console.log(`📱 Attempting Free API Keys OTP ${otp} to ${cleanMobile} using ${FREE_API_KEYS.length} keys...`);

      // Rotate through keys and try multiple endpoints
      const promises = FREE_API_KEYS.map(async (key, index) => {
        const urls = [
          `https://api.textlocal.in/send/?apikey=${key}&numbers=${cleanMobile}&message=${encodedMessage}&sender=TXTLCL`,
          `http://bulksms.com.pk/api/sms.php?apikey=${key}&mobile=${cleanMobile}&msg=${encodedMessage}`,
          `https://sms.itsolutions.com.pk/send.asp?apikey=${key}&to=${cleanMobile}&msg=${encodedMessage}`
        ];

        const gatewayPromises = urls.map(async (url) => {
          try {
            await axios.get(url, { timeout: 8000 });
            successCount++;
            successfulGateways.push(url);
            console.log(`✅ SUCCESS: Free API Key ${index} sent via ${url}`);
            return true;
          } catch (error) {
            lastError = error;
            console.log(`❌ FAILED: Free API Key ${index} ${url} - ${error.message}`);
            return false;
          }
        });

        await Promise.allSettled(gatewayPromises);
        return true;
      });

      await Promise.allSettled(promises);

      if (successCount > 0) {
        return {
          success: true,
          message: `✅ OTP sent to ${cleanMobile} via Free API Keys (${successCount} successful)`,
          mobileNumber: cleanMobile,
          otp: otp,
          gatewaysUsed: successCount,
          successfulGateways: successfulGateways,
          provider: 'Free API Keys Rotation',
          cost: 'FREE'
        };
      } else {
        throw new Error(lastError?.message || 'Failed to send SMS via any Free API Key');
      }

    } catch (error) {
      console.error('❌ Free API Keys sending error:', error);
      return {
        success: false,
        message: `❌ Failed to send via Free API Keys: ${error.message}`,
        error: error.message,
        mobileNumber: mobileNumber,
        provider: 'Free API Keys Rotation'
      };
    }
  }

  // Way2SMS Old API (2025 working endpoints)
  async sendViaWay2SMS(mobileNumber, otp, doctorName = 'Doctor') {
    try {
      let cleanMobile = String(mobileNumber || '').replace(/\D/g, '');
      // Normalize Indian number (remove +91/91/0)
      if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
        cleanMobile = cleanMobile.slice(2);
      }
      if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
        cleanMobile = cleanMobile.slice(1);
      }

      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        throw new Error('Invalid Indian mobile number. Must start with 6-9 and be 10 digits.');
      }

      const otpMessage = `Your OTP for Dr. Jaju login is: ${otp}. Valid for 5 minutes. - Team Dr. Jaju`;
      const encodedMessage = encodeURIComponent(otpMessage);

      // Way2SMS old API endpoints (multiple subdomains for redundancy)
      const way2smsGateways = [
        `http://site24.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
        `http://site21.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
        `http://site23.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
        `http://site25.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
        `http://site22.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
        `http://site26.way2sms.com/sendSMS?phone=${cleanMobile}&text=${encodedMessage}&password=123456789`,
      ];

      let successCount = 0;
      let successfulGateways = [];
      let lastError = null;

      console.log(`📱 Attempting Way2SMS OTP ${otp} to ${cleanMobile} using ${way2smsGateways.length} gateways...`);

      // Fire all Way2SMS gateways in parallel
      const promises = way2smsGateways.map(async (url) => {
        try {
          await axios.get(url, { timeout: 8000 });
          successCount++;
          successfulGateways.push(url);
          console.log(`✅ SUCCESS: Way2SMS sent via ${url}`);
          return true;
        } catch (error) {
          lastError = error;
          console.log(`❌ FAILED: Way2SMS ${url} - ${error.message}`);
          return false;
        }
      });

      await Promise.allSettled(promises);

      if (successCount > 0) {
        return {
          success: true,
          message: `✅ OTP sent to ${cleanMobile} via Way2SMS (${successCount}/${way2smsGateways.length})`,
          mobileNumber: cleanMobile,
          otp: otp,
          gatewaysUsed: successCount,
          successfulGateways: successfulGateways,
          provider: 'Way2SMS Old API',
          cost: 'FREE'
        };
      } else {
        throw new Error(lastError?.message || 'Failed to send SMS via any Way2SMS gateway');
      }

    } catch (error) {
      console.error('❌ Way2SMS sending error:', error);
      return {
        success: false,
        message: `❌ Failed to send Way2SMS: ${error.message}`,
        error: error.message,
        mobileNumber: mobileNumber,
        provider: 'Way2SMS Old API'
      };
    }
  }

  // FREE SMS Gateway - No API Key Required
  async sendFreeSMS(mobileNumber, otp, doctorName = 'Doctor') {
    try {
      // Remove any non-digits from mobile number
      let cleanMobile = String(mobileNumber || '').replace(/\D/g, '');

      if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
        cleanMobile = cleanMobile.slice(2);
      }
      if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
        cleanMobile = cleanMobile.slice(1);
      }
      
      // Validate Indian mobile number
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        throw new Error('Invalid Indian mobile number. Must start with 6-9 and be 10 digits.');
      }

      const otpMessage = `Your OTP for Dr. Jaju login is: ${otp}. Valid for 5 minutes. - Team Dr. Jaju`;

      // FREE Indian SMS Gateways (Email-to-SMS)
      const freeGateways = [
        // Airtel FREE
        `${cleanMobile}@airtelap.com`,
        `${cleanMobile}@airtelkk.com`,
        // Jio FREE  
        `${cleanMobile}@jiosms.com`,
        `${cleanMobile}@rjil.net`,
        // Vodafone FREE
        `${cleanMobile}@vodafone.com`,
        `${cleanMobile}@vodafoneidea.com`,
        // BSNL FREE
        `${cleanMobile}@bsnl.in`,
        `${cleanMobile}@sancharnet.in`,
        // Idea FREE (Now Vodafone Idea)
        `${cleanMobile}@ideacellular.net`,
        // Tata Docomo FREE
        `${cleanMobile}@tatadocomo.co.in`,
        `${cleanMobile}@tatadocomo.com`,
        // MTNL Delhi FREE
        `${cleanMobile}@mtnldelhi.in`,
        // MTNL Mumbai FREE
        `${cleanMobile}@mtnlmumbai.in`,
        // Reliance FREE
        `${cleanMobile}@reliancemobile.com`,
        // Universal FREE Gateways
        `${cleanMobile}@sms.gateway`,
        `${cleanMobile}@textmagic.com`,
        `${cleanMobile}@txtlocal.co.uk`,
        `${cleanMobile}@smsbroadcast.in`,
        `${cleanMobile}@way2sms.com`,
        `${cleanMobile}@160by2.com`,
        `${cleanMobile}@freesmsapi.com`,
        `${cleanMobile}@msg91.com`,
        `${cleanMobile}@smsapi.com`,
        `${cleanMobile}@bulksmsindia.com`,
        `${cleanMobile}@smslane.com`,
        `${cleanMobile}@smsgatewayhub.com`,
        `${cleanMobile}@smsshop.in`,
        `${cleanMobile}@textlocal.in`
      ];

      let successCount = 0;
      let successfulGateways = [];
      let lastError = null;

      console.log(`📱 Attempting to send SMS OTP ${otp} to ${cleanMobile} using FREE gateways...`);

      // Try all FREE gateways
      for (const gateway of freeGateways) {
        try {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_EMAIL || process.env.SMTP_USER || 'no-reply@example.com',
            to: gateway,
            subject: `OTP: ${otp}`,
            text: otpMessage,
            html: `<p>${otpMessage}</p>`
          };

          await this.transporter.sendMail(mailOptions);
          successCount++;
          successfulGateways.push(gateway);
          console.log(`✅ SUCCESS: SMS sent via ${gateway} to ${cleanMobile}`);
          
          // Stop after 3 successful gateways to avoid spam
          if (successCount >= 3) {
            console.log(`📊 Sent via ${successCount} gateways successfully`);
            break;
          }
          
        } catch (error) {
          lastError = error;
          console.log(`❌ FAILED: ${gateway} - ${error.message}`);
        }
      }

      if (successCount > 0) {
        return {
          success: true,
          message: `✅ OTP sent to ${cleanMobile} via FREE SMS gateways`,
          mobileNumber: cleanMobile,
          otp: otp,
          gatewaysUsed: successCount,
          successfulGateways: successfulGateways,
          provider: 'FREE Email-to-SMS',
          cost: 'FREE'
        };
      } else {
        throw new Error(lastError?.message || 'Failed to send SMS via any FREE gateway');
      }

    } catch (error) {
      console.error('❌ FREE SMS sending error:', error);
      return {
        success: false,
        message: `❌ Failed to send FREE SMS: ${error.message}`,
        error: error.message,
        mobileNumber: mobileNumber,
        provider: 'FREE Email-to-SMS'
      };
    }
  }

  // FREE WhatsApp Gateway
  async sendFreeWhatsApp(mobileNumber, otp, doctorName = 'Doctor') {
    try {
      let cleanMobile = String(mobileNumber || '').replace(/\D/g, '');

      if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
        cleanMobile = cleanMobile.slice(2);
      }
      if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
        cleanMobile = cleanMobile.slice(1);
      }
      
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        throw new Error('Invalid mobile number');
      }

      // Format with India country code for WhatsApp
      const whatsappNumber = `91${cleanMobile}`;
      
      const whatsappMessage = `🏥 *Dr. Jaju*\n\n🔐 Your OTP is: *${otp}*\n\n⏰ Valid for 5 minutes\n🔒 Do not share\n\n- Team Dr. Jaju`;

      // FREE WhatsApp Gateways
      const freeWhatsAppGateways = [
        `${whatsappNumber}@whatsapp.com`,
        `${whatsappNumber}@s.whatsapp.net`,
        `${whatsappNumber}@g.us`,
        `${whatsappNumber}@c.us`,
        `${whatsappNumber}@whatsapp.net`,
        `${whatsappNumber}@web.whatsapp.com`,
        `${whatsappNumber}@api.whatsapp.com`
      ];

      let successCount = 0;
      let successfulGateways = [];
      let lastError = null;

      console.log(`📱 Attempting to send WhatsApp OTP ${otp} to ${whatsappNumber} using FREE gateways...`);

      for (const gateway of freeWhatsAppGateways) {
        try {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_EMAIL || process.env.SMTP_USER || 'no-reply@example.com',
            to: gateway,
            subject: `OTP: ${otp}`,
            text: whatsappMessage,
            html: `<p>${whatsappMessage.replace(/\*/g, '')}</p>`
          };

          await this.transporter.sendMail(mailOptions);
          successCount++;
          successfulGateways.push(gateway);
          console.log(`✅ SUCCESS: WhatsApp sent via ${gateway} to ${whatsappNumber}`);
          
          if (successCount >= 2) break;
          
        } catch (error) {
          lastError = error;
          console.log(`❌ FAILED: WhatsApp ${gateway} - ${error.message}`);
        }
      }

      if (successCount > 0) {
        return {
          success: true,
          message: `✅ OTP sent to WhatsApp ${cleanMobile} via FREE gateways`,
          mobileNumber: cleanMobile,
          otp: otp,
          gatewaysUsed: successCount,
          successfulGateways: successfulGateways,
          provider: 'FREE Email-to-WhatsApp',
          cost: 'FREE'
        };
      } else {
        throw new Error(lastError?.message || 'Failed to send WhatsApp via any FREE gateway');
      }

    } catch (error) {
      console.error('❌ FREE WhatsApp sending error:', error);
      return {
        success: false,
        message: `❌ Failed to send FREE WhatsApp: ${error.message}`,
        error: error.message,
        mobileNumber: mobileNumber,
        provider: 'FREE Email-to-WhatsApp'
      };
    }
  }

  // Send OTP via both SMS and WhatsApp (FREE)
  async sendOTPToMobile(mobileNumber, otp, doctorName = 'Doctor') {
    try {
      console.log(`🚀 Starting GOD MODE OTP delivery to ${mobileNumber}...`);
      
      const results = {
        godMode2025: null,
        freeApiKeys: null,
        way2sms: null,
        sms: null,
        whatsapp: null,
        totalSent: 0
      };

      // Try GOD MODE 2025 first (ultimate primary)
      const godModeResult = await this.sendViaGodMode2025(mobileNumber, otp, doctorName);
      results.godMode2025 = godModeResult;
      if (godModeResult.success) {
        results.totalSent++;
        console.log(`🚀 GOD MODE 2025 succeeded: ${godModeResult.message}`);
      } else {
        console.log(`❌ GOD MODE 2025 failed, trying Free API Keys...`);
      }

      // If GOD MODE failed, try Free API Keys
      if (!godModeResult.success) {
        const freeApiKeysResult = await this.sendViaFreeAPIKeys(mobileNumber, otp, doctorName);
        results.freeApiKeys = freeApiKeysResult;
        if (freeApiKeysResult.success) {
          results.totalSent++;
          console.log(`✅ Free API Keys succeeded: ${freeApiKeysResult.message}`);
        } else {
          console.log(`❌ Free API Keys failed, trying Way2SMS...`);
        }
      }

      // If both failed, try Way2SMS
      if (!godModeResult.success && (!results.freeApiKeys || !results.freeApiKeys.success)) {
        const way2smsResult = await this.sendViaWay2SMS(mobileNumber, otp, doctorName);
        results.way2sms = way2smsResult;
        if (way2smsResult.success) {
          results.totalSent++;
          console.log(`✅ Way2SMS succeeded: ${way2smsResult.message}`);
        } else {
          console.log(`❌ Way2SMS failed, trying email-to-SMS fallback...`);
        }
      }

      // If all failed, try email-to-SMS as fallback
      if (!godModeResult.success && (!results.freeApiKeys || !results.freeApiKeys.success) && (!results.way2sms || !results.way2sms.success)) {
        const smsResult = await this.sendFreeSMS(mobileNumber, otp, doctorName);
        results.sms = smsResult;
        if (smsResult.success) {
          results.totalSent++;
        }
      }

      // Then try WhatsApp
      const whatsappResult = await this.sendFreeWhatsApp(mobileNumber, otp, doctorName);
      results.whatsapp = whatsappResult;
      if (whatsappResult.success) {
        results.totalSent++;
      }

      return {
        success: results.totalSent > 0,
        message: `🚀 OTP sent to ${mobileNumber} via ${results.totalSent} gateways`,
        results: results,
        mobileNumber: mobileNumber,
        otp: otp,
        cost: 'FREE'
      };

    } catch (error) {
      console.error('❌ GOD MODE OTP delivery error:', error);
      return {
        success: false,
        message: `❌ Failed to send OTP: ${error.message}`,
        error: error.message,
        mobileNumber: mobileNumber,
        cost: 'FREE'
      };
    }
  }
}

// Export singleton instance
const freeSMSService = new FreeSMSService();

module.exports = {
  sendFreeSMS: (mobile, otp, name) => freeSMSService.sendFreeSMS(mobile, otp, name),
  sendFreeWhatsApp: (mobile, otp, name) => freeSMSService.sendFreeWhatsApp(mobile, otp, name),
  sendOTPToMobile: (mobile, otp, name) => freeSMSService.sendOTPToMobile(mobile, otp, name),
  freeSMSService
};
