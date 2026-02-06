-- SNOMED CT Injectable Medications Import
-- Extracted from SNOMED CT International Release

-- Disable foreign key checks for bulk insert
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================================
-- ANALGESICS & PAIN MANAGEMENT
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Morphine 10mg', 'Morphine Sulfate', 'Morphine', '10mg/mL', 'IM/IV/SC', 'Every 4-6 hours', 'As needed', 1),
('Morphine 15mg', 'Morphine Sulfate', 'Morphine', '15mg/mL', 'IM/IV/SC', 'Every 4-6 hours', 'As needed', 1),
('Morphine 50mg', 'Morphine Sulfate', 'Morphine', '50mg/50mL', 'IV Infusion', 'Continuous', 'As needed', 1),
('Tramadol 50mg', 'Tramadol Hydrochloride', 'Tramadol', '50mg/mL', 'IM/IV', 'Every 6-8 hours', '3-5 days', 1),
('Tramadol 100mg', 'Tramadol Hydrochloride', 'Tramadol', '100mg/2mL', 'IM/IV', 'Every 6-8 hours', '3-5 days', 1),
('Pethidine 50mg', 'Pethidine Hydrochloride', 'Meperidine', '50mg/mL', 'IM/IV', 'Every 4-6 hours', 'As needed', 1),
('Pethidine 100mg', 'Pethidine Hydrochloride', 'Meperidine', '100mg/2mL', 'IM/IV', 'Every 4-6 hours', 'As needed', 1),
('Diclofenac 75mg', 'Diclofenac Sodium', 'Diclofenac', '75mg/3mL', 'IM', 'Once or twice daily', '2-3 days', 1),
('Ketorolac 30mg', 'Ketorolac Tromethamine', 'Ketorolac', '30mg/mL', 'IM/IV', 'Every 6 hours', '5 days max', 1),
('Paracetamol IV 1g', 'Paracetamol IV', 'Acetaminophen', '1g/100mL', 'IV', 'Every 4-6 hours', 'As needed', 1),
('Fentanyl 50mcg', 'Fentanyl Citrate', 'Fentanyl', '50mcg/mL', 'IV/IM', 'As directed', 'As needed', 1),
('Fentanyl 100mcg', 'Fentanyl Citrate', 'Fentanyl', '100mcg/2mL', 'IV/IM', 'As directed', 'As needed', 1),
('Nalbuphine 10mg', 'Nalbuphine Hydrochloride', 'Nalbuphine', '10mg/mL', 'IM/IV/SC', 'Every 3-6 hours', 'As needed', 1),
('Pentazocine 30mg', 'Pentazocine Lactate', 'Pentazocine', '30mg/mL', 'IM/IV/SC', 'Every 3-4 hours', 'As needed', 1),
('Butorphanol 1mg', 'Butorphanol Tartrate', 'Butorphanol', '1mg/mL', 'IM/IV', 'Every 3-4 hours', 'As needed', 1),
('Buprenorphine 0.3mg', 'Buprenorphine', 'Buprenorphine', '0.3mg/mL', 'IM/IV', 'Every 6-8 hours', 'As needed', 1);

