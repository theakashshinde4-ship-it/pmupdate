/**
 * Import SNOMED CT Injections into injection_templates table
 *
 * Usage: node importSnomedInjections.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to SNOMED CT Description file
const SNOMED_FILE = path.join(__dirname, '../../../../snomedct/SnomedCT_InternationalRF2_PRODUCTION_20260101T120000Z/Snapshot/Terminology/sct2_Description_Snapshot-en_INT_20260101.txt');

// Database connection
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Parse injection details from term
function parseInjectionTerm(term) {
  const result = {
    injection_name: term,
    generic_name: null,
    dose: null,
    route: 'IM/IV'
  };

  // Extract dose pattern (e.g., "500mg", "10mg/2mL", "1mg/1mL")
  const doseMatch = term.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|iu|IU|units?)(?:\/(\d+(?:\.\d+)?)\s*m[Ll])?/i);
  if (doseMatch) {
    if (doseMatch[3]) {
      result.dose = `${doseMatch[1]}${doseMatch[2]}/${doseMatch[3]}mL`;
    } else {
      result.dose = `${doseMatch[1]}${doseMatch[2]}`;
    }
  }

  // Clean up injection name
  let cleanName = term
    .replace(/\s+injection.*$/i, '')
    .replace(/\s+\(pdr for recon\).*$/i, '')
    .replace(/\s+\d+mg.*$/i, '')
    .replace(/\s+\d+iu.*$/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();

  // Extract generic name from brand name patterns
  const brandMatch = cleanName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(.+)$/);
  if (brandMatch && brandMatch[1].length <= 15) {
    result.injection_name = cleanName;
    result.generic_name = brandMatch[2];
  } else {
    result.injection_name = cleanName;
    result.generic_name = cleanName;
  }

  // Determine route from term
  if (term.toLowerCase().includes('intra-articular')) {
    result.route = 'Intra-articular';
  } else if (term.toLowerCase().includes('intramuscular') || term.toLowerCase().includes('/im')) {
    result.route = 'IM';
  } else if (term.toLowerCase().includes('intravenous') || term.toLowerCase().includes('/iv') || term.toLowerCase().includes('infusion')) {
    result.route = 'IV';
  } else if (term.toLowerCase().includes('subcutaneous') || term.toLowerCase().includes('/sc')) {
    result.route = 'SC';
  } else if (term.toLowerCase().includes('epidural')) {
    result.route = 'Epidural';
  } else if (term.toLowerCase().includes('intrathecal')) {
    result.route = 'Intrathecal';
  }

  return result;
}

// Filter function to check if term is an injectable drug product
function isInjectableDrugProduct(term, active) {
  if (active !== '1') return false;

  const termLower = term.toLowerCase();

  // Must contain injection or infusion
  if (!termLower.includes('injection') && !termLower.includes('infusion') && !termLower.includes('injectable')) {
    return false;
  }

  // Exclude procedure descriptions
  const excludePatterns = [
    'injection of',
    'injection site',
    'following injection',
    'injection procedure',
    'injection into',
    'complication of',
    'insertion of',
    'removal of',
    'revision of',
    'injection, nos',
    'infection following',
    'phlebitis following',
    'thrombophlebitis',
    'thromboembolism',
    'sepsis following',
    'septicemia following',
    'reaction due to',
    'decompression',
    'mammoplasty',
    'hemorrhoidectomy',
    'arthrography',
    'transluminal',
    'transcatheter',
    'angioplasty',
    'thrombolysis',
    'radiography',
    'contrast media',
    'coronary',
    'percutaneous',
    'catheter',
  ];

  for (const pattern of excludePatterns) {
    if (termLower.includes(pattern)) {
      return false;
    }
  }

  // Must have dosage info or be a product
  const hasDosage = /\d+\s*(mg|g|mcg|iu|units?)/i.test(term);
  const isProduct = termLower.includes('injection') && !termLower.startsWith('injection');

  return hasDosage || isProduct;
}

async function main() {
  console.log('Starting SNOMED CT injection import...');
  console.log('Reading file:', SNOMED_FILE);

  if (!fs.existsSync(SNOMED_FILE)) {
    console.error('SNOMED file not found:', SNOMED_FILE);
    process.exit(1);
  }

  // Connect to database
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'patient_management'
  });

  console.log('Connected to database');

  // Read and parse file
  const fileStream = fs.createReadStream(SNOMED_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const injections = [];
  const seenNames = new Set();
  let lineCount = 0;
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    lineCount++;
    if (lineCount % 100000 === 0) {
      console.log(`Processed ${lineCount} lines...`);
    }

    const fields = line.split('\t');
    if (fields.length < 8) continue;

    const [id, effectiveTime, active, moduleId, conceptId, languageCode, typeId, term] = fields;

    if (isInjectableDrugProduct(term, active)) {
      const parsed = parseInjectionTerm(term);

      // Deduplicate by injection name + dose
      const key = `${parsed.injection_name.toLowerCase()}-${parsed.dose || ''}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        injections.push({
          ...parsed,
          snomed_code: conceptId
        });
      }
    }
  }

  console.log(`Found ${injections.length} unique injectable drug products`);

  // Insert into database
  let inserted = 0;
  let skipped = 0;

  for (const inj of injections) {
    try {
      // Check if already exists
      const [existing] = await db.execute(
        `SELECT id FROM injection_templates WHERE injection_name = ? AND dose = ?`,
        [inj.injection_name, inj.dose]
      );

      if (existing.length === 0) {
        await db.execute(`
          INSERT INTO injection_templates
          (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          inj.injection_name,
          inj.injection_name,
          inj.generic_name,
          inj.dose,
          inj.route,
          'As directed',
          'As needed'
        ]);
        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Error inserting ${inj.injection_name}:`, err.message);
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  - Inserted: ${inserted}`);
  console.log(`  - Skipped (already exists): ${skipped}`);
  console.log(`  - Total in SNOMED: ${injections.length}`);

  await db.end();
}

main().catch(console.error);
