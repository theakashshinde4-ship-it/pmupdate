-- Comprehensive Symptom to Injection Mapping for Smart Suggestions
-- Clear existing data
TRUNCATE TABLE symptom_injection_mapping;

INSERT INTO symptom_injection_mapping (symptom_name, injection_name, generic_name, dose, route, timing, instructions, severity_level, age_group, recommendation_priority, is_first_line) VALUES

-- FEVER
('fever', 'Paracetamol Injection', 'Paracetamol/Acetaminophen', '1g', 'IV', 'Q6H PRN', 'Infuse over 15 minutes', 'Any', 'Adult', 1, 1),
('fever', 'Paracetamol Injection', 'Paracetamol/Acetaminophen', '15mg/kg', 'IV', 'Q6H PRN', 'Infuse over 15 minutes, max 60mg/kg/day', 'Any', 'Pediatric', 1, 1),
('fever', 'Diclofenac Injection', 'Diclofenac Sodium', '75mg', 'IM', 'BD', 'Deep IM injection', 'Moderate', 'Adult', 2, 0),

-- PAIN (General)
('pain', 'Diclofenac Injection', 'Diclofenac Sodium', '75mg', 'IM', 'BD', 'Deep IM injection in gluteal muscle', 'Moderate', 'Adult', 1, 1),
('pain', 'Tramadol Injection', 'Tramadol', '50mg', 'IV/IM', 'Q6H PRN', 'Slow IV push over 2-3 minutes', 'Moderate', 'Adult', 2, 0),
('pain', 'Ketorolac Injection', 'Ketorolac Tromethamine', '30mg', 'IV/IM', 'Q6H', 'Max 5 days use', 'Severe', 'Adult', 2, 0),

-- SEVERE PAIN
('severe pain', 'Morphine Injection', 'Morphine Sulfate', '5-10mg', 'IV/IM/SC', 'Q4H PRN', 'Titrate to pain relief', 'Severe', 'Adult', 1, 1),
('severe pain', 'Tramadol Injection', 'Tramadol', '100mg', 'IV/IM', 'Q6H PRN', 'Maximum 400mg/day', 'Severe', 'Adult', 2, 0),
('severe pain', 'Fentanyl Injection', 'Fentanyl', '50-100mcg', 'IV', 'PRN', 'Use with caution, monitor respiratory', 'Severe', 'Adult', 3, 0),

-- INFECTION / SEPSIS
('infection', 'Ceftriaxone Injection', 'Ceftriaxone', '1g', 'IV/IM', 'OD/BD', 'Reconstitute with lidocaine for IM', 'Moderate', 'Adult', 1, 1),
('infection', 'Amikacin Injection', 'Amikacin', '500mg', 'IV/IM', 'BD', 'Monitor renal function', 'Moderate', 'Adult', 2, 0),
('infection', 'Meropenem Injection', 'Meropenem', '1g', 'IV', 'TID', 'For severe infections', 'Severe', 'Adult', 1, 1),
('infection', 'Piperacillin-Tazobactam', 'Piperacillin-Tazobactam', '4.5g', 'IV', 'TID', 'Broad spectrum coverage', 'Severe', 'Adult', 2, 0),
('sepsis', 'Meropenem Injection', 'Meropenem', '1g', 'IV', 'TID', 'Empirical broad spectrum', 'Severe', 'Adult', 1, 1),
('sepsis', 'Vancomycin Injection', 'Vancomycin', '1g', 'IV', 'BD', 'For MRSA coverage', 'Severe', 'Adult', 2, 0),

-- VOMITING / NAUSEA
('vomiting', 'Ondansetron Injection', 'Ondansetron', '4mg', 'IV', 'TID PRN', 'Slow IV push', 'Any', 'Adult', 1, 1),
('vomiting', 'Metoclopramide Injection', 'Metoclopramide', '10mg', 'IV/IM', 'TID', 'Give before meals', 'Mild', 'Adult', 2, 0),
('nausea', 'Ondansetron Injection', 'Ondansetron', '4mg', 'IV', 'TID PRN', 'Slow IV push', 'Any', 'Adult', 1, 1),
('nausea', 'Prochlorperazine Injection', 'Prochlorperazine', '12.5mg', 'IM', 'Q6H PRN', 'Deep IM injection', 'Moderate', 'Adult', 2, 0),

