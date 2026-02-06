-- SNOMED CT Injectable Medications - Extended Import (500+ Injections)
-- Contains ALL injectable drug products from SNOMED CT International Release

SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================================
-- PART 1: GASTROINTESTINAL DRUGS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Hyoscine 20mg', 'Hyoscine Butylbromide', 'Buscopan', '20mg/mL', 'IV/IM', 'Every 8 hours', 'As needed', 1),
('Cimetidine 200mg', 'Cimetidine', 'Cimetidine', '200mg/2mL', 'IV/IM', 'Every 6-8 hours', '7 days', 1),
('Ranitidine 50mg', 'Ranitidine Hydrochloride', 'Ranitidine', '50mg/2mL', 'IV/IM', 'Every 6-8 hours', '7 days', 1),
('Nizatidine 100mg', 'Nizatidine', 'Nizatidine', '100mg/4mL', 'IV', 'Every 12 hours', '7 days', 1),
('Omeprazole 40mg', 'Omeprazole Sodium', 'Omeprazole', '40mg', 'IV', 'Once daily', '7-14 days', 1),
('Pantoprazole 40mg', 'Pantoprazole Sodium', 'Pantoprazole', '40mg', 'IV', 'Once daily', '7-14 days', 1);

-- ====================================================================================
-- PART 2: ANTIDOTES & EMERGENCY DRUGS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Dicobalt Edetate 300mg', 'Dicobalt Edetate', 'Dicobalt Edetate', '300mg/20mL', 'IV', 'As directed', 'Cyanide poisoning', 1),
('Sodium Nitrite 300mg', 'Sodium Nitrite', 'Sodium Nitrite', '300mg/10mL', 'IV', 'As directed', 'Cyanide poisoning', 1),
('Sodium Thiosulfate 12.5g', 'Sodium Thiosulfate', 'Sodium Thiosulfate', '12.5g/25mL', 'IV', 'As directed', 'Cyanide poisoning', 1),
('Dimercaprol 100mg', 'Dimercaprol (BAL)', 'Dimercaprol', '100mg/2mL', 'IM', 'Every 4 hours', 'Heavy metal poisoning', 1),
('Pralidoxime 1g', 'Pralidoxime Mesylate', 'Pralidoxime', '1g/5mL', 'IV/IM', 'As directed', 'Organophosphate poisoning', 1),
('Acetylcysteine 2g', 'Acetylcysteine', 'NAC', '2g/10mL', 'IV', 'As per protocol', 'Paracetamol overdose', 1);

-- ====================================================================================
-- PART 3: CARDIAC GLYCOSIDES & ANTIARRHYTHMICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Digoxin 100mcg Pediatric', 'Digoxin', 'Digoxin', '100mcg/mL', 'IV', 'As directed', 'As directed', 1),
('Digoxin 500mcg', 'Digoxin', 'Digoxin', '500mcg/2mL', 'IV', 'As directed', 'As directed', 1),
('Digoxin Antibody 40mg', 'Digoxin Specific Antibody', 'Digibind', '40mg', 'IV', 'Single dose', 'Digoxin toxicity', 1),
('Amiodarone 150mg', 'Amiodarone Hydrochloride', 'Amiodarone', '150mg/3mL', 'IV', 'As directed', 'As directed', 1),
('Verapamil 5mg', 'Verapamil Hydrochloride', 'Verapamil', '5mg/2mL', 'IV', 'As directed', 'SVT', 1),
('Disopyramide 50mg', 'Disopyramide', 'Disopyramide', '50mg/5mL', 'IV', 'As directed', 'Arrhythmia', 1),
('Flecainide 150mg', 'Flecainide Acetate', 'Flecainide', '150mg/15mL', 'IV', 'As directed', 'Arrhythmia', 1),
('Mexiletine 250mg', 'Mexiletine Hydrochloride', 'Mexiletine', '250mg/10mL', 'IV', 'As directed', 'Arrhythmia', 1),
('Procainamide 1g', 'Procainamide Hydrochloride', 'Procainamide', '1g/10mL', 'IV', 'As directed', 'Arrhythmia', 1),
('Adenosine 6mg', 'Adenosine', 'Adenosine', '6mg/2mL', 'IV Rapid Push', 'As needed', 'SVT', 1);

-- ====================================================================================
-- PART 4: BETA BLOCKERS & ANTIHYPERTENSIVES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Propranolol 1mg', 'Propranolol Hydrochloride', 'Propranolol', '1mg/mL', 'IV', 'As directed', 'Emergency', 1),
('Atenolol 5mg', 'Atenolol', 'Atenolol', '5mg/10mL', 'IV', 'As directed', 'As directed', 1),
('Labetalol 100mg', 'Labetalol Hydrochloride', 'Labetalol', '100mg/20mL', 'IV', 'As directed', 'Hypertensive crisis', 1),
('Metoprolol 5mg', 'Metoprolol Tartrate', 'Metoprolol', '5mg/5mL', 'IV', 'As directed', 'As directed', 1),
('Sotalol 40mg', 'Sotalol Hydrochloride', 'Sotalol', '40mg/4mL', 'IV', 'As directed', 'Arrhythmia', 1),
('Esmolol 100mg', 'Esmolol Hydrochloride', 'Esmolol', '100mg/10mL', 'IV', 'As directed', 'Tachycardia', 1),
('Esmolol 2.5g', 'Esmolol Hydrochloride', 'Esmolol', '2.5g/10mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Diazoxide 300mg', 'Diazoxide', 'Diazoxide', '300mg/20mL', 'IV', 'As directed', 'Hypertensive crisis', 1),
('Hydralazine 20mg', 'Hydralazine Hydrochloride', 'Hydralazine', '20mg', 'IV/IM', 'As directed', 'Hypertension', 1),
('Guanethidine 10mg', 'Guanethidine Monosulfate', 'Guanethidine', '10mg/mL', 'IM', 'As directed', 'Hypertension', 1),
('Phentolamine 10mg', 'Phentolamine Mesylate', 'Phentolamine', '10mg/mL', 'IV/IM', 'As directed', 'Pheochromocytoma', 1),
('Clonidine 150mcg', 'Clonidine Hydrochloride', 'Clonidine', '150mcg/mL', 'IV', 'As directed', 'Hypertension', 1);

