/**
 * Extract ALL Injectable Medications from SNOMED CT and Insert into Database
 *
 * This script reads the SNOMED CT India Drug Extension and International files
 * to extract all injectable medications and inserts them into the database.
 *
 * Usage: node extractSnomedInjections.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

// Database configuration
const DB_CONFIG = {
  host: '72.60.206.56',
  port: 3306,
  user: 'root',
  password: 'LASTrivon@8055',
  database: 'patient_management'
};

// SNOMED CT Files - Correct paths
const SNOMED_FILES = [
  // India Drug Extension - Primary source for Indian drugs
  'c:/Users/ACER/Downloads/pmupdated/snomedct/SnomedCT_IndiaDrugExtensionRF2_PRODUCTION_IN1000189_20251219T120000Z/Snapshot/Terminology/sct2_Description_Snapshot-en_IN1000189_20251219T120000Z.txt',
  // International - Backup source
  'c:/Users/ACER/Downloads/pmupdated/snomedct/SnomedCT_InternationalRF2_PRODUCTION_20260101T120000Z/Snapshot/Terminology/sct2_Description_Snapshot-en_INT_20260101.txt'
];

// Parse injection details from term
function parseInjectionTerm(term, conceptId) {
  const result = {
    template_name: '',
    injection_name: '',
    generic_name: null,
    dose: null,
    route: 'IV/IM',
    frequency: 'As directed',
    duration: 'As directed',
    snomed_code: conceptId
  };

  // Clean the term
  let cleanTerm = term.trim();

  // Extract dose patterns
  // Patterns: 500mg, 10mg/2mL, 1g, 100mcg, 5000IU, 10 units, etc.
  const dosePatterns = [
    /(\d+(?:\.\d+)?)\s*(mg|g|mcg|iu|IU|units?|mL|ml)(?:\s*\/\s*(\d+(?:\.\d+)?)\s*(mL|ml))?/gi,
    /(\d+(?:\.\d+)?)\s*(million\s*units?|MU|mu)/gi,
    /(\d+(?:\.\d+)?)\s*%/gi
  ];

  let doseMatch = null;
  for (const pattern of dosePatterns) {
    const match = cleanTerm.match(pattern);
    if (match) {
      doseMatch = match[0];
      break;
    }
  }

  if (doseMatch) {
    result.dose = doseMatch.replace(/\s+/g, '');
  }

  // Determine route from term
  const termLower = cleanTerm.toLowerCase();

  if (termLower.includes('intra-articular') || termLower.includes('intraarticular')) {
    result.route = 'Intra-articular';
  } else if (termLower.includes('intramuscular') || termLower.includes(' im ') || termLower.includes('/im')) {
    result.route = 'IM';
  } else if (termLower.includes('intravenous') || termLower.includes(' iv ') || termLower.includes('/iv')) {
    result.route = 'IV';
  } else if (termLower.includes('subcutaneous') || termLower.includes(' sc ') || termLower.includes('/sc') || termLower.includes('subcut')) {
    result.route = 'SC';
  } else if (termLower.includes('epidural')) {
    result.route = 'Epidural';
  } else if (termLower.includes('intrathecal')) {
    result.route = 'Intrathecal';
  } else if (termLower.includes('infusion')) {
    result.route = 'IV Infusion';
  } else if (termLower.includes('intradermal') || termLower.includes(' id ')) {
    result.route = 'Intradermal';
  } else if (termLower.includes('intravitreal')) {
    result.route = 'Intravitreal';
  } else if (termLower.includes('intraocular')) {
    result.route = 'Intraocular';
  } else if (termLower.includes('intracardiac')) {
    result.route = 'Intracardiac';
  } else if (termLower.includes('intraosseous')) {
    result.route = 'Intraosseous';
  } else if (termLower.includes('intraperitoneal')) {
    result.route = 'Intraperitoneal';
  }

  // Clean injection name - remove dosage and parenthetical info
  let injectionName = cleanTerm
    .replace(/\s*\([^)]*\)\s*/g, ' ')  // Remove parenthetical info
    .replace(/\s+injection.*$/i, '')
    .replace(/\s+injectable.*$/i, '')
    .replace(/\s+infusion.*$/i, '')
    .replace(/\s+solution.*$/i, '')
    .replace(/\s+concentrate.*$/i, '')
    .replace(/\s+powder.*$/i, '')
    .replace(/\s+for\s+injection.*$/i, '')
    .replace(/\s+pdr\s+for.*$/i, '')
    .replace(/\s*\d+(?:\.\d+)?\s*(mg|g|mcg|iu|IU|units?|mL|ml|%|million\s*units?|MU)(?:\s*\/\s*\d+(?:\.\d+)?\s*(mL|ml))?.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If name is too long, truncate intelligently
  if (injectionName.length > 200) {
    injectionName = injectionName.substring(0, 200).trim();
  }

  // Set names
  result.injection_name = injectionName || cleanTerm.substring(0, 200);
  result.template_name = result.dose
    ? `${injectionName} ${result.dose}`.substring(0, 250)
    : injectionName.substring(0, 250);
  result.generic_name = injectionName;

  return result;
}