-- ALLERGIC REACTION / ANAPHYLAXIS
('allergic reaction', 'Adrenaline Injection', 'Epinephrine', '0.5mg', 'IM', 'STAT', 'Anterolateral thigh, repeat in 5-15min if needed', 'Severe', 'Adult', 1, 1),
('allergic reaction', 'Hydrocortisone Injection', 'Hydrocortisone', '100mg', 'IV', 'STAT', 'Follow with oral steroids', 'Severe', 'Adult', 2, 1),
('allergic reaction', 'Chlorpheniramine Injection', 'Chlorpheniramine', '10mg', 'IV/IM', 'STAT', 'Antihistamine support', 'Moderate', 'Adult', 3, 0),
('anaphylaxis', 'Adrenaline Injection', 'Epinephrine', '0.5mg', 'IM', 'STAT', 'Anterolateral thigh, call for help', 'Severe', 'Adult', 1, 1),
('anaphylaxis', 'Hydrocortisone Injection', 'Hydrocortisone', '200mg', 'IV', 'STAT', 'After adrenaline', 'Severe', 'Adult', 2, 1),

-- ASTHMA / BREATHLESSNESS
('asthma', 'Hydrocortisone Injection', 'Hydrocortisone', '100-200mg', 'IV', 'Q6H', 'For acute exacerbation', 'Severe', 'Adult', 1, 1),
('asthma', 'Aminophylline Injection', 'Aminophylline', '250mg', 'IV', 'Infusion', 'Dilute in NS, infuse over 20-30min', 'Severe', 'Adult', 2, 0),
('breathlessness', 'Furosemide Injection', 'Furosemide', '40mg', 'IV', 'STAT', 'If fluid overload suspected', 'Severe', 'Adult', 2, 0),
('breathlessness', 'Dexamethasone Injection', 'Dexamethasone', '8mg', 'IV', 'OD', 'For inflammatory causes', 'Moderate', 'Adult', 3, 0),

-- DEHYDRATION
('dehydration', 'Normal Saline', 'Sodium Chloride 0.9%', '1L', 'IV', 'Infusion', 'Adjust rate based on severity', 'Any', 'All', 1, 1),
('dehydration', 'Ringer Lactate', 'Ringer Lactate', '1L', 'IV', 'Infusion', 'Preferred for severe dehydration', 'Severe', 'All', 1, 1),
('dehydration', 'DNS', 'Dextrose Normal Saline', '1L', 'IV', 'Infusion', 'If hypoglycemia present', 'Moderate', 'All', 2, 0),

-- ACIDITY / GASTRITIS
('acidity', 'Pantoprazole Injection', 'Pantoprazole', '40mg', 'IV', 'OD/BD', 'Infuse over 15 minutes', 'Moderate', 'Adult', 1, 1),
('acidity', 'Ranitidine Injection', 'Ranitidine', '50mg', 'IV', 'BD', 'Alternative to PPI', 'Mild', 'Adult', 2, 0),
('gastritis', 'Pantoprazole Injection', 'Pantoprazole', '40mg', 'IV', 'OD/BD', 'Continue for 3-5 days', 'Moderate', 'Adult', 1, 1),
('gastritis', 'Ondansetron Injection', 'Ondansetron', '4mg', 'IV', 'PRN', 'If nausea present', 'Any', 'Adult', 2, 0),

-- GI BLEEDING
('gi bleeding', 'Pantoprazole Injection', 'Pantoprazole', '80mg', 'IV', 'Bolus then 8mg/hr', 'High dose for active bleeding', 'Severe', 'Adult', 1, 1),
('gi bleeding', 'Tranexamic Acid', 'Tranexamic Acid', '1g', 'IV', 'TID', 'Antifibrinolytic', 'Severe', 'Adult', 2, 1),
('gi bleeding', 'Octreotide Injection', 'Octreotide', '50mcg', 'IV', 'Bolus then infusion', 'For variceal bleeding', 'Severe', 'Adult', 2, 0),

-- HYPOGLYCEMIA
('hypoglycemia', 'Dextrose 25%', 'Dextrose', '50mL', 'IV', 'STAT', 'Push slowly, repeat if needed', 'Severe', 'Adult', 1, 1),
('hypoglycemia', 'Dextrose 50%', 'Dextrose', '25mL', 'IV', 'STAT', 'Dilute if possible', 'Severe', 'Adult', 1, 1),
('hypoglycemia', 'Glucagon Injection', 'Glucagon', '1mg', 'IM/SC', 'STAT', 'If IV access difficult', 'Severe', 'Adult', 2, 0),