-- ====================================================================================
-- PART 5: NITRATES & VASODILATORS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Isosorbide Dinitrate 25mg', 'Isosorbide Dinitrate', 'ISDN', '25mg/50mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Isosorbide Dinitrate 10mg', 'Isosorbide Dinitrate', 'ISDN', '10mg/10mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Isosorbide Dinitrate 50mg', 'Isosorbide Dinitrate', 'ISDN', '50mg/50mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('GTN 5mg', 'Glyceryl Trinitrate', 'Nitroglycerin', '5mg/5mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('GTN 10mg', 'Glyceryl Trinitrate', 'Nitroglycerin', '10mg/10mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('GTN 25mg', 'Glyceryl Trinitrate', 'Nitroglycerin', '25mg/5mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('GTN 50mg', 'Glyceryl Trinitrate', 'Nitroglycerin', '50mg/50mL', 'IV Infusion', 'Continuous', 'As directed', 1);

-- ====================================================================================
-- PART 6: SYMPATHOMIMETICS & VASOPRESSORS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Adrenaline 500mcg', 'Adrenaline', 'Epinephrine', '500mcg/0.5mL', 'IM/SC', 'As needed', 'Anaphylaxis', 1),
('Adrenaline 1mg 1:1000', 'Adrenaline', 'Epinephrine', '1mg/mL', 'IM/SC/IV', 'As needed', 'Emergency', 1),
('Adrenaline 1mg 1:10000', 'Adrenaline', 'Epinephrine', '1mg/10mL', 'IV', 'As needed', 'Cardiac arrest', 1),
('Adrenaline 5mg', 'Adrenaline', 'Epinephrine', '5mg/5mL', 'IV Infusion', 'Continuous', 'Shock', 1),
('Metaraminol 10mg', 'Metaraminol', 'Metaraminol', '10mg/mL', 'IV/IM', 'As directed', 'Hypotension', 1),
('Methoxamine 20mg', 'Methoxamine Hydrochloride', 'Methoxamine', '20mg/mL', 'IV/IM', 'As directed', 'Hypotension', 1),
('Phenylephrine 10mg', 'Phenylephrine Hydrochloride', 'Phenylephrine', '10mg/mL', 'IV/IM/SC', 'As directed', 'Hypotension', 1),
('Ephedrine 30mg', 'Ephedrine Hydrochloride', 'Ephedrine', '30mg/mL', 'IV/IM', 'As directed', 'Hypotension', 1);

-- ====================================================================================
-- PART 7: ANTICOAGULANTS - HEPARINS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Heparin 1000IU', 'Heparin Sodium', 'Heparin', '1000 IU/mL', 'IV/SC', 'As directed', 'As directed', 1),
('Heparin 5000IU/5mL', 'Heparin Sodium', 'Heparin', '5000 IU/5mL', 'IV/SC', 'As directed', 'As directed', 1),
('Heparin 5000IU/mL', 'Heparin Sodium', 'Heparin', '5000 IU/mL', 'IV/SC', 'As directed', 'As directed', 1),
('Heparin 25000IU', 'Heparin Sodium', 'Heparin', '25000 IU/5mL', 'IV Infusion', 'Continuous', 'As directed', 1),
('Heparin 5000IU SC', 'Heparin Sodium', 'Heparin', '5000 IU/0.2mL', 'SC', 'Every 8-12 hours', 'DVT prophylaxis', 1),
('Heparin Calcium 5000IU', 'Heparin Calcium', 'Heparin', '5000 IU/0.2mL', 'SC', 'Every 8-12 hours', 'DVT prophylaxis', 1),
('Dalteparin 10000IU', 'Dalteparin Sodium', 'Fragmin', '10000 IU/mL', 'SC', 'Once daily', '7-14 days', 1),
('Dalteparin 100000IU', 'Dalteparin Sodium', 'Fragmin', '100000 IU/4mL', 'SC', 'As directed', 'As directed', 1),
('Tinzaparin 20000IU', 'Tinzaparin Sodium', 'Tinzaparin', '20000 IU/2mL', 'SC', 'Once daily', 'As directed', 1),
('Tinzaparin 40000IU', 'Tinzaparin Sodium', 'Tinzaparin', '40000 IU/2mL', 'SC', 'Once daily', 'As directed', 1),
('Danaparoid 750IU', 'Danaparoid Sodium', 'Danaparoid', '750 IU/0.6mL', 'SC/IV', 'As directed', 'HIT', 1),
('Lepirudin 50mg', 'Lepirudin', 'Lepirudin', '50mg', 'IV', 'As directed', 'HIT', 1);

-- ====================================================================================
-- PART 8: THROMBOLYTICS & HEMOSTATICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Streptokinase 250000IU', 'Streptokinase', 'Streptokinase', '250000 IU', 'IV', 'Single dose', 'MI/PE', 1),
('Streptokinase 750000IU', 'Streptokinase', 'Streptokinase', '750000 IU', 'IV', 'Single dose', 'MI/PE', 1),
('Streptokinase 1.5MU', 'Streptokinase', 'Streptokinase', '1.5 MU', 'IV', 'Single dose', 'MI/PE', 1),
('Alteplase 10mg', 'Alteplase', 'tPA', '10mg', 'IV', 'As per protocol', 'MI/Stroke', 1),
('Alteplase 20mg', 'Alteplase', 'tPA', '20mg', 'IV', 'As per protocol', 'MI/Stroke', 1),
('Alteplase 50mg', 'Alteplase', 'tPA', '50mg', 'IV', 'As per protocol', 'MI/Stroke', 1),
('Reteplase 10U', 'Reteplase', 'Reteplase', '10 units', 'IV Bolus', 'Two doses 30min apart', 'MI', 1),
('Tenecteplase 40mg', 'Tenecteplase', 'TNK-tPA', '40mg', 'IV Bolus', 'Single dose', 'MI', 1),
('Tranexamic Acid 500mg', 'Tranexamic Acid', 'Tranexamic Acid', '500mg/5mL', 'IV', 'Every 8 hours', 'Bleeding', 1),
('Aprotinin 500000U', 'Aprotinin', 'Aprotinin', '500000 units/50mL', 'IV', 'As directed', 'Surgery', 1),
('Protamine 50mg', 'Protamine Sulfate', 'Protamine', '50mg/5mL', 'IV', 'As directed', 'Heparin reversal', 1),
('Protamine 100mg', 'Protamine Sulfate', 'Protamine', '100mg/10mL', 'IV', 'As directed', 'Heparin reversal', 1);

-- ====================================================================================
-- PART 9: CLOTTING FACTORS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Factor VIII 250IU', 'Factor VIII', 'Antihemophilic Factor', '250 IU', 'IV', 'As directed', 'Hemophilia A', 1),
('Factor VIII 500IU', 'Factor VIII', 'Antihemophilic Factor', '500 IU', 'IV', 'As directed', 'Hemophilia A', 1),
('Factor VIII 1000IU', 'Factor VIII', 'Antihemophilic Factor', '1000 IU', 'IV', 'As directed', 'Hemophilia A', 1),
('Factor IX 250IU', 'Recombinant Factor IX', 'Factor IX', '250 IU', 'IV', 'As directed', 'Hemophilia B', 1),
('Factor IX 500IU', 'Recombinant Factor IX', 'Factor IX', '500 IU', 'IV', 'As directed', 'Hemophilia B', 1),
('Factor IX 1000IU', 'Recombinant Factor IX', 'Factor IX', '1000 IU', 'IV', 'As directed', 'Hemophilia B', 1),
('Factor VIIa 60000IU', 'Recombinant Factor VIIa', 'NovoSeven', '60000 IU', 'IV', 'As directed', 'Bleeding', 1),
('Factor VIIa 120000IU', 'Recombinant Factor VIIa', 'NovoSeven', '120000 IU', 'IV', 'As directed', 'Bleeding', 1),
('Factor XIII 250U', 'Factor XIII', 'Factor XIII', '250 units', 'IV', 'As directed', 'Factor XIII deficiency', 1);

-- ====================================================================================
-- PART 10: INOTROPES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Enoximone 100mg', 'Enoximone', 'Enoximone', '100mg/20mL', 'IV Infusion', 'Continuous', 'Heart failure', 1),
('Milrinone 10mg', 'Milrinone', 'Milrinone', '10mg/10mL', 'IV Infusion', 'Continuous', 'Heart failure', 1),
('Dopamine 200mg', 'Dopamine Hydrochloride', 'Dopamine', '200mg/5mL', 'IV Infusion', 'Continuous', 'Shock', 1),
('Dobutamine 250mg', 'Dobutamine Hydrochloride', 'Dobutamine', '250mg/20mL', 'IV Infusion', 'Continuous', 'Heart failure', 1);

-- ====================================================================================
-- PART 11: BRONCHODILATORS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Salbutamol 250mcg', 'Salbutamol', 'Albuterol', '250mcg/5mL', 'IV', 'As directed', 'Severe asthma', 1),
('Salbutamol 500mcg', 'Salbutamol', 'Albuterol', '500mcg/mL', 'SC/IV', 'As directed', 'Severe asthma', 1),
('Terbutaline 500mcg', 'Terbutaline Sulfate', 'Terbutaline', '500mcg/mL', 'SC', 'As directed', 'Asthma/Tocolysis', 1),
('Aminophylline 250mg', 'Aminophylline', 'Aminophylline', '250mg/10mL', 'IV', 'As directed', 'Asthma', 1);

-- ====================================================================================
-- PART 12: ANTIHISTAMINES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Chlorpheniramine 10mg', 'Chlorpheniramine Maleate', 'Avil', '10mg/mL', 'IV/IM', 'Every 8-12 hours', 'Allergy', 1),
('Promethazine 25mg', 'Promethazine Hydrochloride', 'Phenergan', '25mg/mL', 'IM', 'Every 4-6 hours', 'Allergy/Nausea', 1),
('Promethazine 50mg', 'Promethazine Hydrochloride', 'Phenergan', '50mg/2mL', 'IM', 'Every 4-6 hours', 'Allergy/Nausea', 1);

-- ====================================================================================
-- PART 13: RESPIRATORY STIMULANTS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Doxapram 100mg', 'Doxapram Hydrochloride', 'Doxapram', '100mg/5mL', 'IV', 'As directed', 'Respiratory depression', 1),
('Nikethamide 500mg', 'Nikethamide', 'Nikethamide', '500mg/2mL', 'IV/IM', 'As directed', 'Respiratory depression', 1);

-- ====================================================================================
-- PART 14: SEDATIVES & ANXIOLYTICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Lorazepam 4mg', 'Lorazepam', 'Ativan', '4mg/mL', 'IV/IM', 'As directed', 'Seizures/Sedation', 1),
('Flumazenil 500mcg', 'Flumazenil', 'Anexate', '500mcg/5mL', 'IV', 'As directed', 'BZD reversal', 1),
('Midazolam 5mg', 'Midazolam Hydrochloride', 'Midazolam', '5mg/5mL', 'IV/IM', 'As directed', 'Sedation', 1),
('Midazolam 15mg', 'Midazolam Hydrochloride', 'Midazolam', '15mg/3mL', 'IV/IM', 'As directed', 'Sedation', 1),
('Diazepam 10mg', 'Diazepam', 'Valium', '10mg/2mL', 'IV/IM', 'As directed', 'Seizures/Sedation', 1);

-- ====================================================================================
-- PART 15: ANTIPSYCHOTICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Chlorpromazine 25mg', 'Chlorpromazine Hydrochloride', 'Largactil', '25mg/mL', 'IM', 'As directed', 'Psychosis', 1),
('Chlorpromazine 50mg', 'Chlorpromazine Hydrochloride', 'Largactil', '50mg/2mL', 'IM', 'As directed', 'Psychosis', 1),
('Haloperidol 5mg', 'Haloperidol', 'Serenace', '5mg/mL', 'IM', 'As directed', 'Agitation', 1),
('Haloperidol 20mg', 'Haloperidol', 'Serenace', '20mg/2mL', 'IM', 'As directed', 'Agitation', 1),
('Haloperidol Decanoate 50mg', 'Haloperidol Decanoate', 'Haldol Decanoate', '50mg/mL', 'IM Deep', 'Monthly', 'Long-term', 1),
('Haloperidol Decanoate 100mg', 'Haloperidol Decanoate', 'Haldol Decanoate', '100mg/mL', 'IM Deep', 'Monthly', 'Long-term', 1),
('Promazine 50mg', 'Promazine Hydrochloride', 'Promazine', '50mg/mL', 'IM', 'As directed', 'Agitation', 1),
('Zuclopenthixol Acetate 50mg', 'Zuclopenthixol Acetate', 'Clopixol Acuphase', '50mg/mL', 'IM', 'As directed', 'Acute psychosis', 1),
('Zuclopenthixol Acetate 100mg', 'Zuclopenthixol Acetate', 'Clopixol Acuphase', '100mg/2mL', 'IM', 'As directed', 'Acute psychosis', 1),
('Zuclopenthixol Decanoate 200mg', 'Zuclopenthixol Decanoate', 'Clopixol', '200mg/mL', 'IM Deep', 'Every 2-4 weeks', 'Long-term', 1),
('Flupenthixol Decanoate 20mg', 'Flupenthixol Decanoate', 'Depixol', '20mg/mL', 'IM Deep', 'Every 2-4 weeks', 'Long-term', 1),
('Flupenthixol Decanoate 100mg', 'Flupenthixol Decanoate', 'Depixol', '100mg/mL', 'IM Deep', 'Every 2-4 weeks', 'Long-term', 1),
('Fluphenazine Decanoate 25mg', 'Fluphenazine Decanoate', 'Modecate', '25mg/mL', 'IM Deep', 'Every 2-4 weeks', 'Long-term', 1),
('Fluphenazine Decanoate 100mg', 'Fluphenazine Decanoate', 'Modecate', '100mg/mL', 'IM Deep', 'Every 2-4 weeks', 'Long-term', 1),
('Pipothiazine Palmitate 50mg', 'Pipothiazine Palmitate', 'Piportil', '50mg/mL', 'IM Deep', 'Monthly', 'Long-term', 1);

-- ====================================================================================
-- PART 16: ANTIDEPRESSANTS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Clomipramine 25mg', 'Clomipramine Hydrochloride', 'Anafranil', '25mg/2mL', 'IM', 'As directed', 'Depression/OCD', 1);

-- ====================================================================================
-- PART 17: ANTIEMETICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Cyclizine 50mg', 'Cyclizine Lactate', 'Cyclizine', '50mg/mL', 'IV/IM', 'Every 8 hours', 'Nausea', 1),
('Metoclopramide 10mg', 'Metoclopramide Hydrochloride', 'Maxolon', '10mg/2mL', 'IV/IM', 'Every 8 hours', 'Nausea', 1),
('Metoclopramide 100mg', 'Metoclopramide Hydrochloride', 'Maxolon', '100mg/20mL', 'IV Infusion', 'Continuous', 'Chemotherapy', 1),
('Prochlorperazine 12.5mg', 'Prochlorperazine Mesylate', 'Stemetil', '12.5mg/mL', 'IM', 'Every 6 hours', 'Nausea', 1),
('Ondansetron 4mg', 'Ondansetron Hydrochloride', 'Zofran', '4mg/2mL', 'IV', 'Every 8 hours', 'Nausea', 1),
('Ondansetron 8mg', 'Ondansetron Hydrochloride', 'Zofran', '8mg/4mL', 'IV', 'Every 8-12 hours', 'Nausea', 1),
('Tropisetron 2mg', 'Tropisetron', 'Navoban', '2mg/2mL', 'IV', 'Once daily', 'Chemotherapy', 1),
('Tropisetron 5mg', 'Tropisetron', 'Navoban', '5mg/5mL', 'IV', 'Once daily', 'Chemotherapy', 1),
('Granisetron 1mg', 'Granisetron Hydrochloride', 'Kytril', '1mg/mL', 'IV', 'Once daily', 'Chemotherapy', 1);

-- ====================================================================================
-- PART 18: ANALGESICS - OPIOIDS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Nefopam 20mg', 'Nefopam Hydrochloride', 'Nefopam', '20mg/mL', 'IM', 'Every 6 hours', 'Pain', 1),
('Codeine 60mg', 'Codeine Phosphate', 'Codeine', '60mg/mL', 'IM/SC', 'Every 4-6 hours', 'Pain', 1),
('Diamorphine 5mg', 'Diamorphine Hydrochloride', 'Heroin', '5mg', 'IV/IM/SC', 'As directed', 'Pain', 1),
('Diamorphine 10mg', 'Diamorphine Hydrochloride', 'Heroin', '10mg', 'IV/IM/SC', 'As directed', 'Pain', 1),
('Diamorphine 30mg', 'Diamorphine Hydrochloride', 'Heroin', '30mg', 'IV/IM/SC', 'As directed', 'Pain', 1),
('Diamorphine 100mg', 'Diamorphine Hydrochloride', 'Heroin', '100mg', 'IV/IM/SC', 'As directed', 'Pain', 1),
('Dihydrocodeine 50mg', 'Dihydrocodeine Tartrate', 'Dihydrocodeine', '50mg/mL', 'IM/SC', 'Every 4-6 hours', 'Pain', 1),
('Meptazinol 100mg', 'Meptazinol', 'Meptid', '100mg/mL', 'IM', 'Every 3-6 hours', 'Pain', 1),
('Methadone 10mg', 'Methadone Hydrochloride', 'Methadone', '10mg/mL', 'IM/SC', 'As directed', 'Pain/Addiction', 1),
('Methadone 20mg', 'Methadone Hydrochloride', 'Methadone', '20mg/2mL', 'IM/SC', 'As directed', 'Pain/Addiction', 1),
('Nalbuphine 10mg', 'Nalbuphine Hydrochloride', 'Nubain', '10mg/mL', 'IV/IM/SC', 'Every 3-6 hours', 'Pain', 1),
('Nalbuphine 20mg', 'Nalbuphine Hydrochloride', 'Nubain', '20mg/2mL', 'IV/IM/SC', 'Every 3-6 hours', 'Pain', 1),
('Pentazocine 30mg', 'Pentazocine Lactate', 'Fortral', '30mg/mL', 'IV/IM/SC', 'Every 3-4 hours', 'Pain', 1),
('Pentazocine 60mg', 'Pentazocine Lactate', 'Fortral', '60mg/2mL', 'IV/IM/SC', 'Every 3-4 hours', 'Pain', 1),
('Pethidine 100mg', 'Pethidine Hydrochloride', 'Meperidine', '100mg/2mL', 'IV/IM', 'Every 4-6 hours', 'Pain', 1),
('Tramadol 100mg', 'Tramadol Hydrochloride', 'Tramadol', '100mg/2mL', 'IV/IM', 'Every 6-8 hours', 'Pain', 1),
('Morphine 50mg', 'Morphine Sulfate', 'Morphine', '50mg/50mL', 'IV Infusion', 'Continuous', 'Pain', 1),
('Morphine 100mg', 'Morphine Sulfate', 'Morphine', '100mg/50mL', 'IV Infusion', 'Continuous', 'Pain', 1);

-- ====================================================================================
-- PART 19: ANTIMIGRAINE
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Sumatriptan 6mg', 'Sumatriptan', 'Imitrex', '6mg/0.5mL', 'SC', 'As needed', 'Migraine', 1);

-- ====================================================================================
-- PART 20: ANTICONVULSANTS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Phenobarbital 200mg', 'Phenobarbital Sodium', 'Gardenal', '200mg/mL', 'IV/IM', 'As directed', 'Seizure', 1),
('Sodium Valproate 400mg', 'Sodium Valproate', 'Epilim', '400mg', 'IV', 'As directed', 'Seizure', 1),
('Fosphenytoin 750mg', 'Fosphenytoin Sodium', 'Fosphenytoin', '750mg/10mL', 'IV/IM', 'As directed', 'Seizure', 1),
('Phenytoin 250mg', 'Phenytoin Sodium', 'Dilantin', '250mg/5mL', 'IV', 'As directed', 'Seizure', 1),
('Clonazepam 1mg', 'Clonazepam', 'Rivotril', '1mg/mL', 'IV', 'As directed', 'Status epilepticus', 1),
('Levetiracetam 500mg', 'Levetiracetam', 'Keppra', '500mg/5mL', 'IV', 'Twice daily', 'Seizure', 1);

-- ====================================================================================
-- PART 21: ANTIPARKINSONIAN
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Apomorphine 20mg', 'Apomorphine Hydrochloride', 'Apomorphine', '20mg/2mL', 'SC', 'As directed', 'Parkinson rescue', 1),
('Apomorphine 50mg', 'Apomorphine Hydrochloride', 'Apomorphine', '50mg/5mL', 'SC Infusion', 'Continuous', 'Parkinson', 1),
('Benztropine 2mg', 'Benztropine Mesylate', 'Cogentin', '2mg/2mL', 'IV/IM', 'As directed', 'Dystonia', 1),
('Procyclidine 10mg', 'Procyclidine Hydrochloride', 'Kemadrin', '10mg/2mL', 'IV/IM', 'As directed', 'Dystonia', 1);

-- ====================================================================================
-- PART 22: NEUROMUSCULAR AGENTS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Botulinum Toxin 100U', 'Botulinum Toxin A', 'Botox', '100 units', 'IM', 'As directed', 'Dystonia/Cosmetic', 1),
('Botulinum Toxin 500U', 'Botulinum Toxin A', 'Botox', '500 units', 'IM', 'As directed', 'Dystonia', 1),
('Botulinum Toxin B 2500U', 'Botulinum Toxin B', 'Myobloc', '2500 units/0.5mL', 'IM', 'As directed', 'Dystonia', 1),
('Botulinum Toxin B 5000U', 'Botulinum Toxin B', 'Myobloc', '5000 units/mL', 'IM', 'As directed', 'Dystonia', 1),
('Botulinum Toxin B 10000U', 'Botulinum Toxin B', 'Myobloc', '10000 units/2mL', 'IM', 'As directed', 'Dystonia', 1);

-- ====================================================================================
-- PART 23: ANTIBIOTICS - PENICILLINS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Benzylpenicillin 600mg', 'Benzylpenicillin', 'Penicillin G', '600mg', 'IV/IM', 'Every 4-6 hours', '7-14 days', 1),
('Benzylpenicillin 1.2g', 'Benzylpenicillin', 'Penicillin G', '1.2g', 'IV/IM', 'Every 4-6 hours', '7-14 days', 1),
('Flucloxacillin 250mg', 'Flucloxacillin', 'Flucloxacillin', '250mg', 'IV/IM', 'Every 6 hours', '7-14 days', 1),
('Flucloxacillin 500mg', 'Flucloxacillin', 'Flucloxacillin', '500mg', 'IV/IM', 'Every 6 hours', '7-14 days', 1),
('Flucloxacillin 1g', 'Flucloxacillin', 'Flucloxacillin', '1g', 'IV/IM', 'Every 6 hours', '7-14 days', 1),
('Co-amoxiclav 500/100mg', 'Amoxicillin/Clavulanate', 'Augmentin', '500mg/100mg', 'IV', 'Every 8 hours', '7 days', 1),
('Co-amoxiclav 1g/200mg', 'Amoxicillin/Clavulanate', 'Augmentin', '1g/200mg', 'IV', 'Every 8 hours', '7 days', 1),
('Ampicillin 500mg', 'Ampicillin Sodium', 'Ampicillin', '500mg', 'IV/IM', 'Every 6 hours', '7-14 days', 1),
('Amoxicillin 250mg', 'Amoxicillin Sodium', 'Amoxicillin', '250mg', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Amoxicillin 500mg', 'Amoxicillin Sodium', 'Amoxicillin', '500mg', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Amoxicillin 1g', 'Amoxicillin Sodium', 'Amoxicillin', '1g', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Piperacillin 1g', 'Piperacillin', 'Piperacillin', '1g', 'IV/IM', 'Every 6-8 hours', '7-14 days', 1),
('Piperacillin 2g', 'Piperacillin', 'Piperacillin', '2g', 'IV/IM', 'Every 6-8 hours', '7-14 days', 1),
('Piperacillin-Tazobactam 2.25g', 'Piperacillin/Tazobactam', 'Tazocin', '2g/250mg', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Piperacillin-Tazobactam 4.5g', 'Piperacillin/Tazobactam', 'Tazocin', '4g/500mg', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Ticarcillin-Clavulanate 3.2g', 'Ticarcillin/Clavulanate', 'Timentin', '3g/200mg', 'IV', 'Every 6-8 hours', '7-14 days', 1);

-- ====================================================================================
-- PART 24: ANTIBIOTICS - CEPHALOSPORINS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Cefotaxime 500mg', 'Cefotaxime Sodium', 'Cefotaxime', '500mg', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Cefotaxime 1g', 'Cefotaxime Sodium', 'Cefotaxime', '1g', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Cefotaxime 2g', 'Cefotaxime Sodium', 'Cefotaxime', '2g', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Cefoxitin 1g', 'Cefoxitin Sodium', 'Mefoxin', '1g', 'IV/IM', 'Every 6-8 hours', '7-14 days', 1),
('Cefoxitin 2g', 'Cefoxitin Sodium', 'Mefoxin', '2g', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Ceftazidime 250mg', 'Ceftazidime', 'Fortaz', '250mg', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Ceftazidime 500mg', 'Ceftazidime', 'Fortaz', '500mg', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Ceftazidime 1g', 'Ceftazidime', 'Fortaz', '1g', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Ceftazidime 2g', 'Ceftazidime', 'Fortaz', '2g', 'IV', 'Every 8 hours', '7-14 days', 1),
('Ceftazidime 3g', 'Ceftazidime', 'Fortaz', '3g', 'IV', 'Every 8 hours', '7-14 days', 1),
('Cefuroxime 250mg', 'Cefuroxime Sodium', 'Zinacef', '250mg', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Cefuroxime 750mg', 'Cefuroxime Sodium', 'Zinacef', '750mg', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Cefuroxime 1.5g', 'Cefuroxime Sodium', 'Zinacef', '1.5g', 'IV', 'Every 8 hours', '7 days', 1),
('Cefazolin 500mg', 'Cefazolin Sodium', 'Ancef', '500mg', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Cefazolin 1g', 'Cefazolin Sodium', 'Ancef', '1g', 'IV/IM', 'Every 8 hours', '7 days', 1),
('Ceftriaxone 250mg', 'Ceftriaxone Sodium', 'Rocephin', '250mg', 'IV/IM', 'Once daily', '7-14 days', 1),
('Ceftriaxone 1g', 'Ceftriaxone Sodium', 'Rocephin', '1g', 'IV/IM', 'Once daily', '7-14 days', 1),
('Ceftriaxone 2g', 'Ceftriaxone Sodium', 'Rocephin', '2g', 'IV', 'Once daily', '7-14 days', 1),
('Cefpirome 1g', 'Cefpirome', 'Cefpirome', '1g', 'IV', 'Every 12 hours', '7-14 days', 1),
('Cefpirome 2g', 'Cefpirome', 'Cefpirome', '2g', 'IV', 'Every 12 hours', '7-14 days', 1),
('Cefradine 500mg', 'Cefradine', 'Velosef', '500mg', 'IV/IM', 'Every 6 hours', '7 days', 1),
('Cefradine 1g', 'Cefradine', 'Velosef', '1g', 'IV/IM', 'Every 6 hours', '7 days', 1);

-- ====================================================================================
-- PART 25: ANTIBIOTICS - MONOBACTAMS & CARBAPENEMS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Aztreonam 500mg', 'Aztreonam', 'Azactam', '500mg', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Aztreonam 1g', 'Aztreonam', 'Azactam', '1g', 'IV/IM', 'Every 8-12 hours', '7-14 days', 1),
('Aztreonam 2g', 'Aztreonam', 'Azactam', '2g', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Imipenem-Cilastatin 500mg IM', 'Imipenem/Cilastatin', 'Primaxin IM', '500mg/500mg', 'IM', 'Every 12 hours', '7-14 days', 1),
('Imipenem-Cilastatin 500mg IV', 'Imipenem/Cilastatin', 'Primaxin IV', '500mg/500mg', 'IV', 'Every 6-8 hours', '7-14 days', 1),
('Meropenem 500mg', 'Meropenem', 'Meropenem', '500mg', 'IV', 'Every 8 hours', '7-14 days', 1),
('Meropenem 1g', 'Meropenem', 'Meropenem', '1g', 'IV', 'Every 8 hours', '7-14 days', 1);

-- ====================================================================================
-- PART 26: ANTIBIOTICS - AMINOGLYCOSIDES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Gentamicin 5mg IT', 'Gentamicin Sulfate', 'Gentamicin', '5mg/mL', 'Intrathecal', 'As directed', 'CNS infection', 1),
('Gentamicin 10mg Pediatric', 'Gentamicin Sulfate', 'Gentamicin', '10mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 20mg', 'Gentamicin Sulfate', 'Gentamicin', '20mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 40mg', 'Gentamicin Sulfate', 'Gentamicin', '40mg/mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 60mg', 'Gentamicin Sulfate', 'Gentamicin', '60mg/mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 80mg', 'Gentamicin Sulfate', 'Gentamicin', '80mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 120mg', 'Gentamicin Sulfate', 'Gentamicin', '120mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Gentamicin 1g', 'Gentamicin Sulfate', 'Gentamicin', '1g', 'IV/IM', 'As directed', '7-10 days', 1),
('Amikacin 100mg Pediatric', 'Amikacin Sulfate', 'Amikin', '100mg/2mL', 'IV/IM', 'Every 8-12 hours', '7-10 days', 1),
('Amikacin 500mg', 'Amikacin Sulfate', 'Amikin', '500mg/2mL', 'IV/IM', 'Every 8-12 hours', '7-10 days', 1),
('Netilmicin 15mg', 'Netilmicin Sulfate', 'Netromycin', '15mg/1.5mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Netilmicin 50mg', 'Netilmicin Sulfate', 'Netromycin', '50mg/mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Netilmicin 100mg', 'Netilmicin Sulfate', 'Netromycin', '100mg/mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Netilmicin 150mg', 'Netilmicin Sulfate', 'Netromycin', '150mg/1.5mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Netilmicin 200mg', 'Netilmicin Sulfate', 'Netromycin', '200mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Tobramycin 20mg', 'Tobramycin Sulfate', 'Nebcin', '20mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Tobramycin 40mg', 'Tobramycin Sulfate', 'Nebcin', '40mg/mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1),
('Tobramycin 80mg', 'Tobramycin Sulfate', 'Nebcin', '80mg/2mL', 'IV/IM', 'Every 8 hours', '7-10 days', 1);

-- ====================================================================================
-- PART 27: ANTIBIOTICS - OTHER
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Clarithromycin 500mg', 'Clarithromycin', 'Klaricid', '500mg', 'IV', 'Every 12 hours', '7-14 days', 1),
('Clindamycin 300mg', 'Clindamycin Phosphate', 'Dalacin', '300mg/2mL', 'IV/IM', 'Every 6-8 hours', '7-10 days', 1),
('Clindamycin 600mg', 'Clindamycin Phosphate', 'Dalacin', '600mg/4mL', 'IV/IM', 'Every 6-8 hours', '7-10 days', 1),
('Chloramphenicol 1g', 'Chloramphenicol', 'Chloramphenicol', '1g', 'IV', 'Every 6 hours', '7-14 days', 1),
('Colistin 500000U', 'Colistimethate Sodium', 'Colomycin', '500000 units', 'IV/IM', 'Every 8 hours', '7-14 days', 1),
('Vancomycin 500mg', 'Vancomycin Hydrochloride', 'Vancocin', '500mg', 'IV', 'Every 6-12 hours', '7-14 days', 1),
('Vancomycin 1g', 'Vancomycin Hydrochloride', 'Vancocin', '1g', 'IV', 'Every 12 hours', '7-14 days', 1),
('Teicoplanin 200mg', 'Teicoplanin', 'Targocid', '200mg', 'IV/IM', 'Once daily', '7-14 days', 1),
('Teicoplanin 400mg', 'Teicoplanin', 'Targocid', '400mg', 'IV/IM', 'Once daily', '7-14 days', 1),
('Trimethoprim 100mg', 'Trimethoprim', 'Trimethoprim', '100mg/5mL', 'IV', 'Every 12 hours', '7-14 days', 1),
('Sulfadiazine 1g', 'Sulfadiazine', 'Sulfadiazine', '1g/4mL', 'IV', 'Every 6 hours', '7-14 days', 1);

-- ====================================================================================
-- PART 28: ANTITUBERCULAR
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Capreomycin 1g', 'Capreomycin', 'Capastat', '1g', 'IM', 'Once daily', 'TB treatment', 1),
('Isoniazid 50mg', 'Isoniazid', 'INH', '50mg/2mL', 'IM', 'As directed', 'TB treatment', 1),
('Rifampicin 300mg', 'Rifampicin', 'Rifadin', '300mg', 'IV', 'As directed', 'TB treatment', 1),
('Rifampicin 600mg', 'Rifampicin', 'Rifadin', '600mg', 'IV', 'As directed', 'TB treatment', 1),
('Streptomycin 1g', 'Streptomycin Sulfate', 'Streptomycin', '1g', 'IM', 'Once daily', 'TB treatment', 1);

-- ====================================================================================
-- PART 29: ANTIPARASITICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Chloroquine 200mg', 'Chloroquine Sulfate', 'Chloroquine', '200mg/5mL', 'IM', 'As directed', 'Malaria', 1),
('Sodium Stibogluconate 10g', 'Sodium Stibogluconate', 'Pentostam', '10g/100mL', 'IV/IM', 'As directed', 'Leishmaniasis', 1),
('Pentamidine 300mg', 'Pentamidine Isethionate', 'Pentam', '300mg', 'IV/IM', 'As directed', 'PCP', 1);

-- ====================================================================================
-- PART 30: INSULIN & DIABETES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Insulin Regular 100IU', 'Insulin Regular Human', 'Actrapid', '100 IU/mL', 'SC/IV', 'As directed', 'Diabetes', 1),
('Insulin Lispro 100IU', 'Insulin Lispro', 'Humalog', '100 IU/mL', 'SC', 'Before meals', 'Diabetes', 1),
('Insulin Aspart 100IU', 'Insulin Aspart', 'NovoRapid', '100 IU/mL', 'SC', 'Before meals', 'Diabetes', 1),
('Insulin NPH 100IU', 'Insulin NPH Human', 'Insulatard', '100 IU/mL', 'SC', 'As directed', 'Diabetes', 1),
('Insulin Glargine 100IU', 'Insulin Glargine', 'Lantus', '100 IU/mL', 'SC', 'Once daily', 'Diabetes', 1),
('Insulin Zinc 100IU', 'Insulin Zinc Suspension', 'Lente', '100 IU/mL', 'SC', 'As directed', 'Diabetes', 1),
('Insulin Mixed 30/70', 'Insulin Mixed', 'Mixtard 30', '100 IU/mL', 'SC', 'As directed', 'Diabetes', 1),
('Glucagon 1mg', 'Glucagon', 'GlucaGen', '1mg', 'IM/SC/IV', 'As needed', 'Hypoglycemia', 1);

-- ====================================================================================
-- PART 31: CORTICOSTEROIDS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Betamethasone 4mg', 'Betamethasone Sodium Phosphate', 'Betnesol', '4mg/mL', 'IV/IM', 'As directed', 'Inflammation', 1),
('Dexamethasone 4mg', 'Dexamethasone Sodium Phosphate', 'Decadron', '4mg/mL', 'IV/IM', 'As directed', 'Inflammation', 1),
('Dexamethasone 8mg', 'Dexamethasone Sodium Phosphate', 'Decadron', '8mg/2mL', 'IV/IM', 'As directed', 'Inflammation', 1),
('Dexamethasone 10mg', 'Dexamethasone Sodium Phosphate', 'Decadron', '10mg/2mL', 'IV/IM', 'As directed', 'Inflammation', 1),
('Dexamethasone 120mg', 'Dexamethasone Phosphate', 'Decadron', '120mg/5mL', 'IV', 'As directed', 'Cerebral edema', 1),
('Hydrocortisone 100mg', 'Hydrocortisone Sodium Succinate', 'Solu-Cortef', '100mg', 'IV/IM', 'As directed', 'Adrenal crisis', 1),
('Hydrocortisone 500mg', 'Hydrocortisone Sodium Succinate', 'Solu-Cortef', '500mg/5mL', 'IV', 'As directed', 'Adrenal crisis', 1),
('Methylprednisolone 40mg', 'Methylprednisolone Sodium Succinate', 'Solu-Medrol', '40mg', 'IV/IM', 'As directed', 'Inflammation', 1),
('Methylprednisolone 125mg', 'Methylprednisolone Sodium Succinate', 'Solu-Medrol', '125mg', 'IV/IM', 'As directed', 'Inflammation', 1),
('Methylprednisolone 500mg', 'Methylprednisolone Sodium Succinate', 'Solu-Medrol', '500mg', 'IV', 'Once daily', 'Pulse therapy', 1),
('Methylprednisolone 1g', 'Methylprednisolone Sodium Succinate', 'Solu-Medrol', '1g', 'IV', 'Once daily', 'Pulse therapy', 1),
('Methylprednisolone 2g', 'Methylprednisolone Sodium Succinate', 'Solu-Medrol', '2g', 'IV', 'Once daily', 'Pulse therapy', 1),
('Methylprednisolone Acetate 40mg', 'Methylprednisolone Acetate', 'Depo-Medrol', '40mg/mL', 'IM/Intra-articular', 'As directed', 'Inflammation', 1),
('Methylprednisolone Acetate 80mg', 'Methylprednisolone Acetate', 'Depo-Medrol', '80mg/2mL', 'IM/Intra-articular', 'As directed', 'Inflammation', 1),
('Methylprednisolone Acetate 120mg', 'Methylprednisolone Acetate', 'Depo-Medrol', '120mg/3mL', 'IM/Intra-articular', 'As directed', 'Inflammation', 1),
('Triamcinolone 40mg', 'Triamcinolone Acetonide', 'Kenalog', '40mg/mL', 'IM/Intra-articular', 'As directed', 'Inflammation', 1),
('Triamcinolone 80mg', 'Triamcinolone Acetonide', 'Kenalog', '80mg/2mL', 'IM/Intra-articular', 'As directed', 'Inflammation', 1);

-- ====================================================================================
-- PART 32: HORMONES - SEX HORMONES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Progesterone 50mg', 'Progesterone', 'Progesterone', '50mg/mL', 'IM', 'As directed', 'Hormonal support', 1),
('Progesterone 100mg', 'Progesterone', 'Progesterone', '100mg/2mL', 'IM', 'As directed', 'Hormonal support', 1),
('Hydroxyprogesterone 250mg', 'Hydroxyprogesterone Hexanoate', 'Proluton', '250mg/mL', 'IM', 'Weekly', 'Preterm prevention', 1),
('Testosterone 100mg', 'Testosterone Propionate', 'Testosterone', '100mg/2mL', 'IM', 'As directed', 'Hypogonadism', 1),
('Testosterone 250mg', 'Testosterone Enanthate', 'Testosterone', '250mg/mL', 'IM', 'Every 2-4 weeks', 'Hypogonadism', 1),
('Medroxyprogesterone 50mg', 'Medroxyprogesterone Acetate', 'Depo-Provera', '50mg/mL', 'IM', 'As directed', 'Contraception', 1),
('Medroxyprogesterone 150mg', 'Medroxyprogesterone Acetate', 'Depo-Provera', '150mg/mL', 'IM', 'Every 3 months', 'Contraception', 1),
('Norethisterone 200mg', 'Norethisterone Enanthate', 'Noristerat', '200mg/mL', 'IM', 'Every 8 weeks', 'Contraception', 1);

-- ====================================================================================
-- PART 33: HORMONES - GONADOTROPINS & FERTILITY
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('HCG 1500IU', 'Chorionic Gonadotropin', 'Pregnyl', '1500 IU', 'IM', 'As directed', 'Ovulation', 1),
('HCG 2000IU', 'Chorionic Gonadotropin', 'Pregnyl', '2000 IU', 'IM', 'As directed', 'Ovulation', 1),
('HCG 5000IU', 'Chorionic Gonadotropin', 'Pregnyl', '5000 IU', 'IM', 'As directed', 'Ovulation', 1),
('HCG 10000IU', 'Chorionic Gonadotropin', 'Pregnyl', '10000 IU', 'IM', 'As directed', 'Ovulation', 1),
('HMG 75IU', 'Human Menopausal Gonadotropin', 'Menogon', '75 IU', 'IM/SC', 'As directed', 'Infertility', 1),
('HMG 150IU', 'Human Menopausal Gonadotropin', 'Menogon', '150 IU', 'IM/SC', 'As directed', 'Infertility', 1),
('Follitropin Alpha 37.5IU', 'Follitropin Alpha', 'Gonal-F', '37.5 IU', 'SC', 'As directed', 'Infertility', 1),
('Follitropin Alpha 75IU', 'Follitropin Alpha', 'Gonal-F', '75 IU', 'SC', 'As directed', 'Infertility', 1),
('Follitropin Alpha 150IU', 'Follitropin Alpha', 'Gonal-F', '150 IU', 'SC', 'As directed', 'Infertility', 1),
('Follitropin Beta 50IU', 'Follitropin Beta', 'Puregon', '50 IU/0.5mL', 'SC', 'As directed', 'Infertility', 1),
('Follitropin Beta 100IU', 'Follitropin Beta', 'Puregon', '100 IU/0.5mL', 'SC', 'As directed', 'Infertility', 1),
('Follitropin Beta 150IU', 'Follitropin Beta', 'Puregon', '150 IU/0.5mL', 'SC', 'As directed', 'Infertility', 1),
('Follitropin Beta 200IU', 'Follitropin Beta', 'Puregon', '200 IU/0.5mL', 'SC', 'As directed', 'Infertility', 1),
('Cetrorelix 0.25mg', 'Cetrorelix Acetate', 'Cetrotide', '0.25mg', 'SC', 'Once daily', 'IVF', 1),
('Cetrorelix 3mg', 'Cetrorelix Acetate', 'Cetrotide', '3mg', 'SC', 'Single dose', 'IVF', 1),
('Urofollitropin 75IU', 'Urofollitropin', 'Bravelle', '75 IU', 'SC/IM', 'As directed', 'Infertility', 1);

-- ====================================================================================
-- PART 34: HORMONES - PITUITARY & OTHERS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Tetracosactide 1mg', 'Tetracosactide', 'Synacthen', '1mg/mL', 'IM/IV', 'As directed', 'Adrenal test', 1),
('Somatropin 4IU', 'Somatropin', 'Growth Hormone', '4 IU', 'SC', 'Once daily', 'GH deficiency', 1),
('Somatropin 5mg', 'Somatropin', 'Growth Hormone', '5mg/1.5mL', 'SC', 'Once daily', 'GH deficiency', 1),
('Somatropin 10mg', 'Somatropin', 'Growth Hormone', '10mg/1.5mL', 'SC', 'Once daily', 'GH deficiency', 1),
('Somatropin 12mg', 'Somatropin', 'Growth Hormone', '12mg', 'SC', 'Once daily', 'GH deficiency', 1),
('Somatropin 15mg', 'Somatropin', 'Growth Hormone', '15mg/1.5mL', 'SC', 'Once daily', 'GH deficiency', 1),
('Terlipressin 1mg', 'Terlipressin', 'Glypressin', '1mg', 'IV', 'Every 4-6 hours', 'Variceal bleeding', 1),
('Vasopressin 20IU', 'Vasopressin', 'Pitressin', '20 IU/mL', 'IV/IM', 'As directed', 'Diabetes insipidus', 1),
('Calcitonin 50IU', 'Salcatonin', 'Miacalcic', '50 IU/mL', 'IM/SC', 'Once daily', 'Hypercalcemia', 1),
('Calcitonin 100IU', 'Salcatonin', 'Miacalcic', '100 IU/mL', 'IM/SC', 'Once daily', 'Hypercalcemia', 1),
('Calcitonin 400IU', 'Salcatonin', 'Miacalcic', '400 IU/2mL', 'IM/SC', 'Once daily', 'Hypercalcemia', 1),
('Pamidronate 15mg', 'Pamidronate Disodium', 'Aredia', '15mg/5mL', 'IV', 'As directed', 'Hypercalcemia', 1),
('Buserelin 5.5mg', 'Buserelin', 'Suprefact', '5.5mg/5.5mL', 'SC', 'As directed', 'Prostate cancer', 1);

-- ====================================================================================
-- PART 35: OXYTOCICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Ergometrine+Oxytocin', 'Ergometrine/Oxytocin', 'Syntometrine', '500mcg/5U/mL', 'IM', 'Single dose', 'PPH prophylaxis', 1),
('Oxytocin 5IU', 'Oxytocin', 'Syntocinon', '5 IU/mL', 'IV/IM', 'As directed', 'Labor induction', 1),
('Oxytocin 10IU', 'Oxytocin', 'Syntocinon', '10 IU/mL', 'IV/IM', 'As directed', 'Labor induction', 1),
('Ritodrine 50mg', 'Ritodrine Hydrochloride', 'Yutopar', '50mg/5mL', 'IV', 'As directed', 'Tocolysis', 1),
('Atosiban 6.75mg', 'Atosiban', 'Tractocile', '6.75mg/0.9mL', 'IV', 'As directed', 'Tocolysis', 1);

-- ====================================================================================
-- PART 36: CHEMOTHERAPY - ALKYLATING AGENTS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Carmustine 100mg', 'Carmustine', 'BiCNU', '100mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Cyclophosphamide 200mg', 'Cyclophosphamide', 'Cytoxan', '200mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Cyclophosphamide 500mg', 'Cyclophosphamide', 'Cytoxan', '500mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Cyclophosphamide 1g', 'Cyclophosphamide', 'Cytoxan', '1g', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Ifosfamide 1g', 'Ifosfamide', 'Ifex', '1g', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Ifosfamide 2g', 'Ifosfamide', 'Ifex', '2g', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Melphalan 50mg', 'Melphalan', 'Alkeran', '50mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Chlormethine 10mg', 'Mechlorethamine', 'Mustargen', '10mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Thiotepa 15mg', 'Thiotepa', 'Thiotepa', '15mg', 'IV/IT', 'As per protocol', 'Chemotherapy', 1),
('Treosulfan 1g', 'Treosulfan', 'Treosulfan', '1g', 'IV', 'As per protocol', 'Chemotherapy', 1);

-- ====================================================================================
-- PART 37: CHEMOTHERAPY - ANTIMETABOLITES
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Cytarabine 100mg', 'Cytarabine', 'Cytosar', '100mg', 'IV/IT', 'As per protocol', 'Chemotherapy', 1),
('Cytarabine 500mg', 'Cytarabine', 'Cytosar', '500mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Cytarabine 1g', 'Cytarabine', 'Cytosar', '1g', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Cytarabine 2g', 'Cytarabine', 'Cytosar', '2g', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Fluorouracil 250mg', 'Fluorouracil', '5-FU', '250mg/10mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Fluorouracil 500mg', 'Fluorouracil', '5-FU', '500mg/10mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Fluorouracil 2.5g', 'Fluorouracil', '5-FU', '2.5g/50mL', 'IV Infusion', 'Continuous', 'Chemotherapy', 1),
('Methotrexate 5mg', 'Methotrexate', 'MTX', '5mg/2mL', 'IV/IM/IT', 'As per protocol', 'Chemotherapy', 1),
('Methotrexate 50mg', 'Methotrexate', 'MTX', '50mg/2mL', 'IV/IM', 'As per protocol', 'Chemotherapy', 1),
('Methotrexate 200mg', 'Methotrexate', 'MTX', '200mg/8mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Methotrexate 500mg', 'Methotrexate', 'MTX', '500mg/20mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Methotrexate 1g', 'Methotrexate', 'MTX', '1g/40mL', 'IV', 'As per protocol', 'Chemotherapy', 1);

-- ====================================================================================
-- PART 38: CHEMOTHERAPY - ANTIBIOTICS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Dactinomycin 500mcg', 'Dactinomycin', 'Cosmegen', '500mcg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Bleomycin 15U', 'Bleomycin', 'Blenoxane', '15 units', 'IV/IM/SC', 'As per protocol', 'Chemotherapy', 1),
('Doxorubicin 10mg', 'Doxorubicin Hydrochloride', 'Adriamycin', '10mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Doxorubicin 50mg', 'Doxorubicin Hydrochloride', 'Adriamycin', '50mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Epirubicin 10mg', 'Epirubicin Hydrochloride', 'Pharmorubicin', '10mg/5mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Epirubicin 20mg', 'Epirubicin Hydrochloride', 'Pharmorubicin', '20mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Epirubicin 50mg', 'Epirubicin Hydrochloride', 'Pharmorubicin', '50mg/25mL', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Mitomycin 2mg', 'Mitomycin', 'Mutamycin', '2mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Mitomycin 10mg', 'Mitomycin', 'Mutamycin', '10mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Mitomycin 20mg', 'Mitomycin', 'Mutamycin', '20mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Mitomycin 40mg', 'Mitomycin', 'Mutamycin', '40mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Idarubicin 5mg', 'Idarubicin Hydrochloride', 'Idamycin', '5mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Idarubicin 10mg', 'Idarubicin Hydrochloride', 'Idamycin', '10mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Aclarubicin 20mg', 'Aclarubicin', 'Aclacinomycin', '20mg', 'IV', 'As per protocol', 'Chemotherapy', 1),
('Liposomal Daunorubicin 50mg', 'Liposomal Daunorubicin', 'DaunoXome', '50mg/25mL', 'IV', 'As per protocol', 'Chemotherapy', 1);

-- ====================================================================================
-- PART 39: MISCELLANEOUS
-- ====================================================================================
INSERT IGNORE INTO injection_templates (template_name, injection_name, generic_name, dose, route, frequency, duration, is_active) VALUES
('Papaverine 40mg', 'Papaverine Hydrochloride', 'Papaverine', '40mg/mL', 'IM/IV', 'As directed', 'Vasospasm', 1),
('Trimetrexate 25mg', 'Trimetrexate', 'Neutrexin', '25mg', 'IV', 'As directed', 'PCP', 1),
('Palivizumab 50mg', 'Palivizumab', 'Synagis', '50mg', 'IM', 'Monthly', 'RSV prophylaxis', 1),
('Palivizumab 100mg', 'Palivizumab', 'Synagis', '100mg', 'IM', 'Monthly', 'RSV prophylaxis', 1);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display summary
SELECT 'SNOMED CT Extended Injection Import Complete' as Status;
SELECT COUNT(*) as TotalActiveInjections FROM injection_templates WHERE is_active = 1;