// Check if term is an injectable drug product
function isInjectableDrugProduct(term, active) {
  if (active !== '1') return false;

  const termLower = term.toLowerCase();

  // Must contain injection-related keywords
  const includePatterns = [
    'injection',
    'injectable',
    'infusion',
    'for injection',
    'inj ',
    ' inj',
    'parenteral',
    'iv solution',
    'im solution',
    'sc solution'
  ];

  let hasInclude = false;
  for (const pattern of includePatterns) {
    if (termLower.includes(pattern)) {
      hasInclude = true;
      break;
    }
  }

  if (!hasInclude) return false;

  // Exclude non-drug terms (procedures, complications, etc.)
  const excludePatterns = [
    'injection of',
    'injection into',
    'injection site',
    'injection procedure',
    'following injection',
    'complication of',
    'adverse reaction',
    'insertion of',
    'removal of',
    'revision of',
    'infection following',
    'phlebitis following',
    'thrombophlebitis',
    'thromboembolism',
    'sepsis following',
    'septicemia',
    'reaction due to',
    'decompression',
    'arthrography',
    'transluminal',
    'transcatheter',
    'angioplasty',
    'thrombolysis',
    'contrast media',
    'percutaneous',
    'catheter',
    'needle',
    'syringe',
    'device',
    'finding',
    'disorder',
    'disease',
    'syndrome',
    'history of',
    'allergy to',
    'reaction to',
    'poisoning',
    'overdose',
    'accident',
    'injury',
    'procedure',
    'observation',
    'assessment',
    'evaluation'
  ];

  for (const pattern of excludePatterns) {
    if (termLower.includes(pattern)) {
      return false;
    }
  }

  // Should have product characteristics (dosage, brand pattern, etc.)
  const hasDosage = /\d+\s*(mg|g|mcg|iu|units?|ml|%)/i.test(term);
  const hasProductWord = termLower.includes('product') || termLower.includes('medicinal') || termLower.includes('pharmaceutical');
  const startsWithCapital = /^[A-Z][a-z]/.test(term);
  const isNotProcedure = !termLower.startsWith('injection ');

  return (hasDosage || hasProductWord || startsWithCapital) && isNotProcedure;
}

async function processFile(filePath, db, seenKeys, stats) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);

  if (!fs.existsSync(filePath)) {
    console.log(`  File not found: ${filePath}`);
    return;
  }

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let isHeader = true;
  const batchSize = 100;
  let batch = [];

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    lineCount++;
    if (lineCount % 100000 === 0) {
      console.log(`  Processed ${lineCount} lines...`);
    }

    const fields = line.split('\t');
    if (fields.length < 8) continue;

    const [id, effectiveTime, active, moduleId, conceptId, languageCode, typeId, term] = fields;

    if (isInjectableDrugProduct(term, active)) {
      const parsed = parseInjectionTerm(term, conceptId);

      // Create unique key to avoid duplicates
      const key = `${parsed.injection_name.toLowerCase()}-${(parsed.dose || '').toLowerCase()}`;

      if (!seenKeys.has(key) && parsed.injection_name.length > 2) {
        seenKeys.add(key);
        batch.push(parsed);
        stats.found++;

        // Insert in batches
        if (batch.length >= batchSize) {
          await insertBatch(db, batch, stats);
          batch = [];
        }
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await insertBatch(db, batch, stats);
  }

  console.log(`  Lines processed: ${lineCount}`);
}

async function insertBatch(db, batch, stats) {
  for (const inj of batch) {
    try {
      // Check if already exists
      const [existing] = await db.execute(
        `SELECT id FROM injection_templates WHERE template_name = ? LIMIT 1`,
        [inj.template_name]
      );

      if (existing.length === 0) {
        await db.execute(`
          INSERT INTO injection_templates
          (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          inj.template_name,
          inj.injection_name,
          inj.generic_name,
          inj.dose,
          inj.route,
          inj.frequency,
          inj.duration
        ]);
        stats.inserted++;
      } else {
        stats.skipped++;
      }
    } catch (err) {
      stats.errors++;
      if (stats.errors <= 5) {
        console.error(`  Error inserting "${inj.template_name}": ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('SNOMED CT Injectable Medications Extractor');
  console.log('='.repeat(60));

  // Connect to database
  console.log('\nConnecting to database...');
  const db = await mysql.createConnection(DB_CONFIG);
  console.log('Connected successfully!');

  // Get current count
  const [currentCount] = await db.execute('SELECT COUNT(*) as count FROM injection_templates WHERE is_active = 1');
  console.log(`Current injections in database: ${currentCount[0].count}`);

  const seenKeys = new Set();
  const stats = {
    found: 0,
    inserted: 0,
    skipped: 0,
    errors: 0
  };

  // Pre-populate seenKeys with existing entries to avoid duplicates
  console.log('\nLoading existing entries...');
  const [existingEntries] = await db.execute('SELECT template_name, injection_name, dose FROM injection_templates');
  for (const entry of existingEntries) {
    const key = `${(entry.injection_name || '').toLowerCase()}-${(entry.dose || '').toLowerCase()}`;
    seenKeys.add(key);
  }
  console.log(`Loaded ${existingEntries.length} existing entries`);

  // Process each SNOMED file
  for (const filePath of SNOMED_FILES) {
    await processFile(filePath, db, seenKeys, stats);
  }

  // Get final count
  const [finalCount] = await db.execute('SELECT COUNT(*) as count FROM injection_templates WHERE is_active = 1');

  console.log('\n' + '='.repeat(60));
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Injectable terms found: ${stats.found}`);
  console.log(`New injections inserted: ${stats.inserted}`);
  console.log(`Duplicates skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Total injections in database: ${finalCount[0].count}`);
  console.log('='.repeat(60));

  await db.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