-- SEIZURES / CONVULSIONS
('seizures', 'Diazepam Injection', 'Diazepam', '10mg', 'IV', 'STAT', 'Slow IV push over 2-3min', 'Severe', 'Adult', 1, 1),
('seizures', 'Lorazepam Injection', 'Lorazepam', '4mg', 'IV', 'STAT', 'Preferred for status epilepticus', 'Severe', 'Adult', 1, 1),
('seizures', 'Phenytoin Injection', 'Phenytoin', '15-20mg/kg', 'IV', 'Loading', 'Max rate 50mg/min, monitor ECG', 'Severe', 'Adult', 2, 0),
('convulsions', 'Diazepam Injection', 'Diazepam', '10mg', 'IV', 'STAT', 'Protect airway', 'Severe', 'Adult', 1, 1),

-- HYPERTENSION EMERGENCY
('hypertension', 'Labetalol Injection', 'Labetalol', '20mg', 'IV', 'Repeat Q10min', 'Max 300mg total', 'Severe', 'Adult', 1, 1),
('hypertensive crisis', 'Nitroglycerin Injection', 'Nitroglycerin', '5mcg/min', 'IV', 'Infusion', 'Titrate to BP', 'Severe', 'Adult', 1, 1),
('hypertensive crisis', 'Sodium Nitroprusside', 'Sodium Nitroprusside', '0.3mcg/kg/min', 'IV', 'Infusion', 'Monitor closely, light sensitive', 'Severe', 'Adult', 2, 0),

-- CARDIAC / CHEST PAIN
('chest pain', 'Nitroglycerin Injection', 'Nitroglycerin', '5mcg/min', 'IV', 'Infusion', 'For ischemic pain', 'Severe', 'Adult', 1, 1),
('chest pain', 'Morphine Injection', 'Morphine Sulfate', '2-4mg', 'IV', 'PRN', 'For pain relief in MI', 'Severe', 'Adult', 2, 0),
('mi', 'Heparin Injection', 'Heparin', '5000U', 'IV', 'Bolus then infusion', 'Monitor aPTT', 'Severe', 'Adult', 1, 1),
('mi', 'Streptokinase Injection', 'Streptokinase', '1.5MU', 'IV', 'Infusion over 1hr', 'If no PCI available', 'Severe', 'Adult', 2, 0),

-- ANEMIA
('anemia', 'Iron Sucrose Injection', 'Iron Sucrose', '200mg', 'IV', '2-3 times/week', 'Dilute in 100mL NS, infuse over 15min', 'Moderate', 'Adult', 1, 1),
('anemia', 'Ferric Carboxymaltose', 'Ferric Carboxymaltose', '500-1000mg', 'IV', 'Once weekly', 'Infuse over 15-30min', 'Severe', 'Adult', 1, 1),
('anemia', 'Vitamin B12 Injection', 'Cyanocobalamin', '1000mcg', 'IM', 'Daily x 7d then weekly', 'For B12 deficiency', 'Moderate', 'Adult', 2, 0),

-- DIABETES (DKA)
('dka', 'Insulin Regular', 'Insulin Regular', '0.1U/kg/hr', 'IV', 'Infusion', 'Monitor glucose hourly', 'Severe', 'Adult', 1, 1),
('dka', 'Normal Saline', 'Sodium Chloride 0.9%', '1L', 'IV', 'Fast initially', 'Fluid resuscitation critical', 'Severe', 'Adult', 1, 1),
('dka', 'Potassium Chloride', 'Potassium Chloride', '20-40mEq', 'IV', 'In fluids', 'Monitor K+ closely', 'Severe', 'Adult', 2, 1),

-- PNEUMONIA
('pneumonia', 'Ceftriaxone Injection', 'Ceftriaxone', '2g', 'IV', 'OD', 'First line for CAP', 'Moderate', 'Adult', 1, 1),
('pneumonia', 'Azithromycin Injection', 'Azithromycin', '500mg', 'IV', 'OD', 'Add for atypical coverage', 'Moderate', 'Adult', 2, 1),
('pneumonia', 'Levofloxacin Injection', 'Levofloxacin', '750mg', 'IV', 'OD', 'Alternative monotherapy', 'Moderate', 'Adult', 2, 0),

