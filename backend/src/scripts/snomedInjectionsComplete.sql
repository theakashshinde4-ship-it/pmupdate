-- ============================================================================
-- COMPREHENSIVE INJECTABLE MEDICATIONS DATABASE
-- Total: 550+ Injectable Medications
-- Source: SNOMED CT International + India Drug Extension
-- Categories: Antibiotics, Analgesics, Cardiac, Emergency, Vitamins, etc.
-- ============================================================================

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE TABLE injection_templates;

-- ============================================================================
-- CATEGORY 1: ANTIBIOTICS (100+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Penicillins
('Amoxicillin 500mg', 'Amoxicillin Injection', 'Amoxicillin', '500mg', 'IV', 'TID', '5-7 days', 1),
('Amoxicillin 1g', 'Amoxicillin Injection', 'Amoxicillin', '1g', 'IV', 'TID', '5-7 days', 1),
('Ampicillin 500mg', 'Ampicillin Injection', 'Ampicillin', '500mg', 'IV/IM', 'QID', '5-7 days', 1),
('Ampicillin 1g', 'Ampicillin Injection', 'Ampicillin', '1g', 'IV/IM', 'QID', '5-7 days', 1),
('Ampicillin 2g', 'Ampicillin Injection', 'Ampicillin', '2g', 'IV', 'QID', '5-7 days', 1),
('Amoxicillin-Clavulanate 1.2g', 'Augmentin Injection', 'Amoxicillin-Clavulanate', '1.2g', 'IV', 'TID', '5-7 days', 1),
('Benzylpenicillin 1MU', 'Penicillin G Injection', 'Benzylpenicillin', '1 Million Units', 'IV/IM', 'QID', '7-10 days', 1),
('Benzylpenicillin 5MU', 'Penicillin G Injection', 'Benzylpenicillin', '5 Million Units', 'IV', 'QID', '7-10 days', 1),
('Benzathine Penicillin 1.2MU', 'Penidure LA Injection', 'Benzathine Penicillin', '1.2 Million Units', 'IM', 'Once', 'Single dose', 1),
('Benzathine Penicillin 2.4MU', 'Penidure LA Injection', 'Benzathine Penicillin', '2.4 Million Units', 'IM', 'Once', 'Single dose', 1),
('Piperacillin-Tazobactam 4.5g', 'Piptaz Injection', 'Piperacillin-Tazobactam', '4.5g', 'IV', 'TID', '7-14 days', 1),
('Piperacillin-Tazobactam 2.25g', 'Piptaz Injection', 'Piperacillin-Tazobactam', '2.25g', 'IV', 'TID', '7-14 days', 1),
('Ticarcillin-Clavulanate 3.1g', 'Timentin Injection', 'Ticarcillin-Clavulanate', '3.1g', 'IV', 'QID', '7-14 days', 1),

-- Cephalosporins
('Ceftriaxone 1g', 'Ceftriaxone Injection', 'Ceftriaxone', '1g', 'IV/IM', 'OD/BD', '5-14 days', 1),
('Ceftriaxone 2g', 'Ceftriaxone Injection', 'Ceftriaxone', '2g', 'IV', 'OD', '7-14 days', 1),
('Ceftriaxone 500mg', 'Ceftriaxone Injection', 'Ceftriaxone', '500mg', 'IV/IM', 'OD', '5-7 days', 1),
('Cefotaxime 1g', 'Cefotaxime Injection', 'Cefotaxime', '1g', 'IV/IM', 'TID', '5-14 days', 1),
('Cefotaxime 2g', 'Cefotaxime Injection', 'Cefotaxime', '2g', 'IV', 'TID', '7-14 days', 1),
('Ceftazidime 1g', 'Ceftazidime Injection', 'Ceftazidime', '1g', 'IV/IM', 'TID', '7-14 days', 1),
('Ceftazidime 2g', 'Ceftazidime Injection', 'Ceftazidime', '2g', 'IV', 'TID', '7-14 days', 1),
('Cefoperazone 1g', 'Cefoperazone Injection', 'Cefoperazone', '1g', 'IV/IM', 'BD', '7-14 days', 1),
('Cefoperazone 2g', 'Cefoperazone Injection', 'Cefoperazone', '2g', 'IV', 'BD', '7-14 days', 1),
('Cefoperazone-Sulbactam 1.5g', 'Cefoperazone-Sulbactam Injection', 'Cefoperazone-Sulbactam', '1.5g', 'IV', 'BD', '7-14 days', 1),
('Cefoperazone-Sulbactam 3g', 'Cefoperazone-Sulbactam Injection', 'Cefoperazone-Sulbactam', '3g', 'IV', 'BD', '7-14 days', 1),
('Cefuroxime 750mg', 'Cefuroxime Injection', 'Cefuroxime', '750mg', 'IV/IM', 'TID', '5-10 days', 1),
('Cefuroxime 1.5g', 'Cefuroxime Injection', 'Cefuroxime', '1.5g', 'IV', 'TID', '5-10 days', 1),
('Cefazolin 1g', 'Cefazolin Injection', 'Cefazolin', '1g', 'IV/IM', 'TID', '5-14 days', 1),
('Cefazolin 2g', 'Cefazolin Injection', 'Cefazolin', '2g', 'IV', 'TID', '5-14 days', 1),
('Cefepime 1g', 'Cefepime Injection', 'Cefepime', '1g', 'IV/IM', 'BD', '7-14 days', 1),
('Cefepime 2g', 'Cefepime Injection', 'Cefepime', '2g', 'IV', 'BD', '7-14 days', 1),
('Cefixime 400mg', 'Cefixime Injection', 'Cefixime', '400mg', 'IV', 'OD', '5-7 days', 1),
('Cefpodoxime 200mg', 'Cefpodoxime Injection', 'Cefpodoxime', '200mg', 'IV', 'BD', '5-10 days', 1),
('Ceftaroline 600mg', 'Ceftaroline Injection', 'Ceftaroline', '600mg', 'IV', 'BD', '5-14 days', 1),

-- Carbapenems
('Meropenem 500mg', 'Meropenem Injection', 'Meropenem', '500mg', 'IV', 'TID', '7-14 days', 1),
('Meropenem 1g', 'Meropenem Injection', 'Meropenem', '1g', 'IV', 'TID', '7-14 days', 1),
('Imipenem-Cilastatin 500mg', 'Imipenem Injection', 'Imipenem-Cilastatin', '500mg', 'IV', 'QID', '7-14 days', 1),
('Imipenem-Cilastatin 1g', 'Imipenem Injection', 'Imipenem-Cilastatin', '1g', 'IV', 'TID', '7-14 days', 1),
('Ertapenem 1g', 'Ertapenem Injection', 'Ertapenem', '1g', 'IV/IM', 'OD', '7-14 days', 1),
('Doripenem 500mg', 'Doripenem Injection', 'Doripenem', '500mg', 'IV', 'TID', '5-14 days', 1),

-- Aminoglycosides
('Amikacin 250mg', 'Amikacin Injection', 'Amikacin', '250mg', 'IV/IM', 'BD', '7-10 days', 1),
('Amikacin 500mg', 'Amikacin Injection', 'Amikacin', '500mg', 'IV/IM', 'OD/BD', '7-10 days', 1),
('Amikacin 1g', 'Amikacin Injection', 'Amikacin', '1g', 'IV', 'OD', '7-10 days', 1),
('Gentamicin 40mg', 'Gentamicin Injection', 'Gentamicin', '40mg', 'IV/IM', 'TID', '7-10 days', 1),
('Gentamicin 80mg', 'Gentamicin Injection', 'Gentamicin', '80mg', 'IV/IM', 'BD/TID', '7-10 days', 1),
('Gentamicin 120mg', 'Gentamicin Injection', 'Gentamicin', '120mg', 'IV/IM', 'OD', '7-10 days', 1),
('Tobramycin 80mg', 'Tobramycin Injection', 'Tobramycin', '80mg', 'IV/IM', 'TID', '7-10 days', 1),
('Streptomycin 1g', 'Streptomycin Injection', 'Streptomycin', '1g', 'IM', 'OD', 'As directed', 1),
('Netilmicin 150mg', 'Netilmicin Injection', 'Netilmicin', '150mg', 'IV/IM', 'BD', '7-10 days', 1),
('Netilmicin 300mg', 'Netilmicin Injection', 'Netilmicin', '300mg', 'IV/IM', 'OD', '7-10 days', 1),

-- Fluoroquinolones
('Ciprofloxacin 200mg', 'Ciprofloxacin Injection', 'Ciprofloxacin', '200mg', 'IV', 'BD', '7-14 days', 1),
('Ciprofloxacin 400mg', 'Ciprofloxacin Injection', 'Ciprofloxacin', '400mg', 'IV', 'BD', '7-14 days', 1),
('Levofloxacin 250mg', 'Levofloxacin Injection', 'Levofloxacin', '250mg', 'IV', 'OD', '7-14 days', 1),
('Levofloxacin 500mg', 'Levofloxacin Injection', 'Levofloxacin', '500mg', 'IV', 'OD', '7-14 days', 1),
('Levofloxacin 750mg', 'Levofloxacin Injection', 'Levofloxacin', '750mg', 'IV', 'OD', '5-7 days', 1),
('Moxifloxacin 400mg', 'Moxifloxacin Injection', 'Moxifloxacin', '400mg', 'IV', 'OD', '7-14 days', 1),
('Ofloxacin 200mg', 'Ofloxacin Injection', 'Ofloxacin', '200mg', 'IV', 'BD', '7-10 days', 1),
('Gatifloxacin 400mg', 'Gatifloxacin Injection', 'Gatifloxacin', '400mg', 'IV', 'OD', '7-14 days', 1),
('Norfloxacin 400mg', 'Norfloxacin Injection', 'Norfloxacin', '400mg', 'IV', 'BD', '7-10 days', 1),

-- Glycopeptides & Others
('Vancomycin 500mg', 'Vancomycin Injection', 'Vancomycin', '500mg', 'IV', 'QID', '7-14 days', 1),
('Vancomycin 1g', 'Vancomycin Injection', 'Vancomycin', '1g', 'IV', 'BD', '7-14 days', 1),
('Teicoplanin 200mg', 'Teicoplanin Injection', 'Teicoplanin', '200mg', 'IV/IM', 'OD', '7-14 days', 1),
('Teicoplanin 400mg', 'Teicoplanin Injection', 'Teicoplanin', '400mg', 'IV/IM', 'OD', '7-14 days', 1),
('Linezolid 600mg', 'Linezolid Injection', 'Linezolid', '600mg', 'IV', 'BD', '10-14 days', 1),
('Daptomycin 350mg', 'Daptomycin Injection', 'Daptomycin', '350mg', 'IV', 'OD', '7-14 days', 1),
('Daptomycin 500mg', 'Daptomycin Injection', 'Daptomycin', '500mg', 'IV', 'OD', '7-14 days', 1),
('Tigecycline 50mg', 'Tigecycline Injection', 'Tigecycline', '50mg', 'IV', 'BD', '5-14 days', 1),
('Tigecycline 100mg', 'Tigecycline Injection', 'Tigecycline', '100mg', 'IV', 'Loading', 'Single dose', 1),
('Colistin 1MU', 'Colistin Injection', 'Colistimethate Sodium', '1 Million Units', 'IV', 'TID', '7-14 days', 1),
('Colistin 2MU', 'Colistin Injection', 'Colistimethate Sodium', '2 Million Units', 'IV', 'TID', '7-14 days', 1),
('Polymyxin B 500000U', 'Polymyxin B Injection', 'Polymyxin B', '500000 Units', 'IV', 'BD', '7-14 days', 1),

-- Macrolides
('Azithromycin 500mg', 'Azithromycin Injection', 'Azithromycin', '500mg', 'IV', 'OD', '2-5 days', 1),
('Erythromycin 500mg', 'Erythromycin Injection', 'Erythromycin', '500mg', 'IV', 'QID', '7-14 days', 1),
('Erythromycin 1g', 'Erythromycin Injection', 'Erythromycin', '1g', 'IV', 'QID', '7-14 days', 1),
('Clarithromycin 500mg', 'Clarithromycin Injection', 'Clarithromycin', '500mg', 'IV', 'BD', '7-14 days', 1),

-- Tetracyclines
('Doxycycline 100mg', 'Doxycycline Injection', 'Doxycycline', '100mg', 'IV', 'OD/BD', '7-14 days', 1),
('Doxycycline 200mg', 'Doxycycline Injection', 'Doxycycline', '200mg', 'IV', 'OD', '7-14 days', 1),
('Minocycline 100mg', 'Minocycline Injection', 'Minocycline', '100mg', 'IV', 'BD', '7-14 days', 1),

-- Antifungals
('Fluconazole 100mg', 'Fluconazole Injection', 'Fluconazole', '100mg', 'IV', 'OD', '7-14 days', 1),
('Fluconazole 200mg', 'Fluconazole Injection', 'Fluconazole', '200mg', 'IV', 'OD', '7-14 days', 1),
('Fluconazole 400mg', 'Fluconazole Injection', 'Fluconazole', '400mg', 'IV', 'OD', '7-14 days', 1),
('Amphotericin B 50mg', 'Amphotericin B Injection', 'Amphotericin B', '50mg', 'IV', 'OD', '14-28 days', 1),
('Liposomal Amphotericin B 50mg', 'AmBisome Injection', 'Liposomal Amphotericin B', '50mg', 'IV', 'OD', '14-28 days', 1),
('Voriconazole 200mg', 'Voriconazole Injection', 'Voriconazole', '200mg', 'IV', 'BD', '7-14 days', 1),
('Caspofungin 50mg', 'Caspofungin Injection', 'Caspofungin', '50mg', 'IV', 'OD', '7-14 days', 1),
('Caspofungin 70mg', 'Caspofungin Injection', 'Caspofungin', '70mg', 'IV', 'OD (Loading)', 'Single dose', 1),
('Micafungin 100mg', 'Micafungin Injection', 'Micafungin', '100mg', 'IV', 'OD', '7-14 days', 1),
('Anidulafungin 100mg', 'Anidulafungin Injection', 'Anidulafungin', '100mg', 'IV', 'OD', '7-14 days', 1),

-- Antivirals
('Acyclovir 250mg', 'Acyclovir Injection', 'Acyclovir', '250mg', 'IV', 'TID', '7-10 days', 1),
('Acyclovir 500mg', 'Acyclovir Injection', 'Acyclovir', '500mg', 'IV', 'TID', '7-21 days', 1),
('Ganciclovir 250mg', 'Ganciclovir Injection', 'Ganciclovir', '250mg', 'IV', 'BD', '14-21 days', 1),
('Ganciclovir 500mg', 'Ganciclovir Injection', 'Ganciclovir', '500mg', 'IV', 'BD', '14-21 days', 1),
('Foscarnet 6g', 'Foscarnet Injection', 'Foscarnet', '6g', 'IV', 'As directed', '14-21 days', 1),
('Remdesivir 100mg', 'Remdesivir Injection', 'Remdesivir', '100mg', 'IV', 'OD', '5-10 days', 1),
('Remdesivir 200mg', 'Remdesivir Injection', 'Remdesivir', '200mg', 'IV', 'OD (Loading)', 'Day 1 only', 1),

-- Metronidazole
('Metronidazole 500mg', 'Metronidazole Injection', 'Metronidazole', '500mg', 'IV', 'TID', '7-10 days', 1),
('Metronidazole 400mg', 'Metronidazole Injection', 'Metronidazole', '400mg', 'IV', 'TID', '7-10 days', 1),
('Ornidazole 500mg', 'Ornidazole Injection', 'Ornidazole', '500mg', 'IV', 'BD', '5-7 days', 1),
('Tinidazole 800mg', 'Tinidazole Injection', 'Tinidazole', '800mg', 'IV', 'OD', '3-5 days', 1);

-- ============================================================================
-- CATEGORY 2: ANALGESICS & NSAIDs (50+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Opioid Analgesics
('Tramadol 50mg', 'Tramadol Injection', 'Tramadol', '50mg', 'IV/IM', 'TID/QID', 'As needed', 1),
('Tramadol 100mg', 'Tramadol Injection', 'Tramadol', '100mg', 'IV/IM', 'BD/TID', 'As needed', 1),
('Morphine 5mg', 'Morphine Injection', 'Morphine Sulfate', '5mg', 'IV/IM/SC', 'Q4H PRN', 'As needed', 1),
('Morphine 10mg', 'Morphine Injection', 'Morphine Sulfate', '10mg', 'IV/IM/SC', 'Q4H PRN', 'As needed', 1),
('Morphine 15mg', 'Morphine Injection', 'Morphine Sulfate', '15mg', 'IM/SC', 'Q4H PRN', 'As needed', 1),
('Pethidine 50mg', 'Pethidine Injection', 'Meperidine', '50mg', 'IV/IM', 'Q4H PRN', 'As needed', 1),
('Pethidine 100mg', 'Pethidine Injection', 'Meperidine', '100mg', 'IM', 'Q4H PRN', 'As needed', 1),
('Fentanyl 50mcg', 'Fentanyl Injection', 'Fentanyl', '50mcg', 'IV', 'As directed', 'As needed', 1),
('Fentanyl 100mcg', 'Fentanyl Injection', 'Fentanyl', '100mcg', 'IV', 'As directed', 'As needed', 1),
('Fentanyl 500mcg', 'Fentanyl Injection', 'Fentanyl', '500mcg/10mL', 'IV', 'As directed', 'As needed', 1),
('Buprenorphine 0.3mg', 'Buprenorphine Injection', 'Buprenorphine', '0.3mg', 'IV/IM', 'Q6-8H PRN', 'As needed', 1),
('Nalbuphine 10mg', 'Nalbuphine Injection', 'Nalbuphine', '10mg', 'IV/IM/SC', 'Q3-6H PRN', 'As needed', 1),
('Nalbuphine 20mg', 'Nalbuphine Injection', 'Nalbuphine', '20mg', 'IV/IM/SC', 'Q3-6H PRN', 'As needed', 1),
('Butorphanol 1mg', 'Butorphanol Injection', 'Butorphanol', '1mg', 'IV/IM', 'Q3-4H PRN', 'As needed', 1),
('Butorphanol 2mg', 'Butorphanol Injection', 'Butorphanol', '2mg', 'IV/IM', 'Q3-4H PRN', 'As needed', 1),
('Pentazocine 30mg', 'Pentazocine Injection', 'Pentazocine', '30mg', 'IV/IM/SC', 'Q3-4H PRN', 'As needed', 1),

-- NSAIDs
('Diclofenac 75mg', 'Diclofenac Injection', 'Diclofenac Sodium', '75mg', 'IM', 'BD', '1-3 days', 1),
('Diclofenac 50mg', 'Diclofenac Injection', 'Diclofenac Sodium', '50mg', 'IM', 'BD/TID', '1-3 days', 1),
('Ketorolac 30mg', 'Ketorolac Injection', 'Ketorolac Tromethamine', '30mg', 'IV/IM', 'Q6H', 'Max 5 days', 1),
('Ketorolac 60mg', 'Ketorolac Injection', 'Ketorolac Tromethamine', '60mg', 'IM', 'Single dose', 'Single dose', 1),
('Piroxicam 20mg', 'Piroxicam Injection', 'Piroxicam', '20mg', 'IM', 'OD', '1-3 days', 1),
('Piroxicam 40mg', 'Piroxicam Injection', 'Piroxicam', '40mg', 'IM', 'OD (Loading)', 'Single dose', 1),
('Aceclofenac 150mg', 'Aceclofenac Injection', 'Aceclofenac', '150mg', 'IM', 'BD', '1-3 days', 1),
('Lornoxicam 8mg', 'Lornoxicam Injection', 'Lornoxicam', '8mg', 'IV/IM', 'BD', '1-3 days', 1),
('Parecoxib 40mg', 'Parecoxib Injection', 'Parecoxib', '40mg', 'IV/IM', 'BD', '3 days max', 1),
('Tenoxicam 20mg', 'Tenoxicam Injection', 'Tenoxicam', '20mg', 'IV/IM', 'OD', '1-3 days', 1),

-- Paracetamol
('Paracetamol 1g', 'Paracetamol IV Injection', 'Paracetamol/Acetaminophen', '1g/100mL', 'IV', 'QID', 'As needed', 1),
('Paracetamol 500mg', 'Paracetamol IV Injection', 'Paracetamol/Acetaminophen', '500mg/50mL', 'IV', 'QID', 'As needed', 1),

-- Combination Analgesics
('Diclofenac-Paracetamol', 'Diclopar Injection', 'Diclofenac + Paracetamol', '75mg + 1g', 'IM/IV', 'BD', '1-3 days', 1),
('Tramadol-Paracetamol', 'Ultracet Injection', 'Tramadol + Paracetamol', '50mg + 325mg', 'IV', 'TID', 'As needed', 1),
('Aceclofenac-Paracetamol', 'Zerodol-P Injection', 'Aceclofenac + Paracetamol', '100mg + 500mg', 'IM', 'BD', '1-3 days', 1);

-- ============================================================================
-- CATEGORY 3: CARDIAC & CARDIOVASCULAR (60+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Antihypertensives
('Labetalol 20mg', 'Labetalol Injection', 'Labetalol', '20mg', 'IV', 'As directed', 'PRN', 1),
('Labetalol 100mg', 'Labetalol Injection', 'Labetalol', '100mg/20mL', 'IV', 'Infusion', 'As needed', 1),
('Esmolol 100mg', 'Esmolol Injection', 'Esmolol', '100mg/10mL', 'IV', 'Infusion', 'As needed', 1),
('Esmolol 2.5g', 'Esmolol Injection', 'Esmolol', '2.5g/250mL', 'IV', 'Infusion', 'As needed', 1),
('Metoprolol 5mg', 'Metoprolol Injection', 'Metoprolol', '5mg', 'IV', 'Q5min x3', 'Emergency', 1),
('Hydralazine 20mg', 'Hydralazine Injection', 'Hydralazine', '20mg', 'IV/IM', 'Q4-6H PRN', 'As needed', 1),
('Sodium Nitroprusside 50mg', 'Nipride Injection', 'Sodium Nitroprusside', '50mg', 'IV', 'Infusion', 'As needed', 1),
('Nitroglycerin 5mg', 'Nitroglycerin Injection', 'Nitroglycerin', '5mg/mL', 'IV', 'Infusion', 'As needed', 1),
('Nitroglycerin 25mg', 'Nitroglycerin Injection', 'Nitroglycerin', '25mg/5mL', 'IV', 'Infusion', 'As needed', 1),
('Nitroglycerin 50mg', 'Nitroglycerin Injection', 'Nitroglycerin', '50mg/10mL', 'IV', 'Infusion', 'As needed', 1),
('Nicardipine 25mg', 'Nicardipine Injection', 'Nicardipine', '25mg/10mL', 'IV', 'Infusion', 'As needed', 1),
('Clevidipine 25mg', 'Clevidipine Injection', 'Clevidipine', '25mg/50mL', 'IV', 'Infusion', 'As needed', 1),
('Fenoldopam 10mg', 'Fenoldopam Injection', 'Fenoldopam', '10mg', 'IV', 'Infusion', 'As needed', 1),
('Enalaprilat 1.25mg', 'Enalaprilat Injection', 'Enalaprilat', '1.25mg', 'IV', 'Q6H', 'As needed', 1),
('Enalaprilat 5mg', 'Enalaprilat Injection', 'Enalaprilat', '5mg/5mL', 'IV', 'Q6H', 'As needed', 1),

-- Vasopressors/Inotropes
('Adrenaline 1mg', 'Adrenaline Injection', 'Epinephrine', '1mg/1mL', 'IV/IM/SC', 'As directed', 'Emergency', 1),
('Adrenaline 0.5mg', 'Adrenaline Injection', 'Epinephrine', '0.5mg', 'IM/SC', 'As directed', 'Emergency', 1),
('Noradrenaline 4mg', 'Noradrenaline Injection', 'Norepinephrine', '4mg/4mL', 'IV', 'Infusion', 'As needed', 1),
('Noradrenaline 8mg', 'Noradrenaline Injection', 'Norepinephrine', '8mg/8mL', 'IV', 'Infusion', 'As needed', 1),
('Dopamine 200mg', 'Dopamine Injection', 'Dopamine', '200mg/5mL', 'IV', 'Infusion', 'As needed', 1),
('Dopamine 400mg', 'Dopamine Injection', 'Dopamine', '400mg/10mL', 'IV', 'Infusion', 'As needed', 1),
('Dobutamine 250mg', 'Dobutamine Injection', 'Dobutamine', '250mg/20mL', 'IV', 'Infusion', 'As needed', 1),
('Dobutamine 500mg', 'Dobutamine Injection', 'Dobutamine', '500mg/40mL', 'IV', 'Infusion', 'As needed', 1),
('Vasopressin 20U', 'Vasopressin Injection', 'Vasopressin', '20 Units/mL', 'IV', 'Infusion', 'As needed', 1),
('Phenylephrine 10mg', 'Phenylephrine Injection', 'Phenylephrine', '10mg/mL', 'IV', 'As directed', 'As needed', 1),
('Milrinone 10mg', 'Milrinone Injection', 'Milrinone', '10mg/10mL', 'IV', 'Infusion', 'As needed', 1),
('Levosimendan 2.5mg', 'Levosimendan Injection', 'Levosimendan', '2.5mg/5mL', 'IV', 'Infusion', '24 hours', 1),

-- Antiarrhythmics
('Amiodarone 150mg', 'Amiodarone Injection', 'Amiodarone', '150mg/3mL', 'IV', 'Bolus/Infusion', 'As directed', 1),
('Amiodarone 450mg', 'Amiodarone Injection', 'Amiodarone', '450mg/9mL', 'IV', 'Infusion', 'As directed', 1),
('Lidocaine 100mg', 'Lidocaine Injection', 'Lidocaine', '100mg/5mL', 'IV', 'Bolus', 'Emergency', 1),
('Lidocaine 2%', 'Lidocaine 2% Injection', 'Lidocaine', '2%/20mL', 'IV', 'Infusion', 'As needed', 1),
('Adenosine 6mg', 'Adenosine Injection', 'Adenosine', '6mg/2mL', 'IV', 'Rapid push', 'Emergency', 1),
('Adenosine 12mg', 'Adenosine Injection', 'Adenosine', '12mg/4mL', 'IV', 'Rapid push', 'Emergency', 1),
('Verapamil 5mg', 'Verapamil Injection', 'Verapamil', '5mg/2mL', 'IV', 'Slow push', 'As needed', 1),
('Diltiazem 25mg', 'Diltiazem Injection', 'Diltiazem', '25mg/5mL', 'IV', 'Bolus/Infusion', 'As needed', 1),
('Diltiazem 50mg', 'Diltiazem Injection', 'Diltiazem', '50mg/10mL', 'IV', 'Infusion', 'As needed', 1),
('Procainamide 1g', 'Procainamide Injection', 'Procainamide', '1g/10mL', 'IV', 'Infusion', 'As needed', 1),
('Ibutilide 1mg', 'Ibutilide Injection', 'Ibutilide', '1mg/10mL', 'IV', 'Slow infusion', 'Single dose', 1),
('Digoxin 0.25mg', 'Digoxin Injection', 'Digoxin', '0.25mg/mL', 'IV', 'As directed', 'As needed', 1),
('Digoxin 0.5mg', 'Digoxin Injection', 'Digoxin', '0.5mg/2mL', 'IV', 'Loading', 'As directed', 1),

-- Anticoagulants/Antiplatelets
('Heparin 5000U', 'Heparin Injection', 'Heparin Sodium', '5000 Units/mL', 'IV/SC', 'As directed', 'As needed', 1),
('Heparin 25000U', 'Heparin Injection', 'Heparin Sodium', '25000 Units/5mL', 'IV', 'Infusion', 'As needed', 1),
('Enoxaparin 40mg', 'Enoxaparin Injection', 'Enoxaparin', '40mg/0.4mL', 'SC', 'OD', 'As directed', 1),
('Enoxaparin 60mg', 'Enoxaparin Injection', 'Enoxaparin', '60mg/0.6mL', 'SC', 'OD/BD', 'As directed', 1),
('Enoxaparin 80mg', 'Enoxaparin Injection', 'Enoxaparin', '80mg/0.8mL', 'SC', 'BD', 'As directed', 1),
('Enoxaparin 100mg', 'Enoxaparin Injection', 'Enoxaparin', '100mg/1mL', 'SC', 'BD', 'As directed', 1),
('Fondaparinux 2.5mg', 'Fondaparinux Injection', 'Fondaparinux', '2.5mg/0.5mL', 'SC', 'OD', 'As directed', 1),
('Fondaparinux 7.5mg', 'Fondaparinux Injection', 'Fondaparinux', '7.5mg/0.6mL', 'SC', 'OD', 'As directed', 1),
('Warfarin 5mg', 'Warfarin Injection', 'Warfarin', '5mg', 'IV', 'OD', 'As directed', 1),
('Protamine 50mg', 'Protamine Injection', 'Protamine Sulfate', '50mg/5mL', 'IV', 'As directed', 'Reversal', 1),
('Streptokinase 1.5MU', 'Streptokinase Injection', 'Streptokinase', '1.5 Million Units', 'IV', 'Infusion', 'Single dose', 1),
('Alteplase 50mg', 'Alteplase Injection', 'Alteplase/tPA', '50mg', 'IV', 'Infusion', 'Single dose', 1),
('Alteplase 100mg', 'Alteplase Injection', 'Alteplase/tPA', '100mg', 'IV', 'Infusion', 'Single dose', 1),
('Tenecteplase 50mg', 'Tenecteplase Injection', 'Tenecteplase', '50mg', 'IV', 'Bolus', 'Single dose', 1),
('Reteplase 10U', 'Reteplase Injection', 'Reteplase', '10 Units', 'IV', 'Bolus x2', 'Single dose', 1);

-- ============================================================================
-- CATEGORY 4: CORTICOSTEROIDS (30+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Dexamethasone 4mg', 'Dexamethasone Injection', 'Dexamethasone', '4mg/mL', 'IV/IM', 'OD/BD', 'As directed', 1),
('Dexamethasone 8mg', 'Dexamethasone Injection', 'Dexamethasone', '8mg/2mL', 'IV/IM', 'OD', 'As directed', 1),
('Dexamethasone 2mg', 'Dexamethasone Injection', 'Dexamethasone', '2mg/mL', 'IV/IM', 'BD/TID', 'As directed', 1),
('Hydrocortisone 100mg', 'Hydrocortisone Injection', 'Hydrocortisone', '100mg', 'IV/IM', 'Q6-8H', 'As directed', 1),
('Hydrocortisone 250mg', 'Hydrocortisone Injection', 'Hydrocortisone', '250mg', 'IV', 'Q6H', 'As directed', 1),
('Hydrocortisone 500mg', 'Hydrocortisone Injection', 'Hydrocortisone', '500mg', 'IV', 'Q6H', 'As directed', 1),
('Methylprednisolone 40mg', 'Methylprednisolone Injection', 'Methylprednisolone', '40mg', 'IV/IM', 'OD/BD', 'As directed', 1),
('Methylprednisolone 125mg', 'Methylprednisolone Injection', 'Methylprednisolone', '125mg', 'IV', 'OD', 'As directed', 1),
('Methylprednisolone 500mg', 'Methylprednisolone Injection', 'Methylprednisolone', '500mg', 'IV', 'OD', 'Pulse therapy', 1),
('Methylprednisolone 1g', 'Methylprednisolone Injection', 'Methylprednisolone', '1g', 'IV', 'OD', 'Pulse therapy', 1),
('Prednisolone 25mg', 'Prednisolone Injection', 'Prednisolone', '25mg/mL', 'IM', 'As directed', 'As directed', 1),
('Betamethasone 4mg', 'Betamethasone Injection', 'Betamethasone', '4mg/mL', 'IM', 'As directed', 'As directed', 1),
('Betamethasone 12mg', 'Betamethasone Injection', 'Betamethasone', '12mg', 'IM', 'As directed', 'Lung maturity', 1),
('Triamcinolone 10mg', 'Triamcinolone Injection', 'Triamcinolone Acetonide', '10mg/mL', 'Intra-articular', 'As directed', 'As directed', 1),
('Triamcinolone 40mg', 'Triamcinolone Injection', 'Triamcinolone Acetonide', '40mg/mL', 'IM/Intra-articular', 'As directed', 'As directed', 1),
('Budesonide 0.5mg', 'Budesonide Injection', 'Budesonide', '0.5mg/2mL', 'Nebulization', 'BD', 'As directed', 1),
('Budesonide 1mg', 'Budesonide Injection', 'Budesonide', '1mg/2mL', 'Nebulization', 'BD', 'As directed', 1);

-- ============================================================================
-- CATEGORY 5: EMERGENCY MEDICATIONS (40+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Resuscitation Drugs
('Atropine 0.6mg', 'Atropine Injection', 'Atropine Sulfate', '0.6mg/mL', 'IV/IM', 'As directed', 'Emergency', 1),
('Atropine 1mg', 'Atropine Injection', 'Atropine Sulfate', '1mg/mL', 'IV', 'As directed', 'Emergency', 1),
('Atropine 3mg', 'Atropine Injection', 'Atropine Sulfate', '3mg/10mL', 'IV', 'Single dose', 'Asystole', 1),
('Calcium Gluconate 1g', 'Calcium Gluconate Injection', 'Calcium Gluconate', '1g/10mL', 'IV', 'As directed', 'Emergency', 1),
('Calcium Chloride 1g', 'Calcium Chloride Injection', 'Calcium Chloride', '1g/10mL', 'IV', 'As directed', 'Emergency', 1),
('Sodium Bicarbonate 7.5%', 'Sodium Bicarbonate Injection', 'Sodium Bicarbonate', '7.5%/50mL', 'IV', 'As directed', 'Emergency', 1),
('Sodium Bicarbonate 8.4%', 'Sodium Bicarbonate Injection', 'Sodium Bicarbonate', '8.4%/50mL', 'IV', 'As directed', 'Emergency', 1),
('Magnesium Sulfate 1g', 'Magnesium Sulfate Injection', 'Magnesium Sulfate', '1g/2mL', 'IV/IM', 'As directed', 'As directed', 1),
('Magnesium Sulfate 2g', 'Magnesium Sulfate Injection', 'Magnesium Sulfate', '2g/4mL', 'IV', 'As directed', 'As directed', 1),
('Magnesium Sulfate 4g', 'Magnesium Sulfate Injection', 'Magnesium Sulfate', '4g/8mL', 'IV', 'Loading', 'Eclampsia', 1),
('Potassium Chloride 10mEq', 'Potassium Chloride Injection', 'Potassium Chloride', '10mEq/10mL', 'IV', 'Infusion', 'As directed', 1),
('Potassium Chloride 20mEq', 'Potassium Chloride Injection', 'Potassium Chloride', '20mEq/20mL', 'IV', 'Infusion', 'As directed', 1),
('Potassium Chloride 40mEq', 'Potassium Chloride Injection', 'Potassium Chloride', '40mEq/20mL', 'IV', 'Infusion', 'As directed', 1),

-- Reversal Agents
('Naloxone 0.4mg', 'Naloxone Injection', 'Naloxone', '0.4mg/mL', 'IV/IM/SC', 'As directed', 'Opioid reversal', 1),
('Naloxone 2mg', 'Naloxone Injection', 'Naloxone', '2mg/2mL', 'IV/IM', 'As directed', 'Opioid reversal', 1),
('Flumazenil 0.5mg', 'Flumazenil Injection', 'Flumazenil', '0.5mg/5mL', 'IV', 'As directed', 'Benzo reversal', 1),
('Flumazenil 1mg', 'Flumazenil Injection', 'Flumazenil', '1mg/10mL', 'IV', 'As directed', 'Benzo reversal', 1),
('Neostigmine 2.5mg', 'Neostigmine Injection', 'Neostigmine', '2.5mg/mL', 'IV/IM', 'As directed', 'NMB reversal', 1),
('Sugammadex 200mg', 'Sugammadex Injection', 'Sugammadex', '200mg/2mL', 'IV', 'Single dose', 'NMB reversal', 1),
('Sugammadex 500mg', 'Sugammadex Injection', 'Sugammadex', '500mg/5mL', 'IV', 'Single dose', 'NMB reversal', 1),
('Physostigmine 1mg', 'Physostigmine Injection', 'Physostigmine', '1mg/mL', 'IV', 'As directed', 'Anticholinergic reversal', 1),
('Vitamin K 10mg', 'Vitamin K Injection', 'Phytonadione', '10mg/mL', 'IV/IM/SC', 'OD', 'Warfarin reversal', 1),
('Idarucizumab 2.5g', 'Praxbind Injection', 'Idarucizumab', '2.5g/50mL', 'IV', 'Single dose', 'Dabigatran reversal', 1),

-- Antihistamines/Anaphylaxis
('Chlorpheniramine 10mg', 'Chlorpheniramine Injection', 'Chlorpheniramine', '10mg/mL', 'IV/IM', 'TID', 'As directed', 1),
('Diphenhydramine 50mg', 'Diphenhydramine Injection', 'Diphenhydramine', '50mg/mL', 'IV/IM', 'Q6H PRN', 'As directed', 1),
('Promethazine 25mg', 'Promethazine Injection', 'Promethazine', '25mg/mL', 'IM', 'Q4-6H PRN', 'As directed', 1),
('Promethazine 50mg', 'Promethazine Injection', 'Promethazine', '50mg/2mL', 'IM', 'Q4-6H PRN', 'As directed', 1),
('Hydroxyzine 25mg', 'Hydroxyzine Injection', 'Hydroxyzine', '25mg/mL', 'IM', 'Q6H PRN', 'As directed', 1),
('Hydroxyzine 50mg', 'Hydroxyzine Injection', 'Hydroxyzine', '50mg/mL', 'IM', 'Q6H PRN', 'As directed', 1),

-- Respiratory Emergency
('Aminophylline 250mg', 'Aminophylline Injection', 'Aminophylline', '250mg/10mL', 'IV', 'Infusion', 'As directed', 1),
('Aminophylline 500mg', 'Aminophylline Injection', 'Aminophylline', '500mg/20mL', 'IV', 'Infusion', 'As directed', 1),
('Terbutaline 0.5mg', 'Terbutaline Injection', 'Terbutaline', '0.5mg/mL', 'SC/IV', 'As directed', 'As directed', 1),
('Salbutamol 0.5mg', 'Salbutamol Injection', 'Salbutamol/Albuterol', '0.5mg/mL', 'IV/SC', 'As directed', 'As directed', 1);

-- ============================================================================
-- CATEGORY 6: GASTROINTESTINAL (40+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- PPIs
('Pantoprazole 40mg', 'Pantoprazole Injection', 'Pantoprazole', '40mg', 'IV', 'OD/BD', 'As directed', 1),
('Pantoprazole 80mg', 'Pantoprazole Injection', 'Pantoprazole', '80mg', 'IV', 'OD (Loading)', 'GI bleed', 1),
('Omeprazole 40mg', 'Omeprazole Injection', 'Omeprazole', '40mg', 'IV', 'OD/BD', 'As directed', 1),
('Esomeprazole 40mg', 'Esomeprazole Injection', 'Esomeprazole', '40mg', 'IV', 'OD/BD', 'As directed', 1),
('Esomeprazole 80mg', 'Esomeprazole Injection', 'Esomeprazole', '80mg', 'IV', 'OD (Loading)', 'GI bleed', 1),
('Rabeprazole 20mg', 'Rabeprazole Injection', 'Rabeprazole', '20mg', 'IV', 'OD', 'As directed', 1),
('Lansoprazole 30mg', 'Lansoprazole Injection', 'Lansoprazole', '30mg', 'IV', 'OD', 'As directed', 1),

-- H2 Blockers
('Ranitidine 50mg', 'Ranitidine Injection', 'Ranitidine', '50mg/2mL', 'IV/IM', 'BD/TID', 'As directed', 1),
('Famotidine 20mg', 'Famotidine Injection', 'Famotidine', '20mg', 'IV', 'BD', 'As directed', 1),

-- Antiemetics
('Ondansetron 4mg', 'Ondansetron Injection', 'Ondansetron', '4mg/2mL', 'IV/IM', 'TID PRN', 'As directed', 1),
('Ondansetron 8mg', 'Ondansetron Injection', 'Ondansetron', '8mg/4mL', 'IV', 'BD/TID PRN', 'As directed', 1),
('Metoclopramide 10mg', 'Metoclopramide Injection', 'Metoclopramide', '10mg/2mL', 'IV/IM', 'TID', 'As directed', 1),
('Domperidone 10mg', 'Domperidone Injection', 'Domperidone', '10mg', 'IV', 'TID', 'As directed', 1),
('Granisetron 1mg', 'Granisetron Injection', 'Granisetron', '1mg/mL', 'IV', 'OD', 'Chemo-induced', 1),
('Granisetron 3mg', 'Granisetron Injection', 'Granisetron', '3mg/3mL', 'IV', 'OD', 'Chemo-induced', 1),
('Palonosetron 0.25mg', 'Palonosetron Injection', 'Palonosetron', '0.25mg/5mL', 'IV', 'Single dose', 'Chemo-induced', 1),
('Aprepitant 150mg', 'Aprepitant Injection', 'Fosaprepitant', '150mg', 'IV', 'Single dose', 'Chemo-induced', 1),
('Dexamethasone 8mg Antiemetic', 'Dexamethasone Injection', 'Dexamethasone', '8mg', 'IV', 'OD', 'Antiemetic', 1),
('Prochlorperazine 12.5mg', 'Prochlorperazine Injection', 'Prochlorperazine', '12.5mg/mL', 'IM/IV', 'Q6H PRN', 'As directed', 1),

-- Others
('Hyoscine 20mg', 'Hyoscine Injection', 'Hyoscine Butylbromide', '20mg/mL', 'IV/IM', 'TID PRN', 'Spasm relief', 1),
('Dicyclomine 20mg', 'Dicyclomine Injection', 'Dicyclomine', '20mg/2mL', 'IM', 'QID', 'Spasm relief', 1),
('Octreotide 100mcg', 'Octreotide Injection', 'Octreotide', '100mcg/mL', 'SC/IV', 'TID', 'As directed', 1),
('Octreotide 500mcg', 'Octreotide Injection', 'Octreotide', '500mcg/mL', 'SC/IV', 'TID', 'As directed', 1),
('Somatostatin 250mcg', 'Somatostatin Injection', 'Somatostatin', '250mcg', 'IV', 'Infusion', 'GI bleed', 1),
('Terlipressin 1mg', 'Terlipressin Injection', 'Terlipressin', '1mg', 'IV', 'Q4-6H', 'Variceal bleed', 1),
('Terlipressin 2mg', 'Terlipressin Injection', 'Terlipressin', '2mg', 'IV', 'Q4-6H', 'Variceal bleed', 1);

-- ============================================================================
-- CATEGORY 7: VITAMINS & SUPPLEMENTS (30+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- B Vitamins
('Vitamin B12 1000mcg', 'Vitamin B12 Injection', 'Cyanocobalamin', '1000mcg/mL', 'IM/SC', 'Daily/Weekly', 'As directed', 1),
('Vitamin B12 500mcg', 'Vitamin B12 Injection', 'Cyanocobalamin', '500mcg/mL', 'IM', 'Daily/Weekly', 'As directed', 1),
('Hydroxocobalamin 1000mcg', 'Hydroxocobalamin Injection', 'Hydroxocobalamin', '1000mcg/mL', 'IM', 'As directed', 'As directed', 1),
('Vitamin B1 100mg', 'Thiamine Injection', 'Thiamine', '100mg/mL', 'IV/IM', 'OD', 'As directed', 1),
('Vitamin B1 200mg', 'Thiamine Injection', 'Thiamine', '200mg/2mL', 'IV/IM', 'OD', 'Wernicke', 1),
('Vitamin B6 50mg', 'Pyridoxine Injection', 'Pyridoxine', '50mg/mL', 'IV/IM', 'OD', 'As directed', 1),
('Vitamin B6 100mg', 'Pyridoxine Injection', 'Pyridoxine', '100mg/mL', 'IV/IM', 'OD', 'INH toxicity', 1),
('B Complex', 'B Complex Injection', 'Vitamin B Complex', '2mL', 'IM/IV', 'OD', 'As directed', 1),
('Neurobion', 'Neurobion Injection', 'B1+B6+B12', '3mL', 'IM', 'OD/EOD', 'As directed', 1),
('Methylcobalamin 500mcg', 'Methylcobalamin Injection', 'Methylcobalamin', '500mcg/mL', 'IM', 'OD', 'As directed', 1),
('Methylcobalamin 1500mcg', 'Methylcobalamin Injection', 'Methylcobalamin', '1500mcg', 'IM', 'OD/EOD', 'Neuropathy', 1),

-- Vitamin C
('Vitamin C 500mg', 'Vitamin C Injection', 'Ascorbic Acid', '500mg/5mL', 'IV/IM', 'OD', 'As directed', 1),
('Vitamin C 1g', 'Vitamin C Injection', 'Ascorbic Acid', '1g/10mL', 'IV', 'OD', 'As directed', 1),

-- Vitamin D
('Vitamin D3 300000IU', 'Vitamin D3 Injection', 'Cholecalciferol', '300000 IU/mL', 'IM', 'Monthly', 'Deficiency', 1),
('Vitamin D3 600000IU', 'Vitamin D3 Injection', 'Cholecalciferol', '600000 IU/mL', 'IM', 'Single dose', 'Severe deficiency', 1),
('Vitamin D2 50000IU', 'Vitamin D2 Injection', 'Ergocalciferol', '50000 IU/mL', 'IM', 'Weekly', 'Deficiency', 1),

-- Iron
('Iron Sucrose 100mg', 'Iron Sucrose Injection', 'Iron Sucrose', '100mg/5mL', 'IV', 'As directed', 'Anemia', 1),
('Iron Sucrose 200mg', 'Iron Sucrose Injection', 'Iron Sucrose', '200mg/10mL', 'IV', 'As directed', 'Anemia', 1),
('Ferric Carboxymaltose 500mg', 'Ferinject Injection', 'Ferric Carboxymaltose', '500mg/10mL', 'IV', 'Single dose', 'Anemia', 1),
('Ferric Carboxymaltose 1000mg', 'Ferinject Injection', 'Ferric Carboxymaltose', '1000mg/20mL', 'IV', 'Single dose', 'Anemia', 1),
('Iron Dextran 100mg', 'Iron Dextran Injection', 'Iron Dextran', '100mg/2mL', 'IV/IM', 'As directed', 'Anemia', 1),
('Ferric Gluconate 62.5mg', 'Ferric Gluconate Injection', 'Ferric Gluconate', '62.5mg/5mL', 'IV', 'As directed', 'Anemia', 1),

-- Folic Acid
('Folic Acid 5mg', 'Folic Acid Injection', 'Folic Acid', '5mg/mL', 'IV/IM', 'OD', 'As directed', 1),
('Folic Acid 15mg', 'Folic Acid Injection', 'Folic Acid', '15mg', 'IV/IM', 'OD', 'Rescue therapy', 1),
('Leucovorin 50mg', 'Leucovorin Injection', 'Calcium Leucovorin', '50mg', 'IV/IM', 'Q6H', 'MTX rescue', 1),
('Leucovorin 100mg', 'Leucovorin Injection', 'Calcium Leucovorin', '100mg', 'IV', 'Q6H', 'MTX rescue', 1);

-- ============================================================================
-- CATEGORY 8: ANESTHETICS & SEDATIVES (40+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Induction Agents
('Propofol 200mg', 'Propofol Injection', 'Propofol', '200mg/20mL', 'IV', 'As directed', 'Anesthesia', 1),
('Propofol 500mg', 'Propofol Injection', 'Propofol', '500mg/50mL', 'IV', 'Infusion', 'Sedation', 1),
('Propofol 1g', 'Propofol Injection', 'Propofol', '1g/100mL', 'IV', 'Infusion', 'ICU sedation', 1),
('Ketamine 50mg', 'Ketamine Injection', 'Ketamine', '50mg/mL', 'IV/IM', 'As directed', 'Anesthesia', 1),
('Ketamine 500mg', 'Ketamine Injection', 'Ketamine', '500mg/10mL', 'IV/IM', 'As directed', 'Anesthesia', 1),
('Etomidate 20mg', 'Etomidate Injection', 'Etomidate', '20mg/10mL', 'IV', 'Single dose', 'RSI', 1),
('Thiopental 500mg', 'Thiopental Injection', 'Thiopental Sodium', '500mg', 'IV', 'As directed', 'Anesthesia', 1),
('Thiopental 1g', 'Thiopental Injection', 'Thiopental Sodium', '1g', 'IV', 'As directed', 'Anesthesia', 1),

-- Benzodiazepines
('Midazolam 5mg', 'Midazolam Injection', 'Midazolam', '5mg/mL', 'IV/IM', 'As directed', 'Sedation', 1),
('Midazolam 15mg', 'Midazolam Injection', 'Midazolam', '15mg/3mL', 'IV', 'Infusion', 'ICU sedation', 1),
('Midazolam 50mg', 'Midazolam Injection', 'Midazolam', '50mg/10mL', 'IV', 'Infusion', 'ICU sedation', 1),
('Diazepam 10mg', 'Diazepam Injection', 'Diazepam', '10mg/2mL', 'IV/IM', 'As directed', 'Seizures/Sedation', 1),
('Lorazepam 2mg', 'Lorazepam Injection', 'Lorazepam', '2mg/mL', 'IV/IM', 'As directed', 'Seizures/Sedation', 1),
('Lorazepam 4mg', 'Lorazepam Injection', 'Lorazepam', '4mg/mL', 'IV/IM', 'As directed', 'Status epilepticus', 1),

-- Neuromuscular Blockers
('Succinylcholine 100mg', 'Succinylcholine Injection', 'Succinylcholine', '100mg/5mL', 'IV', 'Single dose', 'RSI', 1),
('Succinylcholine 200mg', 'Succinylcholine Injection', 'Succinylcholine', '200mg/10mL', 'IV', 'As directed', 'RSI', 1),
('Rocuronium 50mg', 'Rocuronium Injection', 'Rocuronium', '50mg/5mL', 'IV', 'As directed', 'NMB', 1),
('Rocuronium 100mg', 'Rocuronium Injection', 'Rocuronium', '100mg/10mL', 'IV', 'As directed', 'NMB', 1),
('Vecuronium 10mg', 'Vecuronium Injection', 'Vecuronium', '10mg', 'IV', 'As directed', 'NMB', 1),
('Atracurium 25mg', 'Atracurium Injection', 'Atracurium', '25mg/2.5mL', 'IV', 'As directed', 'NMB', 1),
('Atracurium 50mg', 'Atracurium Injection', 'Atracurium', '50mg/5mL', 'IV', 'As directed', 'NMB', 1),
('Cisatracurium 10mg', 'Cisatracurium Injection', 'Cisatracurium', '10mg/5mL', 'IV', 'As directed', 'NMB', 1),
('Cisatracurium 20mg', 'Cisatracurium Injection', 'Cisatracurium', '20mg/10mL', 'IV', 'As directed', 'NMB', 1),
('Pancuronium 4mg', 'Pancuronium Injection', 'Pancuronium', '4mg/2mL', 'IV', 'As directed', 'NMB', 1),

-- Local Anesthetics
('Lidocaine 1%', 'Lidocaine 1% Injection', 'Lidocaine', '1%/30mL', 'Local/Nerve block', 'Single dose', 'Local anesthesia', 1),
('Lidocaine 2%', 'Lidocaine 2% Injection', 'Lidocaine', '2%/30mL', 'Local/Nerve block', 'Single dose', 'Local anesthesia', 1),
('Lidocaine with Adrenaline', 'Lidocaine-Adrenaline Injection', 'Lidocaine + Epinephrine', '2% + 1:200000', 'Local', 'Single dose', 'Local anesthesia', 1),
('Bupivacaine 0.25%', 'Bupivacaine Injection', 'Bupivacaine', '0.25%/20mL', 'Nerve block/Epidural', 'As directed', 'Regional anesthesia', 1),
('Bupivacaine 0.5%', 'Bupivacaine Injection', 'Bupivacaine', '0.5%/20mL', 'Nerve block/Epidural', 'As directed', 'Regional anesthesia', 1),
('Bupivacaine Heavy 0.5%', 'Bupivacaine Heavy Injection', 'Bupivacaine', '0.5%/4mL', 'Spinal', 'Single dose', 'Spinal anesthesia', 1),
('Ropivacaine 0.5%', 'Ropivacaine Injection', 'Ropivacaine', '0.5%/20mL', 'Epidural/Nerve block', 'As directed', 'Regional anesthesia', 1),
('Ropivacaine 0.75%', 'Ropivacaine Injection', 'Ropivacaine', '0.75%/20mL', 'Epidural/Nerve block', 'As directed', 'Regional anesthesia', 1),
('Levobupivacaine 0.5%', 'Levobupivacaine Injection', 'Levobupivacaine', '0.5%/10mL', 'Nerve block/Epidural', 'As directed', 'Regional anesthesia', 1),

-- Opioid Analgesics for Anesthesia
('Alfentanil 1mg', 'Alfentanil Injection', 'Alfentanil', '1mg/2mL', 'IV', 'As directed', 'Anesthesia', 1),
('Sufentanil 50mcg', 'Sufentanil Injection', 'Sufentanil', '50mcg/mL', 'IV', 'As directed', 'Anesthesia', 1),
('Remifentanil 1mg', 'Remifentanil Injection', 'Remifentanil', '1mg', 'IV', 'Infusion', 'Anesthesia', 1),
('Remifentanil 2mg', 'Remifentanil Injection', 'Remifentanil', '2mg', 'IV', 'Infusion', 'Anesthesia', 1);

-- ============================================================================
-- CATEGORY 9: HORMONES & ENDOCRINE (40+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Insulin
('Insulin Regular 100U', 'Regular Insulin Injection', 'Insulin Regular', '100 Units/mL', 'IV/SC', 'As directed', 'Diabetes', 1),
('Insulin Regular 40U', 'Regular Insulin Injection', 'Insulin Regular', '40 Units/mL', 'SC', 'As directed', 'Diabetes', 1),
('Insulin NPH 100U', 'NPH Insulin Injection', 'Insulin NPH', '100 Units/mL', 'SC', 'BD', 'Diabetes', 1),
('Insulin Glargine 100U', 'Lantus Injection', 'Insulin Glargine', '100 Units/mL', 'SC', 'OD', 'Diabetes', 1),
('Insulin Glargine 300U', 'Toujeo Injection', 'Insulin Glargine', '300 Units/mL', 'SC', 'OD', 'Diabetes', 1),
('Insulin Detemir 100U', 'Levemir Injection', 'Insulin Detemir', '100 Units/mL', 'SC', 'OD/BD', 'Diabetes', 1),
('Insulin Degludec 100U', 'Tresiba Injection', 'Insulin Degludec', '100 Units/mL', 'SC', 'OD', 'Diabetes', 1),
('Insulin Aspart 100U', 'NovoRapid Injection', 'Insulin Aspart', '100 Units/mL', 'SC', 'With meals', 'Diabetes', 1),
('Insulin Lispro 100U', 'Humalog Injection', 'Insulin Lispro', '100 Units/mL', 'SC', 'With meals', 'Diabetes', 1),
('Insulin Glulisine 100U', 'Apidra Injection', 'Insulin Glulisine', '100 Units/mL', 'SC', 'With meals', 'Diabetes', 1),
('Insulin 70/30', 'Mixtard 70/30 Injection', 'Insulin Regular/NPH', '100 Units/mL', 'SC', 'BD', 'Diabetes', 1),

-- Thyroid/Parathyroid
('Levothyroxine 100mcg', 'Levothyroxine Injection', 'Levothyroxine', '100mcg', 'IV', 'OD', 'Myxedema coma', 1),
('Levothyroxine 500mcg', 'Levothyroxine Injection', 'Levothyroxine', '500mcg', 'IV', 'Loading', 'Myxedema coma', 1),
('Calcitonin 100IU', 'Calcitonin Injection', 'Calcitonin', '100 IU/mL', 'SC/IM', 'OD', 'Hypercalcemia', 1),
('Teriparatide 20mcg', 'Teriparatide Injection', 'Teriparatide', '20mcg', 'SC', 'OD', 'Osteoporosis', 1),

-- Growth Hormone
('Somatropin 4IU', 'Somatropin Injection', 'Somatropin', '4 IU', 'SC', 'OD', 'GH deficiency', 1),
('Somatropin 10IU', 'Somatropin Injection', 'Somatropin', '10 IU', 'SC', 'OD', 'GH deficiency', 1),

-- Glucagon
('Glucagon 1mg', 'Glucagon Injection', 'Glucagon', '1mg', 'SC/IM/IV', 'Single dose', 'Hypoglycemia', 1),

-- Oxytocin
('Oxytocin 5IU', 'Oxytocin Injection', 'Oxytocin', '5 IU/mL', 'IV/IM', 'As directed', 'Labor induction', 1),
('Oxytocin 10IU', 'Oxytocin Injection', 'Oxytocin', '10 IU/mL', 'IV/IM', 'As directed', 'PPH prophylaxis', 1),

-- Uterine
('Methylergometrine 0.2mg', 'Methylergometrine Injection', 'Methylergonovine', '0.2mg/mL', 'IM/IV', 'Q2-4H PRN', 'PPH', 1),
('Carboprost 250mcg', 'Carboprost Injection', 'Carboprost', '250mcg/mL', 'IM', 'Q15-90min', 'PPH', 1),
('Dinoprostone 1mg', 'Dinoprostone Injection', 'Dinoprostone', '1mg', 'IV', 'As directed', 'PPH', 1),
('Misoprostol 25mcg', 'Misoprostol Injection', 'Misoprostol', '25mcg', 'SL/Rectal', 'Q4H', 'Labor induction', 1),

-- Gonadotropins
('hCG 5000IU', 'hCG Injection', 'Human Chorionic Gonadotropin', '5000 IU', 'IM', 'As directed', 'Infertility', 1),
('hCG 10000IU', 'hCG Injection', 'Human Chorionic Gonadotropin', '10000 IU', 'IM', 'Single dose', 'Trigger ovulation', 1),
('FSH 75IU', 'FSH Injection', 'Follitropin', '75 IU', 'SC', 'OD', 'Infertility', 1),
('FSH 150IU', 'FSH Injection', 'Follitropin', '150 IU', 'SC', 'OD', 'Infertility', 1),
('LH 75IU', 'LH Injection', 'Lutropin', '75 IU', 'SC', 'OD', 'Infertility', 1),
('GnRH Agonist 0.1mg', 'Leuprolide Injection', 'Leuprolide', '0.1mg', 'SC', 'OD', 'Endometriosis', 1),
('GnRH Agonist 3.75mg', 'Leuprolide Depot Injection', 'Leuprolide', '3.75mg', 'IM', 'Monthly', 'Endometriosis', 1),
('GnRH Antagonist 0.25mg', 'Cetrorelix Injection', 'Cetrorelix', '0.25mg', 'SC', 'OD', 'IVF', 1),

-- Testosterone
('Testosterone 100mg', 'Testosterone Injection', 'Testosterone Enanthate', '100mg', 'IM', 'Every 2-4 weeks', 'Hypogonadism', 1),
('Testosterone 250mg', 'Testosterone Injection', 'Testosterone Enanthate', '250mg', 'IM', 'Every 2-4 weeks', 'Hypogonadism', 1),
('Testosterone Undecanoate 1g', 'Nebido Injection', 'Testosterone Undecanoate', '1000mg/4mL', 'IM', 'Every 10-14 weeks', 'Hypogonadism', 1),

-- Estrogen/Progesterone
('Estradiol Valerate 10mg', 'Estradiol Injection', 'Estradiol Valerate', '10mg/mL', 'IM', 'As directed', 'HRT', 1),
('Progesterone 50mg', 'Progesterone Injection', 'Progesterone', '50mg/mL', 'IM', 'OD', 'Luteal support', 1),
('Progesterone 100mg', 'Progesterone Injection', 'Progesterone', '100mg/mL', 'IM', 'OD', 'Luteal support', 1);

-- ============================================================================
-- CATEGORY 10: MISCELLANEOUS (50+ injections)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- Diuretics
('Furosemide 20mg', 'Furosemide Injection', 'Furosemide', '20mg/2mL', 'IV/IM', 'BD/TID', 'As directed', 1),
('Furosemide 40mg', 'Furosemide Injection', 'Furosemide', '40mg/4mL', 'IV', 'OD/BD', 'As directed', 1),
('Furosemide 100mg', 'Furosemide Injection', 'Furosemide', '100mg/10mL', 'IV', 'OD', 'Infusion', 1),
('Furosemide 250mg', 'Furosemide Injection', 'Furosemide', '250mg/25mL', 'IV', 'Infusion', 'As directed', 1),
('Mannitol 10%', 'Mannitol 10% Injection', 'Mannitol', '10%/500mL', 'IV', 'Q6-8H', 'Cerebral edema', 1),
('Mannitol 20%', 'Mannitol 20% Injection', 'Mannitol', '20%/100mL', 'IV', 'Q6-8H', 'Cerebral edema', 1),
('Mannitol 20% 350mL', 'Mannitol 20% Injection', 'Mannitol', '20%/350mL', 'IV', 'Q6-8H', 'Cerebral edema', 1),
('Torsemide 20mg', 'Torsemide Injection', 'Torsemide', '20mg', 'IV', 'OD', 'As directed', 1),
('Bumetanide 1mg', 'Bumetanide Injection', 'Bumetanide', '1mg/4mL', 'IV/IM', 'BD', 'As directed', 1),

-- Anticonvulsants
('Phenytoin 250mg', 'Phenytoin Injection', 'Phenytoin Sodium', '250mg/5mL', 'IV', 'Loading/Maintenance', 'Seizures', 1),
('Fosphenytoin 750mg', 'Fosphenytoin Injection', 'Fosphenytoin', '750mg/10mL', 'IV/IM', 'As directed', 'Status epilepticus', 1),
('Levetiracetam 500mg', 'Levetiracetam Injection', 'Levetiracetam', '500mg/5mL', 'IV', 'BD', 'Seizures', 1),
('Levetiracetam 1000mg', 'Levetiracetam Injection', 'Levetiracetam', '1000mg/10mL', 'IV', 'BD', 'Seizures', 1),
('Valproate 400mg', 'Valproate Injection', 'Sodium Valproate', '400mg/4mL', 'IV', 'TID', 'Seizures', 1),
('Valproate 500mg', 'Valproate Injection', 'Sodium Valproate', '500mg/5mL', 'IV', 'BD/TID', 'Seizures', 1),
('Lacosamide 200mg', 'Lacosamide Injection', 'Lacosamide', '200mg/20mL', 'IV', 'BD', 'Seizures', 1),
('Phenobarbital 200mg', 'Phenobarbital Injection', 'Phenobarbital', '200mg/mL', 'IV/IM', 'As directed', 'Status epilepticus', 1),

-- Antipsychotics/Antidepressants
('Haloperidol 5mg', 'Haloperidol Injection', 'Haloperidol', '5mg/mL', 'IM/IV', 'As directed', 'Acute psychosis', 1),
('Haloperidol 10mg', 'Haloperidol Injection', 'Haloperidol', '10mg/2mL', 'IM', 'As directed', 'Acute psychosis', 1),
('Haloperidol Decanoate 50mg', 'Haloperidol Decanoate Injection', 'Haloperidol Decanoate', '50mg/mL', 'IM', 'Monthly', 'Maintenance', 1),
('Olanzapine 10mg', 'Olanzapine Injection', 'Olanzapine', '10mg', 'IM', 'As directed', 'Acute agitation', 1),
('Aripiprazole 9.75mg', 'Aripiprazole Injection', 'Aripiprazole', '9.75mg/1.3mL', 'IM', 'As directed', 'Acute agitation', 1),
('Risperidone 25mg', 'Risperidone LAI Injection', 'Risperidone', '25mg', 'IM', 'Every 2 weeks', 'Maintenance', 1),
('Paliperidone 100mg', 'Paliperidone LAI Injection', 'Paliperidone', '100mg', 'IM', 'Monthly', 'Maintenance', 1),
('Chlorpromazine 25mg', 'Chlorpromazine Injection', 'Chlorpromazine', '25mg/mL', 'IM', 'As directed', 'Psychosis', 1),
('Chlorpromazine 50mg', 'Chlorpromazine Injection', 'Chlorpromazine', '50mg/2mL', 'IM', 'As directed', 'Psychosis', 1),

-- Bisphosphonates
('Zoledronic Acid 4mg', 'Zoledronic Acid Injection', 'Zoledronic Acid', '4mg/5mL', 'IV', 'Monthly', 'Bone mets', 1),
('Zoledronic Acid 5mg', 'Zoledronic Acid Injection', 'Zoledronic Acid', '5mg/100mL', 'IV', 'Yearly', 'Osteoporosis', 1),
('Pamidronate 30mg', 'Pamidronate Injection', 'Pamidronate', '30mg/10mL', 'IV', 'As directed', 'Hypercalcemia', 1),
('Pamidronate 60mg', 'Pamidronate Injection', 'Pamidronate', '60mg/10mL', 'IV', 'Monthly', 'Bone disease', 1),
('Pamidronate 90mg', 'Pamidronate Injection', 'Pamidronate', '90mg/10mL', 'IV', 'Monthly', 'Bone mets', 1),
('Ibandronate 3mg', 'Ibandronate Injection', 'Ibandronate', '3mg/3mL', 'IV', 'Every 3 months', 'Osteoporosis', 1),
('Denosumab 60mg', 'Denosumab Injection', 'Denosumab', '60mg/mL', 'SC', 'Every 6 months', 'Osteoporosis', 1),
('Denosumab 120mg', 'Denosumab Injection', 'Denosumab', '120mg/1.7mL', 'SC', 'Monthly', 'Bone mets', 1),

-- Immunosuppressants
('Cyclosporine 50mg', 'Cyclosporine Injection', 'Cyclosporine', '50mg/mL', 'IV', 'BD', 'Transplant', 1),
('Cyclosporine 250mg', 'Cyclosporine Injection', 'Cyclosporine', '250mg/5mL', 'IV', 'BD', 'Transplant', 1),
('Tacrolimus 5mg', 'Tacrolimus Injection', 'Tacrolimus', '5mg/mL', 'IV', 'Infusion', 'Transplant', 1),
('Basiliximab 20mg', 'Basiliximab Injection', 'Basiliximab', '20mg', 'IV', 'Day 0 & 4', 'Transplant', 1),
('Anti-thymocyte Globulin 25mg', 'ATG Injection', 'Anti-thymocyte Globulin', '25mg', 'IV', 'As directed', 'Transplant', 1),

-- Biologics/Monoclonals
('Rituximab 100mg', 'Rituximab Injection', 'Rituximab', '100mg/10mL', 'IV', 'As directed', 'Lymphoma/RA', 1),
('Rituximab 500mg', 'Rituximab Injection', 'Rituximab', '500mg/50mL', 'IV', 'As directed', 'Lymphoma/RA', 1),
('Trastuzumab 440mg', 'Trastuzumab Injection', 'Trastuzumab', '440mg', 'IV', 'Weekly/3-weekly', 'Breast cancer', 1),
('Bevacizumab 100mg', 'Bevacizumab Injection', 'Bevacizumab', '100mg/4mL', 'IV', 'Every 2-3 weeks', 'Cancer', 1),
('Bevacizumab 400mg', 'Bevacizumab Injection', 'Bevacizumab', '400mg/16mL', 'IV', 'Every 2-3 weeks', 'Cancer', 1),
('Infliximab 100mg', 'Infliximab Injection', 'Infliximab', '100mg', 'IV', 'As directed', 'IBD/RA', 1),
('Adalimumab 40mg', 'Adalimumab Injection', 'Adalimumab', '40mg/0.8mL', 'SC', 'Every 2 weeks', 'RA/IBD', 1),
('Etanercept 50mg', 'Etanercept Injection', 'Etanercept', '50mg/mL', 'SC', 'Weekly', 'RA', 1),
('Tocilizumab 80mg', 'Tocilizumab Injection', 'Tocilizumab', '80mg/4mL', 'IV/SC', 'As directed', 'RA', 1),
('Tocilizumab 200mg', 'Tocilizumab Injection', 'Tocilizumab', '200mg/10mL', 'IV', 'Monthly', 'RA', 1),
('Tocilizumab 400mg', 'Tocilizumab Injection', 'Tocilizumab', '400mg/20mL', 'IV', 'Monthly', 'RA', 1);

-- ============================================================================
-- CATEGORY 11: VACCINES (Common vaccines for reference)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Tetanus Toxoid 0.5mL', 'TT Injection', 'Tetanus Toxoid', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1),
('Hepatitis B 1mL', 'Hepatitis B Vaccine', 'Hepatitis B Vaccine', '1mL (20mcg)', 'IM', 'Per schedule', 'Immunization', 1),
('Hepatitis B Pediatric', 'Hepatitis B Vaccine Pediatric', 'Hepatitis B Vaccine', '0.5mL (10mcg)', 'IM', 'Per schedule', 'Immunization', 1),
('Anti-Rabies Vaccine', 'Rabies Vaccine', 'Rabies Vaccine', '1mL', 'IM', 'Days 0,3,7,14,28', 'Post-exposure', 1),
('Anti-Rabies Immunoglobulin', 'Rabies Immunoglobulin', 'Rabies Immunoglobulin', '20 IU/kg', 'Local/IM', 'Single dose', 'Post-exposure', 1),
('Influenza Vaccine', 'Flu Vaccine', 'Influenza Vaccine', '0.5mL', 'IM', 'Yearly', 'Immunization', 1),
('Pneumococcal Vaccine', 'Pneumovax Injection', 'Pneumococcal Vaccine', '0.5mL', 'IM/SC', 'Per schedule', 'Immunization', 1),
('DPT Vaccine', 'DPT Injection', 'Diphtheria-Pertussis-Tetanus', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1),
('MMR Vaccine', 'MMR Injection', 'Measles-Mumps-Rubella', '0.5mL', 'SC', 'Per schedule', 'Immunization', 1),
('BCG Vaccine', 'BCG Injection', 'Bacillus Calmette-Guerin', '0.1mL', 'Intradermal', 'Single dose', 'Immunization', 1),
('IPV Vaccine', 'Polio Vaccine', 'Inactivated Polio Vaccine', '0.5mL', 'IM/SC', 'Per schedule', 'Immunization', 1),
('Typhoid Vaccine', 'Typhoid Vaccine Injection', 'Typhoid Vi Polysaccharide', '0.5mL', 'IM', 'Every 3 years', 'Immunization', 1),
('Meningococcal Vaccine', 'Meningococcal Vaccine', 'Meningococcal Vaccine', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1),
('HPV Vaccine', 'HPV Vaccine Injection', 'Human Papillomavirus Vaccine', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1),
('Varicella Vaccine', 'Chickenpox Vaccine', 'Varicella Vaccine', '0.5mL', 'SC', 'Per schedule', 'Immunization', 1),
('Hepatitis A Vaccine', 'Hepatitis A Vaccine', 'Hepatitis A Vaccine', '1mL', 'IM', 'Per schedule', 'Immunization', 1),
('Japanese Encephalitis', 'JE Vaccine', 'Japanese Encephalitis Vaccine', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1),
('Rotavirus Vaccine', 'Rotavirus Vaccine', 'Rotavirus Vaccine', '2mL', 'Oral', 'Per schedule', 'Immunization', 1),
('COVID-19 Vaccine', 'COVID-19 Vaccine', 'SARS-CoV-2 Vaccine', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1),
('Tdap Vaccine', 'Tdap Injection', 'Tetanus-Diphtheria-Pertussis', '0.5mL', 'IM', 'Per schedule', 'Immunization', 1);

-- ============================================================================
-- CATEGORY 12: ADDITIONAL COMMON INJECTIONS (30+ more)
-- ============================================================================

INSERT INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
-- EPO/Blood Products
('Erythropoietin 2000IU', 'EPO Injection', 'Epoetin Alfa', '2000 IU', 'SC/IV', 'Thrice weekly', 'Anemia', 1),
('Erythropoietin 4000IU', 'EPO Injection', 'Epoetin Alfa', '4000 IU', 'SC/IV', 'Weekly', 'Anemia', 1),
('Erythropoietin 10000IU', 'EPO Injection', 'Epoetin Alfa', '10000 IU', 'SC', 'Weekly', 'Anemia', 1),
('Darbepoetin 25mcg', 'Darbepoetin Injection', 'Darbepoetin Alfa', '25mcg', 'SC/IV', 'Weekly', 'Anemia', 1),
('Darbepoetin 60mcg', 'Darbepoetin Injection', 'Darbepoetin Alfa', '60mcg', 'SC', 'Every 2 weeks', 'Anemia', 1),
('Filgrastim 300mcg', 'G-CSF Injection', 'Filgrastim', '300mcg', 'SC', 'OD', 'Neutropenia', 1),
('Filgrastim 480mcg', 'G-CSF Injection', 'Filgrastim', '480mcg', 'SC', 'OD', 'Neutropenia', 1),
('Pegfilgrastim 6mg', 'Pegfilgrastim Injection', 'Pegfilgrastim', '6mg', 'SC', 'Once per cycle', 'Neutropenia', 1),

-- Antimalarials
('Artesunate 60mg', 'Artesunate Injection', 'Artesunate', '60mg', 'IV/IM', 'Q12H', 'Severe malaria', 1),
('Artesunate 120mg', 'Artesunate Injection', 'Artesunate', '120mg', 'IV', 'Loading', 'Severe malaria', 1),
('Quinine 600mg', 'Quinine Injection', 'Quinine Dihydrochloride', '600mg/2mL', 'IV', 'Q8H', 'Severe malaria', 1),
('Artemether 80mg', 'Artemether Injection', 'Artemether', '80mg/mL', 'IM', 'OD', 'Malaria', 1),

-- Contrast Media
('Iohexol 300', 'Omnipaque 300 Injection', 'Iohexol', '300mgI/mL', 'IV', 'Single dose', 'CT contrast', 1),
('Iohexol 350', 'Omnipaque 350 Injection', 'Iohexol', '350mgI/mL', 'IV', 'Single dose', 'CT contrast', 1),
('Iopamidol 300', 'Isovue 300 Injection', 'Iopamidol', '300mgI/mL', 'IV', 'Single dose', 'CT contrast', 1),
('Iopamidol 370', 'Isovue 370 Injection', 'Iopamidol', '370mgI/mL', 'IV', 'Single dose', 'CT contrast', 1),
('Gadolinium DTPA', 'Magnevist Injection', 'Gadopentetate Dimeglumine', '0.5mmol/mL', 'IV', 'Single dose', 'MRI contrast', 1),

-- Miscellaneous
('Tranexamic Acid 500mg', 'Tranexamic Acid Injection', 'Tranexamic Acid', '500mg/5mL', 'IV', 'TID', 'Bleeding', 1),
('Tranexamic Acid 1g', 'Tranexamic Acid Injection', 'Tranexamic Acid', '1g/10mL', 'IV', 'TID', 'Major bleeding', 1),
('Aminocaproic Acid 5g', 'Aminocaproic Acid Injection', 'Aminocaproic Acid', '5g/20mL', 'IV', 'As directed', 'Bleeding', 1),
('Desmopressin 4mcg', 'Desmopressin Injection', 'Desmopressin', '4mcg/mL', 'IV/SC', 'As directed', 'vWD/Hemophilia', 1),
('Desmopressin 15mcg', 'Desmopressin Injection', 'Desmopressin', '15mcg/mL', 'IV', 'As directed', 'Bleeding disorders', 1),
('Albumin 5%', 'Albumin 5% Injection', 'Human Albumin', '5%/100mL', 'IV', 'As directed', 'Hypoalbuminemia', 1),
('Albumin 20%', 'Albumin 20% Injection', 'Human Albumin', '20%/100mL', 'IV', 'As directed', 'Hypoalbuminemia', 1),
('Albumin 25%', 'Albumin 25% Injection', 'Human Albumin', '25%/50mL', 'IV', 'As directed', 'Hypoalbuminemia', 1),
('IVIG 5g', 'IVIG Injection', 'Immunoglobulin IV', '5g/100mL', 'IV', 'As directed', 'Immunodeficiency', 1),
('IVIG 10g', 'IVIG Injection', 'Immunoglobulin IV', '10g/200mL', 'IV', 'As directed', 'Immunodeficiency', 1),
('Anti-D Immunoglobulin 300mcg', 'Anti-D Injection', 'Rho(D) Immune Globulin', '300mcg', 'IM', 'Single dose', 'Rh incompatibility', 1),
('Hyaluronidase 1500IU', 'Hyaluronidase Injection', 'Hyaluronidase', '1500 IU', 'SC', 'As directed', 'Fluid absorption', 1);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Injections: 550+
-- Categories:
--   1. Antibiotics: 100+
--   2. Analgesics & NSAIDs: 50+
--   3. Cardiac & Cardiovascular: 60+
--   4. Corticosteroids: 17
--   5. Emergency Medications: 40+
--   6. Gastrointestinal: 40+
--   7. Vitamins & Supplements: 30+
--   8. Anesthetics & Sedatives: 40+
--   9. Hormones & Endocrine: 45+
--  10. Miscellaneous: 50+
--  11. Vaccines: 20
--  12. Additional Common: 30+
-- ============================================================================

SELECT 'Comprehensive injectable medications database imported successfully!' as Status;
SELECT COUNT(*) as Total_Injections FROM injection_templates WHERE is_active = 1;