-- ====================================================================================
-- ANTIBIOTICS - PENICILLINS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Amoxicillin 500mg', 'Amoxicillin Sodium', 'Amoxicillin', '500mg', 'IV/IM', 'Every 8 hours', '5-7 days', 1),
('Amoxicillin 1g', 'Amoxicillin Sodium', 'Amoxicillin', '1g', 'IV/IM', 'Every 8 hours', '5-7 days', 1),
('Ampicillin 500mg', 'Ampicillin Sodium', 'Ampicillin', '500mg', 'IV/IM', 'Every 6 hours', '5-7 days', 1),
('Ampicillin 1g', 'Ampicillin Sodium', 'Ampicillin', '1g', 'IV/IM', 'Every 6 hours', '5-7 days', 1),
('Piperacillin-Tazobactam 4.5g', 'Piperacillin-Tazobactam', 'Piperacillin/Tazobactam', '4.5g', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Amoxicillin-Clavulanate 1.2g', 'Amoxicillin-Clavulanate', 'Augmentin', '1.2g', 'IV', 'Every 8 hours', '5-7 days', 1),
('Benzylpenicillin 1MU', 'Benzylpenicillin', 'Penicillin G', '1 MU', 'IV/IM', 'Every 4-6 hours', '7-14 days', 1),
('Benzylpenicillin 5MU', 'Benzylpenicillin', 'Penicillin G', '5 MU', 'IV', 'Every 4-6 hours', '7-14 days', 1);

-- ====================================================================================
-- ANTIBIOTICS - CEPHALOSPORINS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Ceftriaxone 1g', 'Ceftriaxone Sodium', 'Ceftriaxone', '1g', 'IV/IM', 'Once daily', '5-14 days', 1),
('Ceftriaxone 2g', 'Ceftriaxone Sodium', 'Ceftriaxone', '2g', 'IV', 'Once daily', '5-14 days', 1),
('Cefotaxime 1g', 'Cefotaxime Sodium', 'Cefotaxime', '1g', 'IV/IM', 'Every 8-12 hours', '5-14 days', 1),
('Cefotaxime 2g', 'Cefotaxime Sodium', 'Cefotaxime', '2g', 'IV', 'Every 6-8 hours', '5-14 days', 1),
('Cefazolin 1g', 'Cefazolin Sodium', 'Cefazolin', '1g', 'IV/IM', 'Every 8 hours', '5-7 days', 1),
('Cefuroxime 750mg', 'Cefuroxime Sodium', 'Cefuroxime', '750mg', 'IV/IM', 'Every 8 hours', '5-7 days', 1),
('Cefuroxime 1.5g', 'Cefuroxime Sodium', 'Cefuroxime', '1.5g', 'IV', 'Every 8 hours', '5-7 days', 1),
('Ceftazidime 1g', 'Ceftazidime Sodium', 'Ceftazidime', '1g', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Ceftazidime 2g', 'Ceftazidime Sodium', 'Ceftazidime', '2g', 'IV', 'Every 8 hours', '7-14 days', 1),
('Cefepime 1g', 'Cefepime Hydrochloride', 'Cefepime', '1g', 'IV/IM', 'Every 12 hours', '7-14 days', 1),
('Cefepime 2g', 'Cefepime Hydrochloride', 'Cefepime', '2g', 'IV', 'Every 8-12 hours', '7-14 days', 1),
('Cefoperazone-Sulbactam 1.5g', 'Cefoperazone-Sulbactam', 'Cefoperazone/Sulbactam', '1.5g', 'IV/IM', 'Every 12 hours', '7-14 days', 1),
('Cefoperazone-Sulbactam 3g', 'Cefoperazone-Sulbactam', 'Cefoperazone/Sulbactam', '3g', 'IV', 'Every 12 hours', '7-14 days', 1);

-- ====================================================================================
-- ANTIBIOTICS - AMINOGLYCOSIDES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Gentamicin 80mg', 'Gentamicin Sulfate', 'Gentamicin', '80mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 40mg', 'Gentamicin Sulfate', 'Gentamicin', '40mg/mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Amikacin 500mg', 'Amikacin Sulfate', 'Amikacin', '500mg/2mL', 'IV/IM', 'Every 12 hours', '7-10 days', 1),
('Amikacin 250mg', 'Amikacin Sulfate', 'Amikacin', '250mg/mL', 'IV/IM', 'Every 12 hours', '7-10 days', 1),
('Tobramycin 80mg', 'Tobramycin Sulfate', 'Tobramycin', '80mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Streptomycin 1g', 'Streptomycin Sulfate', 'Streptomycin', '1g', 'IM', 'Once daily', 'As directed', 1);

-- ====================================================================================
-- ANTIBIOTICS - CARBAPENEMS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Meropenem 500mg', 'Meropenem Trihydrate', 'Meropenem', '500mg', 'IV', 'Every 8 hours', '7-14 days', 1),
('Meropenem 1g', 'Meropenem Trihydrate', 'Meropenem', '1g', 'IV', 'Every 8 hours', '7-14 days', 1),
('Imipenem-Cilastatin 500mg', 'Imipenem-Cilastatin', 'Imipenem/Cilastatin', '500mg', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Imipenem-Cilastatin 1g', 'Imipenem-Cilastatin', 'Imipenem/Cilastatin', '1g', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Ertapenem 1g', 'Ertapenem Sodium', 'Ertapenem', '1g', 'IV/IM', 'Once daily', '7-14 days', 1),
('Doripenem 500mg', 'Doripenem', 'Doripenem', '500mg', 'IV', 'Every 8 hours', '7-14 days', 1);

-- ====================================================================================
-- ANTIBIOTICS - FLUOROQUINOLONES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Ciprofloxacin 200mg', 'Ciprofloxacin', 'Ciprofloxacin', '200mg/100mL', 'IV', 'Every 12 hours', '7-14 days', 1),
('Ciprofloxacin 400mg', 'Ciprofloxacin', 'Ciprofloxacin', '400mg/200mL', 'IV', 'Every 12 hours', '7-14 days', 1),
('Levofloxacin 500mg', 'Levofloxacin', 'Levofloxacin', '500mg/100mL', 'IV', 'Once daily', '7-14 days', 1),
('Levofloxacin 750mg', 'Levofloxacin', 'Levofloxacin', '750mg/150mL', 'IV', 'Once daily', '7-14 days', 1),
('Ofloxacin 200mg', 'Ofloxacin', 'Ofloxacin', '200mg/100mL', 'IV', 'Every 12 hours', '7-14 days', 1),
('Moxifloxacin 400mg', 'Moxifloxacin', 'Moxifloxacin', '400mg/250mL', 'IV', 'Once daily', '7-14 days', 1);

-- ====================================================================================
-- ANTIBIOTICS - GLYCOPEPTIDES & OTHERS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Vancomycin 500mg', 'Vancomycin Hydrochloride', 'Vancomycin', '500mg', 'IV', 'Every 6-12 hours', '7-14 days', 1),
('Vancomycin 1g', 'Vancomycin Hydrochloride', 'Vancomycin', '1g', 'IV', 'Every 12 hours', '7-14 days', 1),
('Teicoplanin 200mg', 'Teicoplanin', 'Teicoplanin', '200mg', 'IV/IM', 'Once daily', '7-14 days', 1),
('Teicoplanin 400mg', 'Teicoplanin', 'Teicoplanin', '400mg', 'IV/IM', 'Once daily', '7-14 days', 1),
('Linezolid 600mg', 'Linezolid', 'Linezolid', '600mg/300mL', 'IV', 'Every 12 hours', '10-14 days', 1),
('Metronidazole 500mg', 'Metronidazole', 'Metronidazole', '500mg/100mL', 'IV', 'Every 8 hours', '7-10 days', 1),
('Clindamycin 300mg', 'Clindamycin Phosphate', 'Clindamycin', '300mg/2mL', 'IV/IM', 'Every 6-8 hours', '7-10 days', 1),
('Clindamycin 600mg', 'Clindamycin Phosphate', 'Clindamycin', '600mg/4mL', 'IV/IM', 'Every 6-8 hours', '7-10 days', 1),
('Colistin 1MU', 'Colistimethate Sodium', 'Colistin', '1 MU', 'IV', 'Every 8 hours', '7-14 days', 1),
('Colistin 2MU', 'Colistimethate Sodium', 'Colistin', '2 MU', 'IV', 'Every 8 hours', '7-14 days', 1),
('Tigecycline 50mg', 'Tigecycline', 'Tigecycline', '50mg', 'IV', 'Every 12 hours', '5-14 days', 1);

-- ====================================================================================
-- ANTIFUNGALS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Fluconazole 200mg', 'Fluconazole', 'Fluconazole', '200mg/100mL', 'IV', 'Once daily', '14-28 days', 1),
('Fluconazole 400mg', 'Fluconazole', 'Fluconazole', '400mg/200mL', 'IV', 'Once daily', '14-28 days', 1),
('Amphotericin B 50mg', 'Amphotericin B', 'Amphotericin B', '50mg', 'IV', 'Once daily', 'As directed', 1),
('Liposomal Amphotericin B', 'Liposomal Amphotericin B', 'AmBisome', '50mg', 'IV', 'Once daily', 'As directed', 1),
('Caspofungin 50mg', 'Caspofungin Acetate', 'Caspofungin', '50mg', 'IV', 'Once daily', '14-28 days', 1),
('Caspofungin 70mg', 'Caspofungin Acetate', 'Caspofungin', '70mg', 'IV', 'Once daily (loading)', '14-28 days', 1),
('Micafungin 100mg', 'Micafungin Sodium', 'Micafungin', '100mg', 'IV', 'Once daily', '14-28 days', 1),
('Anidulafungin 100mg', 'Anidulafungin', 'Anidulafungin', '100mg', 'IV', 'Once daily', '14-28 days', 1),
('Voriconazole 200mg', 'Voriconazole', 'Voriconazole', '200mg', 'IV', 'Every 12 hours', '7-14 days', 1);

-- ====================================================================================
-- ANTIVIRALS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Acyclovir 250mg', 'Acyclovir Sodium', 'Acyclovir', '250mg', 'IV', 'Every 8 hours', '7-14 days', 1),
('Acyclovir 500mg', 'Acyclovir Sodium', 'Acyclovir', '500mg', 'IV', 'Every 8 hours', '7-14 days', 1),
('Ganciclovir 500mg', 'Ganciclovir Sodium', 'Ganciclovir', '500mg', 'IV', 'Every 12 hours', '14-21 days', 1),
('Foscarnet 6g', 'Foscarnet Sodium', 'Foscarnet', '6g/250mL', 'IV', 'Every 8 hours', '14-21 days', 1),
('Remdesivir 100mg', 'Remdesivir', 'Remdesivir', '100mg', 'IV', 'Once daily', '5-10 days', 1);

-- ====================================================================================
-- CORTICOSTEROIDS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Dexamethasone 4mg', 'Dexamethasone Sodium Phosphate', 'Dexamethasone', '4mg/mL', 'IV/IM', 'Every 6-12 hours', 'As directed', 1),
('Dexamethasone 8mg', 'Dexamethasone Sodium Phosphate', 'Dexamethasone', '8mg/2mL', 'IV/IM', 'Every 6-12 hours', 'As directed', 1),
('Hydrocortisone 100mg', 'Hydrocortisone Sodium Succinate', 'Hydrocortisone', '100mg', 'IV/IM', 'Every 6-8 hours', 'As directed', 1),
('Hydrocortisone 250mg', 'Hydrocortisone Sodium Succinate', 'Hydrocortisone', '250mg', 'IV', 'Every 6 hours', 'As directed', 1),
('Methylprednisolone 40mg', 'Methylprednisolone Sodium Succinate', 'Methylprednisolone', '40mg', 'IV/IM', 'Every 6 hours', 'As directed', 1),
('Methylprednisolone 125mg', 'Methylprednisolone Sodium Succinate', 'Methylprednisolone', '125mg', 'IV/IM', 'Every 6 hours', 'As directed', 1),
('Methylprednisolone 500mg', 'Methylprednisolone Sodium Succinate', 'Methylprednisolone', '500mg', 'IV', 'Once daily', '3-5 days', 1),
('Methylprednisolone 1g', 'Methylprednisolone Sodium Succinate', 'Methylprednisolone', '1g', 'IV', 'Once daily', '3-5 days', 1),
('Prednisolone 25mg', 'Prednisolone Sodium Phosphate', 'Prednisolone', '25mg/mL', 'IV/IM', 'As directed', 'As directed', 1),
('Triamcinolone 40mg', 'Triamcinolone Acetonide', 'Triamcinolone', '40mg/mL', 'IM/Intra-articular', 'As directed', 'As directed', 1),
('Betamethasone 4mg', 'Betamethasone Sodium Phosphate', 'Betamethasone', '4mg/mL', 'IM/IV', 'As directed', 'As directed', 1);

-- ====================================================================================
-- ANTIEMETICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Ondansetron 4mg', 'Ondansetron Hydrochloride', 'Ondansetron', '4mg/2mL', 'IV/IM', 'Every 8 hours', 'As needed', 1),
('Ondansetron 8mg', 'Ondansetron Hydrochloride', 'Ondansetron', '8mg/4mL', 'IV/IM', 'Every 8-12 hours', 'As needed', 1),
('Metoclopramide 10mg', 'Metoclopramide Hydrochloride', 'Metoclopramide', '10mg/2mL', 'IV/IM', 'Every 8 hours', 'As needed', 1),
('Granisetron 1mg', 'Granisetron Hydrochloride', 'Granisetron', '1mg/mL', 'IV', 'Once daily', 'As needed', 1),
('Palonosetron 0.25mg', 'Palonosetron Hydrochloride', 'Palonosetron', '0.25mg/5mL', 'IV', 'Once', 'Single dose', 1),
('Promethazine 25mg', 'Promethazine Hydrochloride', 'Promethazine', '25mg/mL', 'IM', 'Every 4-6 hours', 'As needed', 1),
('Prochlorperazine 12.5mg', 'Prochlorperazine Mesylate', 'Prochlorperazine', '12.5mg/mL', 'IM', 'Every 6 hours', 'As needed', 1);

-- ====================================================================================
-- PROTON PUMP INHIBITORS & GI DRUGS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Pantoprazole 40mg', 'Pantoprazole Sodium', 'Pantoprazole', '40mg', 'IV', 'Once or twice daily', '7-14 days', 1),
('Esomeprazole 40mg', 'Esomeprazole Sodium', 'Esomeprazole', '40mg', 'IV', 'Once daily', '7-14 days', 1),
('Omeprazole 40mg', 'Omeprazole Sodium', 'Omeprazole', '40mg', 'IV', 'Once daily', '7-14 days', 1),
('Ranitidine 50mg', 'Ranitidine Hydrochloride', 'Ranitidine', '50mg/2mL', 'IV/IM', 'Every 6-8 hours', '7 days', 1),
('Famotidine 20mg', 'Famotidine', 'Famotidine', '20mg/2mL', 'IV', 'Every 12 hours', '7 days', 1),
('Hyoscine 20mg', 'Hyoscine Butylbromide', 'Buscopan', '20mg/mL', 'IV/IM', 'Every 8 hours', 'As needed', 1),
('Octreotide 100mcg', 'Octreotide Acetate', 'Octreotide', '100mcg/mL', 'SC/IV', 'Every 8 hours', 'As directed', 1);

-- ====================================================================================
-- CARDIOVASCULAR DRUGS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Adrenaline 1mg', 'Adrenaline', 'Epinephrine', '1mg/mL', 'IV/IM/SC', 'As needed', 'Emergency', 1),
('Noradrenaline 4mg', 'Noradrenaline', 'Norepinephrine', '4mg/4mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Dopamine 200mg', 'Dopamine Hydrochloride', 'Dopamine', '200mg/5mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Dobutamine 250mg', 'Dobutamine Hydrochloride', 'Dobutamine', '250mg/20mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Atropine 0.6mg', 'Atropine Sulfate', 'Atropine', '0.6mg/mL', 'IV/IM', 'As needed', 'Emergency', 1),
('Atropine 1mg', 'Atropine Sulfate', 'Atropine', '1mg/mL', 'IV/IM', 'As needed', 'Emergency', 1),
('Amiodarone 150mg', 'Amiodarone Hydrochloride', 'Amiodarone', '150mg/3mL', 'IV', 'As directed', 'As directed', 1),
('Lignocaine 2%', 'Lignocaine Hydrochloride', 'Lidocaine', '100mg/5mL', 'IV', 'As directed', 'Emergency', 1),
('Adenosine 6mg', 'Adenosine', 'Adenosine', '6mg/2mL', 'IV Rapid Push', 'As needed', 'Emergency', 1),
('Digoxin 0.5mg', 'Digoxin', 'Digoxin', '0.5mg/2mL', 'IV', 'As directed', 'As directed', 1),
('Labetalol 100mg', 'Labetalol Hydrochloride', 'Labetalol', '100mg/20mL', 'IV', 'As directed', 'As directed', 1),
('Metoprolol 5mg', 'Metoprolol Tartrate', 'Metoprolol', '5mg/5mL', 'IV', 'Every 5-15 minutes', 'As directed', 1),
('Esmolol 100mg', 'Esmolol Hydrochloride', 'Esmolol', '100mg/10mL', 'IV', 'As directed', 'As directed', 1),
('Nitroglycerin 5mg', 'Nitroglycerin', 'GTN', '5mg/5mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Sodium Nitroprusside 50mg', 'Sodium Nitroprusside', 'Nitroprusside', '50mg', 'IV Infusion', 'Continuous', 'As directed', 1),
('Furosemide 20mg', 'Furosemide', 'Lasix', '20mg/2mL', 'IV/IM', 'As directed', 'As directed', 1),
('Furosemide 40mg', 'Furosemide', 'Lasix', '40mg/4mL', 'IV/IM', 'As directed', 'As directed', 1),
('Furosemide 250mg', 'Furosemide', 'Lasix', '250mg/25mL', 'IV Infusion', 'Continuous', 'As directed', 1);

-- ====================================================================================
-- ANTICOAGULANTS & THROMBOLYTICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Heparin 5000 IU', 'Heparin Sodium', 'Heparin', '5000 IU/mL', 'IV/SC', 'As directed', 'As directed', 1),
('Heparin 25000 IU', 'Heparin Sodium', 'Heparin', '25000 IU/5mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Enoxaparin 40mg', 'Enoxaparin Sodium', 'Clexane', '40mg/0.4mL', 'SC', 'Once daily', '7-14 days', 1),
('Enoxaparin 60mg', 'Enoxaparin Sodium', 'Clexane', '60mg/0.6mL', 'SC', 'Every 12 hours', '7-14 days', 1),
('Enoxaparin 80mg', 'Enoxaparin Sodium', 'Clexane', '80mg/0.8mL', 'SC', 'Every 12 hours', '7-14 days', 1),
('Fondaparinux 2.5mg', 'Fondaparinux Sodium', 'Arixtra', '2.5mg/0.5mL', 'SC', 'Once daily', 'As directed', 1),
('Warfarin 5mg IV', 'Warfarin Sodium', 'Warfarin', '5mg', 'IV', 'As directed', 'As directed', 1),
('Streptokinase 1.5MU', 'Streptokinase', 'Streptokinase', '1.5 MU', 'IV', 'Single dose', 'Single dose', 1),
('Alteplase 50mg', 'Alteplase', 'tPA', '50mg', 'IV', 'As directed', 'Single dose', 1),
('Tenecteplase 40mg', 'Tenecteplase', 'TNK-tPA', '40mg', 'IV Bolus', 'Single dose', 'Single dose', 1),
('Tranexamic Acid 500mg', 'Tranexamic Acid', 'Tranexamic Acid', '500mg/5mL', 'IV', 'Every 8 hours', 'As directed', 1),
('Tranexamic Acid 1g', 'Tranexamic Acid', 'Tranexamic Acid', '1g/10mL', 'IV', 'Every 8 hours', 'As directed', 1),
('Protamine 50mg', 'Protamine Sulfate', 'Protamine', '50mg/5mL', 'IV', 'As directed', 'Single dose', 1),
('Vitamin K 10mg', 'Phytomenadione', 'Vitamin K1', '10mg/mL', 'IV/IM/SC', 'As directed', 'As directed', 1);

-- ====================================================================================
-- SEDATIVES & ANESTHETICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Midazolam 5mg', 'Midazolam Hydrochloride', 'Midazolam', '5mg/5mL', 'IV/IM', 'As directed', 'As needed', 1),
('Midazolam 15mg', 'Midazolam Hydrochloride', 'Midazolam', '15mg/3mL', 'IV/IM', 'As directed', 'As needed', 1),
('Diazepam 10mg', 'Diazepam', 'Valium', '10mg/2mL', 'IV/IM', 'As directed', 'As needed', 1),
('Lorazepam 4mg', 'Lorazepam', 'Ativan', '4mg/mL', 'IV/IM', 'As directed', 'As needed', 1),
('Propofol 200mg', 'Propofol', 'Diprivan', '200mg/20mL', 'IV', 'As directed', 'Anesthesia', 1),
('Propofol 500mg', 'Propofol', 'Diprivan', '500mg/50mL', 'IV Infusion', 'Continuous', 'Sedation', 1),
('Ketamine 500mg', 'Ketamine Hydrochloride', 'Ketamine', '500mg/10mL', 'IV/IM', 'As directed', 'Anesthesia', 1),
('Thiopental 500mg', 'Thiopental Sodium', 'Pentothal', '500mg', 'IV', 'As directed', 'Anesthesia', 1),
('Etomidate 20mg', 'Etomidate', 'Amidate', '20mg/10mL', 'IV', 'As directed', 'Anesthesia', 1),
('Succinylcholine 100mg', 'Suxamethonium Chloride', 'Succinylcholine', '100mg/2mL', 'IV', 'As directed', 'Anesthesia', 1),
('Rocuronium 50mg', 'Rocuronium Bromide', 'Rocuronium', '50mg/5mL', 'IV', 'As directed', 'Anesthesia', 1),
('Atracurium 25mg', 'Atracurium Besylate', 'Atracurium', '25mg/2.5mL', 'IV', 'As directed', 'Anesthesia', 1),
('Vecuronium 10mg', 'Vecuronium Bromide', 'Vecuronium', '10mg', 'IV', 'As directed', 'Anesthesia', 1),
('Neostigmine 2.5mg', 'Neostigmine Methylsulfate', 'Neostigmine', '2.5mg/mL', 'IV/IM', 'As directed', 'Reversal', 1),
('Sugammadex 200mg', 'Sugammadex Sodium', 'Bridion', '200mg/2mL', 'IV', 'Single dose', 'Reversal', 1),
('Flumazenil 0.5mg', 'Flumazenil', 'Anexate', '0.5mg/5mL', 'IV', 'As directed', 'Reversal', 1),
('Naloxone 0.4mg', 'Naloxone Hydrochloride', 'Narcan', '0.4mg/mL', 'IV/IM/SC', 'As needed', 'Emergency', 1);

-- ====================================================================================
-- IV FLUIDS & ELECTROLYTES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('NS 500mL', 'Normal Saline 0.9%', 'Sodium Chloride', '500mL', 'IV', 'As directed', 'As directed', 1),
('NS 1000mL', 'Normal Saline 0.9%', 'Sodium Chloride', '1000mL', 'IV', 'As directed', 'As directed', 1),
('RL 500mL', 'Ringer Lactate', 'Hartmann Solution', '500mL', 'IV', 'As directed', 'As directed', 1),
('RL 1000mL', 'Ringer Lactate', 'Hartmann Solution', '1000mL', 'IV', 'As directed', 'As directed', 1),
('DNS 500mL', 'Dextrose Normal Saline', '5% Dextrose + NS', '500mL', 'IV', 'As directed', 'As directed', 1),
('D5W 500mL', '5% Dextrose', 'Dextrose 5%', '500mL', 'IV', 'As directed', 'As directed', 1),
('D10W 500mL', '10% Dextrose', 'Dextrose 10%', '500mL', 'IV', 'As directed', 'As directed', 1),
('D25W 500mL', '25% Dextrose', 'Dextrose 25%', '500mL', 'IV', 'As directed', 'As directed', 1),
('Mannitol 20% 100mL', 'Mannitol 20%', 'Mannitol', '100mL', 'IV', 'As directed', 'As directed', 1),
('Mannitol 20% 350mL', 'Mannitol 20%', 'Mannitol', '350mL', 'IV', 'As directed', 'As directed', 1),
('Potassium Chloride 10mEq', 'Potassium Chloride', 'KCl', '10mEq/10mL', 'IV (diluted)', 'As directed', 'As directed', 1),
('Potassium Chloride 20mEq', 'Potassium Chloride', 'KCl', '20mEq/10mL', 'IV (diluted)', 'As directed', 'As directed', 1),
('Calcium Gluconate 1g', 'Calcium Gluconate', 'Calcium Gluconate', '1g/10mL', 'IV', 'As directed', 'As directed', 1),
('Magnesium Sulfate 1g', 'Magnesium Sulfate', 'MgSO4', '1g/2mL', 'IV/IM', 'As directed', 'As directed', 1),
('Magnesium Sulfate 2g', 'Magnesium Sulfate', 'MgSO4', '2g/4mL', 'IV/IM', 'As directed', 'As directed', 1),
('Sodium Bicarbonate 7.5%', 'Sodium Bicarbonate', 'NaHCO3', '50mL', 'IV', 'As directed', 'Emergency', 1),
('Albumin 20% 100mL', 'Human Albumin 20%', 'Albumin', '100mL', 'IV', 'As directed', 'As directed', 1),
('Haemaccel 500mL', 'Polygeline', 'Haemaccel', '500mL', 'IV', 'As directed', 'As directed', 1);

-- ====================================================================================
-- HORMONES & METABOLIC
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Insulin Regular 100IU', 'Insulin Regular Human', 'Actrapid', '100 IU/mL', 'SC/IV', 'As directed', 'As directed', 1),
('Insulin NPH 100IU', 'Insulin NPH Human', 'Insulatard', '100 IU/mL', 'SC', 'As directed', 'As directed', 1),
('Insulin Glargine 100IU', 'Insulin Glargine', 'Lantus', '100 IU/mL', 'SC', 'Once daily', 'Long-term', 1),
('Insulin Aspart 100IU', 'Insulin Aspart', 'NovoRapid', '100 IU/mL', 'SC', 'Before meals', 'Long-term', 1),
('Glucagon 1mg', 'Glucagon', 'GlucaGen', '1mg', 'IM/SC/IV', 'As needed', 'Emergency', 1),
('Oxytocin 5IU', 'Oxytocin', 'Pitocin', '5 IU/mL', 'IV/IM', 'As directed', 'Labor', 1),
('Oxytocin 10IU', 'Oxytocin', 'Pitocin', '10 IU/mL', 'IV/IM', 'As directed', 'Labor', 1),
('Vasopressin 20IU', 'Vasopressin', 'ADH', '20 IU/mL', 'IV/IM', 'As directed', 'As directed', 1),
('Terbutaline 0.5mg', 'Terbutaline Sulfate', 'Bricanyl', '0.5mg/mL', 'SC', 'As directed', 'Tocolysis', 1),
('Methylergometrine 0.2mg', 'Methylergometrine', 'Methergine', '0.2mg/mL', 'IM/IV', 'As directed', 'Postpartum', 1),
('Carboprost 250mcg', 'Carboprost Tromethamine', 'Hemabate', '250mcg/mL', 'IM', 'As directed', 'PPH', 1),
('Thyroxine IV 200mcg', 'Levothyroxine Sodium', 'T4 IV', '200mcg', 'IV', 'As directed', 'Emergency', 1);

-- ====================================================================================
-- VITAMINS & SUPPLEMENTS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Vitamin B12 1000mcg', 'Cyanocobalamin', 'Vitamin B12', '1000mcg/mL', 'IM', 'As directed', 'As directed', 1),
('Vitamin B1 100mg', 'Thiamine Hydrochloride', 'Vitamin B1', '100mg/mL', 'IV/IM', 'As directed', 'As directed', 1),
('Vitamin B Complex', 'Vitamin B Complex', 'Neurobion', '2mL', 'IM', 'Once daily', 'As directed', 1),
('Vitamin C 500mg', 'Ascorbic Acid', 'Vitamin C', '500mg/5mL', 'IV/IM', 'As directed', 'As directed', 1),
('Vitamin K 10mg', 'Phytomenadione', 'Vitamin K1', '10mg/mL', 'IV/IM/SC', 'As directed', 'As directed', 1),
('Folic Acid 5mg', 'Folic Acid', 'Folate', '5mg/mL', 'IV/IM', 'As directed', 'As directed', 1),
('Iron Sucrose 100mg', 'Iron Sucrose', 'Venofer', '100mg/5mL', 'IV', 'As directed', 'As directed', 1),
('Ferric Carboxymaltose 500mg', 'Ferric Carboxymaltose', 'Ferinject', '500mg/10mL', 'IV', 'As directed', 'As directed', 1),
('Iron Dextran 100mg', 'Iron Dextran', 'Imferon', '100mg/2mL', 'IV/IM', 'As directed', 'As directed', 1);

-- ====================================================================================
-- IMMUNOSUPPRESSANTS & BIOLOGICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Cyclosporine 50mg', 'Cyclosporine', 'Sandimmune', '50mg/mL', 'IV', 'As directed', 'Transplant', 1),
('Tacrolimus 5mg', 'Tacrolimus', 'Prograf', '5mg/mL', 'IV', 'As directed', 'Transplant', 1),
('Basiliximab 20mg', 'Basiliximab', 'Simulect', '20mg', 'IV', 'As directed', 'Transplant', 1),
('ATG 25mg', 'Anti-thymocyte Globulin', 'Thymoglobulin', '25mg', 'IV', 'As directed', 'Transplant', 1),
('Rituximab 500mg', 'Rituximab', 'MabThera', '500mg/50mL', 'IV', 'As directed', 'As directed', 1),
('Infliximab 100mg', 'Infliximab', 'Remicade', '100mg', 'IV', 'As directed', 'As directed', 1),
('Adalimumab 40mg', 'Adalimumab', 'Humira', '40mg/0.8mL', 'SC', 'Every 2 weeks', 'Long-term', 1),
('Tocilizumab 200mg', 'Tocilizumab', 'Actemra', '200mg/10mL', 'IV', 'As directed', 'As directed', 1),
('Bevacizumab 100mg', 'Bevacizumab', 'Avastin', '100mg/4mL', 'IV', 'As directed', 'Chemotherapy', 1),
('Trastuzumab 440mg', 'Trastuzumab', 'Herceptin', '440mg', 'IV', 'As directed', 'Chemotherapy', 1);

-- ====================================================================================
-- CHEMOTHERAPY (Common ones)
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Cisplatin 50mg', 'Cisplatin', 'Platinol', '50mg/50mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Carboplatin 450mg', 'Carboplatin', 'Paraplatin', '450mg/45mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Paclitaxel 100mg', 'Paclitaxel', 'Taxol', '100mg/16.7mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Docetaxel 80mg', 'Docetaxel', 'Taxotere', '80mg/8mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Doxorubicin 50mg', 'Doxorubicin', 'Adriamycin', '50mg/25mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Cyclophosphamide 500mg', 'Cyclophosphamide', 'Cytoxan', '500mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Methotrexate 50mg', 'Methotrexate', 'MTX', '50mg/2mL', 'IV/IM/IT', 'As per protocol', 'Chemotherapy', 1),
('5-FU 500mg', 'Fluorouracil', '5-Fluorouracil', '500mg/10mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Gemcitabine 1g', 'Gemcitabine', 'Gemzar', '1g', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Vincristine 1mg', 'Vincristine Sulfate', 'Oncovin', '1mg/mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Etoposide 100mg', 'Etoposide', 'VePesid', '100mg/5mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Irinotecan 100mg', 'Irinotecan', 'Camptosar', '100mg/5mL', 'IV', 'As per protocol', 'Chemotherapy', 1);

-- ====================================================================================
-- MISCELLANEOUS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Aminophylline 250mg', 'Aminophylline', 'Aminophylline', '250mg/10mL', 'IV', 'As directed', 'Bronchospasm', 1),
('Salbutamol 0.5mg', 'Salbutamol', 'Ventolin', '0.5mg/mL', 'SC/IV', 'As directed', 'Bronchospasm', 1),
('Terbutaline 0.25mg', 'Terbutaline Sulfate', 'Bricanyl', '0.25mg/mL', 'SC', 'As directed', 'Bronchospasm', 1),
('Chlorpheniramine 10mg', 'Chlorpheniramine Maleate', 'Avil', '10mg/mL', 'IV/IM', 'As directed', 'Allergy', 1),
('Pheniramine 22.75mg', 'Pheniramine Maleate', 'Avil', '22.75mg/2mL', 'IV/IM', 'As directed', 'Allergy', 1),
('Diphenhydramine 50mg', 'Diphenhydramine', 'Benadryl', '50mg/mL', 'IV/IM', 'As directed', 'Allergy', 1),
('Haloperidol 5mg', 'Haloperidol', 'Serenace', '5mg/mL', 'IM', 'As directed', 'Agitation', 1),
('Chlorpromazine 25mg', 'Chlorpromazine', 'Largactil', '25mg/mL', 'IM', 'As directed', 'Agitation', 1),
('Phenytoin 250mg', 'Phenytoin Sodium', 'Dilantin', '250mg/5mL', 'IV', 'As directed', 'Seizure', 1),
('Levetiracetam 500mg', 'Levetiracetam', 'Keppra', '500mg/5mL', 'IV', 'As directed', 'Seizure', 1),
('Phenobarbital 200mg', 'Phenobarbital Sodium', 'Gardenal', '200mg/mL', 'IV/IM', 'As directed', 'Seizure', 1),
('Tetanus Toxoid 0.5mL', 'Tetanus Toxoid', 'TT', '0.5mL', 'IM', 'As directed', 'Prophylaxis', 1),
('Tetanus Immunoglobulin 250IU', 'Tetanus Immunoglobulin', 'TIG', '250 IU', 'IM', 'Single dose', 'Prophylaxis', 1),
('Anti-Rabies Vaccine', 'Rabies Vaccine', 'Rabipur', '1mL', 'IM', 'As per schedule', 'Prophylaxis', 1),
('Anti-Snake Venom 10mL', 'Polyvalent Anti-Snake Venom', 'ASV', '10mL', 'IV', 'As directed', 'Snakebite', 1);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Summary
SELECT 'SNOMED CT Injection Import Complete' as Status, COUNT(*) as TotalInjections FROM injection_templates WHERE is_active = 1;