-- UTI / UROSEPSIS
('uti', 'Ceftriaxone Injection', 'Ceftriaxone', '1g', 'IV', 'OD', 'For complicated UTI', 'Moderate', 'Adult', 1, 1),
('uti', 'Ciprofloxacin Injection', 'Ciprofloxacin', '400mg', 'IV', 'BD', 'Alternative', 'Moderate', 'Adult', 2, 0),
('urosepsis', 'Meropenem Injection', 'Meropenem', '1g', 'IV', 'TID', 'Broad spectrum', 'Severe', 'Adult', 1, 1),
('urosepsis', 'Amikacin Injection', 'Amikacin', '15mg/kg', 'IV', 'OD', 'Add for synergy', 'Severe', 'Adult', 2, 0),

-- MALARIA
('malaria', 'Artesunate Injection', 'Artesunate', '2.4mg/kg', 'IV', '0,12,24h then OD', 'For severe malaria', 'Severe', 'Adult', 1, 1),
('malaria', 'Quinine Injection', 'Quinine', '20mg/kg', 'IV', 'Loading over 4hr', 'If artesunate unavailable', 'Severe', 'Adult', 2, 0),

-- DENGUE
('dengue', 'Normal Saline', 'Sodium Chloride 0.9%', '1L', 'IV', 'As per protocol', 'Fluid management critical', 'Moderate', 'All', 1, 1),
('dengue', 'Ringer Lactate', 'Ringer Lactate', '1L', 'IV', 'As per protocol', 'Monitor hematocrit', 'Moderate', 'All', 1, 1),

-- ECLAMPSIA / PRE-ECLAMPSIA
('eclampsia', 'Magnesium Sulfate', 'Magnesium Sulfate', '4g', 'IV', 'Loading over 15-20min', 'Then 1g/hr maintenance', 'Severe', 'Adult', 1, 1),
('eclampsia', 'Labetalol Injection', 'Labetalol', '20mg', 'IV', 'Repeat Q10min', 'For BP control', 'Severe', 'Adult', 2, 1),
('pre-eclampsia', 'Magnesium Sulfate', 'Magnesium Sulfate', '4g', 'IV', 'Prophylaxis', 'For seizure prevention', 'Severe', 'Adult', 1, 1),

-- PPH (Post Partum Hemorrhage)
('pph', 'Oxytocin Injection', 'Oxytocin', '10U', 'IV/IM', 'STAT', 'First line', 'Severe', 'Adult', 1, 1),
('pph', 'Methylergometrine', 'Methylergonovine', '0.2mg', 'IM', 'STAT', 'Avoid if hypertensive', 'Severe', 'Adult', 2, 1),
('pph', 'Carboprost Injection', 'Carboprost', '250mcg', 'IM', 'Q15min x 8', 'If oxytocin fails', 'Severe', 'Adult', 3, 0),
('pph', 'Tranexamic Acid', 'Tranexamic Acid', '1g', 'IV', 'STAT', 'Within 3hrs of delivery', 'Severe', 'Adult', 2, 1),

-- SNAKE BITE
('snake bite', 'Anti-Snake Venom', 'Polyvalent ASV', '10 vials', 'IV', 'Infusion', 'Test dose first, have adrenaline ready', 'Severe', 'All', 1, 1),
('snake bite', 'Neostigmine Injection', 'Neostigmine', '0.5mg', 'IV', 'Q30min', 'For neurotoxic envenomation', 'Severe', 'Adult', 2, 0),

-- BURN
('burn', 'Morphine Injection', 'Morphine Sulfate', '0.1mg/kg', 'IV', 'Q4H PRN', 'Pain management critical', 'Severe', 'Adult', 1, 1),
('burn', 'Tetanus Toxoid', 'Tetanus Toxoid', '0.5mL', 'IM', 'STAT', 'Prophylaxis', 'Any', 'All', 2, 1),
('burn', 'Ringer Lactate', 'Ringer Lactate', 'Parkland formula', 'IV', 'Infusion', '4mL x kg x %TBSA over 24hr', 'Severe', 'All', 1, 1),

-- MIGRAINE
('migraine', 'Sumatriptan Injection', 'Sumatriptan', '6mg', 'SC', 'STAT', 'May repeat after 1hr', 'Moderate', 'Adult', 1, 1),
('migraine', 'Ketorolac Injection', 'Ketorolac', '30mg', 'IV/IM', 'STAT', 'For moderate pain', 'Moderate', 'Adult', 2, 0),
('migraine', 'Metoclopramide Injection', 'Metoclopramide', '10mg', 'IV', 'STAT', 'For associated nausea', 'Mild', 'Adult', 3, 0),

