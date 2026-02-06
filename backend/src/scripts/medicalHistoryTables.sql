-- Medical History Tables Migration
-- Creates tables for dr.eka.care style medical history in prescription pad

-- =====================================================
-- 1. Master list of medical history options (quick toggles)
-- =====================================================
CREATE TABLE IF NOT EXISTS medical_history_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condition_name VARCHAR(255) NOT NULL,
    condition_code VARCHAR(50) NULL,
    category ENUM('chronic', 'lifestyle', 'allergy', 'family', 'other') DEFAULT 'chronic',
    display_order INT DEFAULT 0,
    is_default BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_display_order (display_order),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 2. Doctor's configuration for which options to show
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_medical_history_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    option_id INT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_doctor_option (doctor_id, option_id),
    FOREIGN KEY (option_id) REFERENCES medical_history_options(id) ON DELETE CASCADE,
    INDEX idx_doctor (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 3. Patient's medical history values (Y/N toggles with since dates)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_medical_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    option_id INT NOT NULL,
    condition_name VARCHAR(255) NULL,
    has_condition BOOLEAN DEFAULT FALSE,
    since_date VARCHAR(50) NULL,
    notes TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_patient_option (patient_id, option_id),
    INDEX idx_patient (patient_id),
    INDEX idx_has_condition (has_condition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 4. Patient chronic conditions (existing conditions section)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_chronic_conditions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    clinic_id INT DEFAULT 1,
    condition_name VARCHAR(255) NOT NULL,
    icd_code VARCHAR(20) NULL,
    status ENUM('Active', 'Resolved', 'In Remission') DEFAULT 'Active',
    start_date DATE NULL,
    end_date DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient (patient_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 5. Patient surgical history
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_surgical_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    surgery_name VARCHAR(255) NOT NULL,
    surgery_date DATE NULL,
    hospital VARCHAR(255) NULL,
    surgeon VARCHAR(255) NULL,
    complications TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient (patient_id),
    INDEX idx_surgery_date (surgery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Insert default medical history options (common conditions)
-- =====================================================
INSERT IGNORE INTO medical_history_options (condition_name, condition_code, category, display_order, is_default) VALUES
-- Common chronic conditions
('Diabetes mellitus', 'E11', 'chronic', 1, TRUE),
('Hypertension', 'I10', 'chronic', 2, TRUE),
('Hypothyroidism', 'E03', 'chronic', 3, TRUE),
('Hyperthyroidism', 'E05', 'chronic', 4, TRUE),
('Asthma', 'J45', 'chronic', 5, TRUE),
('COPD', 'J44', 'chronic', 6, TRUE),
('Coronary Artery Disease', 'I25', 'chronic', 7, TRUE),
('Heart Failure', 'I50', 'chronic', 8, TRUE),
('Chronic Kidney Disease', 'N18', 'chronic', 9, TRUE),
('Epilepsy', 'G40', 'chronic', 10, TRUE),
('Tuberculosis', 'A15', 'chronic', 11, TRUE),
('HIV/AIDS', 'B20', 'chronic', 12, TRUE),
('Hepatitis B', 'B18.1', 'chronic', 13, TRUE),
('Hepatitis C', 'B18.2', 'chronic', 14, TRUE),
('Rheumatoid Arthritis', 'M06', 'chronic', 15, TRUE),
('Osteoarthritis', 'M15', 'chronic', 16, TRUE),
('Depression', 'F32', 'chronic', 17, TRUE),
('Anxiety Disorder', 'F41', 'chronic', 18, TRUE),
('Migraine', 'G43', 'chronic', 19, TRUE),
('GERD', 'K21', 'chronic', 20, TRUE),

-- Lifestyle factors
('Smoker', NULL, 'lifestyle', 21, TRUE),
('Alcohol Use', NULL, 'lifestyle', 22, TRUE),
('Tobacco Chewer', NULL, 'lifestyle', 23, TRUE),
('Sedentary Lifestyle', NULL, 'lifestyle', 24, TRUE),

-- Family history markers
('Family H/O Diabetes', NULL, 'family', 25, TRUE),
('Family H/O Hypertension', NULL, 'family', 26, TRUE),
('Family H/O Heart Disease', NULL, 'family', 27, TRUE),
('Family H/O Cancer', NULL, 'family', 28, TRUE),
('Family H/O Stroke', NULL, 'family', 29, TRUE);

SELECT CONCAT('Inserted ', ROW_COUNT(), ' default medical history options') AS status;
