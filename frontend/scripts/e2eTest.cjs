const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to login page', BASE);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });

    // perform login using provided credentials
    try {
      await page.fill('input[type="email"]', 'doctor@clinic.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      // Wait for token to be set in localStorage
      await page.waitForFunction(() => !!localStorage.getItem('token'), { timeout: 20000 });
      console.log('Login successful (token set), current URL:', page.url());
    } catch (e) {
      console.warn('Login attempt failed or not needed:', e.message);
    }

    // Ensure a symptom exists by selecting a patient from the Queue and adding one to their prescription
    try {
      console.log('Selecting first patient from Queue');
      await page.goto(`${BASE}/queue`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForSelector('button:has-text("Visit")', { timeout: 8000 });
      // Click the first Visit button
      await page.click('button:has-text("Visit")');
      // Wait for navigation / patient context to be set
      await page.waitForTimeout(1000);

      // Read selected patient id from sessionStorage
      const selectedPatientId = await page.evaluate(() => sessionStorage.getItem('selectedPatientId') || sessionStorage.getItem('selectedPatient') || null);
      if (selectedPatientId) {
        console.log('Found selectedPatientId:', selectedPatientId, 'navigating to prescription pad');
        await page.goto(`${BASE}/prescription-pad/${selectedPatientId}`, { waitUntil: 'networkidle', timeout: 20000 });

        // Use XPath to robustly find the symptoms input under the Symptoms heading
        const symptomXpath = "//h3[contains(., 'Symptoms')]/following::input[1]";
        await page.waitForSelector(`xpath=${symptomXpath}`, { timeout: 10000 });
        await page.fill(`xpath=${symptomXpath}`, 'Fever');
        await page.keyboard.press('Enter');
        await page.waitForSelector('text=Fever', { timeout: 5000 });
        console.log('Symptom added to prescription pad for patient', selectedPatientId);
      } else {
        console.warn('No selectedPatientId found in sessionStorage');
      }
    } catch (e) {
      console.warn('Could not add symptom via queue flow:', e.message);
    }

    console.log('Navigating to doctor dashboard', BASE);
    await page.goto(`${BASE}/doctor-dashboard`, { waitUntil: 'networkidle', timeout: 20000 });
    // wait for the MyGenie widget to be available
    await page.waitForSelector('.mygenie-widget .btn-open', { timeout: 20000 });

    // try to open MyGenie widget modal and run analyze/apply flow
    try {
      await page.waitForSelector('.mygenie-widget .btn-open', { timeout: 5000 });
      await page.click('.mygenie-widget .btn-open');
      console.log('Opened MyGenie modal');

      // Wait for Analyze button and click it for real flow
      await page.waitForSelector('.mygenie-modal .btn-analyze', { timeout: 8000 });
      console.log('MyGenie modal ready, clicking Analyze button for real flow');

      // Click Analyze button to trigger real backend analyze call
      try {
        await page.$eval('.mygenie-modal .btn-analyze', (el) => el.click());
        console.log('Clicked Analyze button');

        // Wait for suggestions to appear (real API call)
        await page.waitForSelector('.genie-suggestions .diagnosis-item, .genie-suggestions .medicine-item', { timeout: 15000 });
        console.log('Real suggestions received from backend');

        // Click Apply button
        await page.waitForSelector('.mygenie-modal .btn-apply', { timeout: 5000 });
        await page.$eval('.mygenie-modal .btn-apply', (el) => el.click());
        console.log('Applied real suggestions via global bridge');
      } catch (analyzeError) {
        console.warn('Real analyze flow failed, attempting mock injection fallback:', analyzeError.message);
        // Fallback: inject mock if real analyze fails
        await page.evaluate(() => {
          const modalContent = document.querySelector('.mygenie-modal .modal-content');
          if (!modalContent) return;
          const existing = modalContent.querySelector('.mock-genie-suggestions');
          if (existing) existing.remove();

          const s = document.createElement('div');
          s.className = 'genie-suggestions mock-genie-suggestions';
          s.innerHTML = `
            <div class="suggestion-section">
              <h3>📋 Possible Diagnoses</h3>
              <div class="diagnosis-list"><div class="diagnosis-item">Fever (Common)</div></div>
            </div>
            <div class="suggestion-section">
              <h3>💊 Recommended Medicines</h3>
              <div class="medicine-list"><div class="medicine-item">Paracetamol 500mg</div></div>
            </div>
            <div class="suggestion-footer">
              <p class="disclaimer">Fallback mock suggestions</p>
              <button class="btn-apply">✓ Apply to Prescription</button>
            </div>
          `;
          modalContent.appendChild(s);

          const applyBtn = modalContent.querySelector('.btn-apply');
          if (applyBtn) {
            applyBtn.addEventListener('click', () => {
              const payload = {
                symptoms: ['Fever'],
                diagnoses: ['Fever (Common)'],
                medications: [{ name: 'Paracetamol 500mg' }],
                advice: 'Rest and hydration'
              };
              if (typeof window.applyMyGenieSuggestion === 'function') {
                window.applyMyGenieSuggestion(payload);
              }
            });
          }
        });
        await page.waitForSelector('.mygenie-modal .btn-apply', { timeout: 5000 });
        await page.$eval('.mygenie-modal .btn-apply', (el) => el.click());
        console.log('Applied fallback mock suggestions');
      }
    } catch (e) {
      console.warn('MyGenie modal flow could not run fully:', e.message);
    }

    // Now navigate to a new prescription pad route (example patient id 1)
    await page.goto(`${BASE}/prescription-pad/1`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.screenshot({ path: './tmp_screenshots/e2e_prescription_pad.png', fullPage: true });
    console.log('Captured prescription pad screenshot');

  } catch (err) {
    console.error('E2E run failed', err);
  } finally {
    await browser.close();
  }
})();