-- VERTIGO
('vertigo', 'Prochlorperazine Injection', 'Prochlorperazine', '12.5mg', 'IM', 'Q6H PRN', 'For vestibular symptoms', 'Moderate', 'Adult', 1, 1),
('vertigo', 'Ondansetron Injection', 'Ondansetron', '4mg', 'IV', 'PRN', 'For nausea', 'Any', 'Adult', 2, 0),

-- BACK PAIN
('back pain', 'Diclofenac Injection', 'Diclofenac Sodium', '75mg', 'IM', 'OD/BD', 'Deep IM injection', 'Moderate', 'Adult', 1, 1),
('back pain', 'Thiocolchicoside', 'Thiocolchicoside', '4mg', 'IM', 'BD', 'Muscle relaxant', 'Moderate', 'Adult', 2, 0),
('back pain', 'Methylprednisolone', 'Methylprednisolone', '40mg', 'IM', 'Single dose', 'For severe inflammation', 'Severe', 'Adult', 3, 0),

-- JOINT PAIN / ARTHRITIS
('joint pain', 'Diclofenac Injection', 'Diclofenac Sodium', '75mg', 'IM', 'OD', 'Anti-inflammatory', 'Moderate', 'Adult', 1, 1),
('joint pain', 'Triamcinolone', 'Triamcinolone Acetonide', '40mg', 'Intra-articular', 'Single dose', 'For specific joint', 'Moderate', 'Adult', 2, 0),
('arthritis', 'Methylprednisolone', 'Methylprednisolone', '40mg', 'IM', 'Weekly', 'For flare-up', 'Moderate', 'Adult', 2, 0),

-- COUGH
('cough', 'Dexamethasone Injection', 'Dexamethasone', '4mg', 'IV/IM', 'OD', 'For inflammatory cough', 'Moderate', 'Adult', 1, 1),
('cough', 'Hydrocortisone Injection', 'Hydrocortisone', '100mg', 'IV', 'STAT', 'For severe bronchospasm', 'Severe', 'Adult', 2, 0),

-- DIARRHEA
('diarrhea', 'Normal Saline', 'Sodium Chloride 0.9%', '1L', 'IV', 'Infusion', 'Rehydration', 'Moderate', 'All', 1, 1),
('diarrhea', 'Ringer Lactate', 'Ringer Lactate', '1L', 'IV', 'Infusion', 'Preferred for severe cases', 'Severe', 'All', 1, 1),
('diarrhea', 'Ondansetron Injection', 'Ondansetron', '4mg', 'IV', 'PRN', 'For associated nausea', 'Any', 'Adult', 2, 0),

-- WEAKNESS
('weakness', 'Vitamin B12 Injection', 'Cyanocobalamin', '1000mcg', 'IM', 'Weekly', 'For B12 deficiency', 'Mild', 'Adult', 1, 1),
('weakness', 'Iron Sucrose Injection', 'Iron Sucrose', '200mg', 'IV', '2-3 times/week', 'If iron deficiency', 'Moderate', 'Adult', 2, 0),

-- HEADACHE
('headache', 'Paracetamol Injection', 'Paracetamol', '1g', 'IV', 'Q6H PRN', 'First line', 'Mild', 'Adult', 1, 1),
('headache', 'Diclofenac Injection', 'Diclofenac Sodium', '75mg', 'IM', 'OD', 'For moderate pain', 'Moderate', 'Adult', 2, 0),
('headache', 'Sumatriptan Injection', 'Sumatriptan', '6mg', 'SC', 'STAT', 'For migraine', 'Moderate', 'Adult', 3, 0),

-- ABDOMINAL PAIN
('abdominal pain', 'Hyoscine Injection', 'Hyoscine Butylbromide', '20mg', 'IV/IM', 'TID PRN', 'For spasmodic pain', 'Moderate', 'Adult', 1, 1),
('abdominal pain', 'Tramadol Injection', 'Tramadol', '50mg', 'IV/IM', 'Q6H PRN', 'For moderate-severe pain', 'Moderate', 'Adult', 2, 0),
('abdominal pain', 'Pantoprazole Injection', 'Pantoprazole', '40mg', 'IV', 'OD', 'If gastric cause suspected', 'Any', 'Adult', 2, 0);

SELECT COUNT(*) as total_smart_suggestions FROM symptom_injection_mapping;
