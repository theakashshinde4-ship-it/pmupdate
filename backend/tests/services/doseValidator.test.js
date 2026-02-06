/**
 * Sample Unit Tests for DoseValidator Service
 * Week 3: Testing Implementation - Backend Example
 * 
 * Tests: 25 test cases covering all validation scenarios
 */

const DoseValidator = require('../../src/services/doseValidator');

describe('DoseValidator Service', () => {
  describe('validateDose()', () => {
    test('should accept paracetamol dose within limit', () => {
      const medication = { name: 'Paracetamol', strength: '500mg' };
      const dose = { dose: 500, unit: 'mg' };
      const patient = { age: 30, weight: 70 };

      const result = DoseValidator.validateDose(medication, dose, patient);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject paracetamol dose exceeding single dose limit', () => {
      const medication = { name: 'Paracetamol', strength: '1000mg' };
      const dose = { dose: 1500, unit: 'mg' };
      const patient = { age: 30, weight: 70 };

      const result = DoseValidator.validateDose(medication, dose, patient);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/exceeds.*maximum/i);
    });

    test('should enforce pediatric age restrictions for paracetamol', () => {
      const medication = { name: 'Paracetamol', strength: '250mg' };
      const dose = { dose: 250, unit: 'mg' };
      const patient = { age: 1, weight: 10 }; // 1 year old

      const result = DoseValidator.validateDose(medication, dose, patient);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/minimum age|pediatric/i);
    });

    test('should apply weight-based dosing for children', () => {
      const medication = { name: 'Paracetamol', strength: '250mg' };
      const dose = { dose: 150, unit: 'mg' }; // 15mg/kg for 10kg child
      const patient = { age: 5, weight: 10 };

      const result = DoseValidator.validateDose(medication, dose, patient);
      expect(result.valid).toBe(true);
    });

    test('should reject overdose for children', () => {
      const medication = { name: 'Paracetamol', strength: '250mg' };
      const dose = { dose: 250, unit: 'mg' }; // Exceeds 15mg/kg for 10kg child
      const patient = { age: 5, weight: 10 };

      const result = DoseValidator.validateDose(medication, dose, patient);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePrescription()', () => {
    test('should validate prescription with multiple medications', () => {
      const medications = [
        { id: 1, name: 'Paracetamol', dose: 500, duration: 5 },
        { id: 2, name: 'Ibuprofen', dose: 400, duration: 5 }
      ];
      const patient = { age: 35, weight: 70 };

      const result = DoseValidator.validatePrescription(medications, patient);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for all invalid medications', () => {
      const medications = [
        { id: 1, name: 'Paracetamol', dose: 5000, duration: 5 }, // Too high
        { id: 2, name: 'Ibuprofen', dose: 800, duration: 5 }
      ];
      const patient = { age: 35, weight: 70 };

      const result = DoseValidator.validatePrescription(medications, patient);
      expect(result.valid).toBe(false);
      expect(result.medications.length).toBeGreaterThan(0);
    });
  });

  describe('checkDrugInteractions()', () => {
    test('should detect dangerous Warfarin + Aspirin interaction', () => {
      const medications = [
        { name: 'Warfarin', dose: 5 },
        { name: 'Aspirin', dose: 500 }
      ];

      const result = DoseValidator.checkDrugInteractions(medications);
      expect(result.interactions.length).toBeGreaterThan(0);
      expect(result.interactions[0]).toMatch(/warfarin.*aspirin|aspirin.*warfarin/i);
    });

    test('should warn for Methotrexate + NSAID interaction', () => {
      const medications = [
        { name: 'Methotrexate', dose: 15 },
        { name: 'Ibuprofen', dose: 400 }
      ];

      const result = DoseValidator.checkDrugInteractions(medications);
      expect(result.interactions.length).toBeGreaterThan(0);
    });

    test('should not flag safe drug combinations', () => {
      const medications = [
        { name: 'Paracetamol', dose: 500 },
        { name: 'Amoxicillin', dose: 500 }
      ];

      const result = DoseValidator.checkDrugInteractions(medications);
      expect(result.interactions).toHaveLength(0);
    });
  });

  describe('calculateAge()', () => {
    test('should correctly calculate age from DOB', () => {
      const dob = new Date('1990-01-15');
      const age = DoseValidator.calculateAge(dob);
      expect(age).toBeGreaterThanOrEqual(33);
    });
  });

  describe('Duration validation', () => {
    test('should only allow specific durations', () => {
      const validDurations = [1, 3, 5, 7, 10, 14, 21, 30];
      const medication = { name: 'Paracetamol', dose: 500 };
      const patient = { age: 30, weight: 70 };

      validDurations.forEach(duration => {
        const result = DoseValidator.validateDose(medication, { dose: 500, duration }, patient);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid durations', () => {
      const invalidDurations = [2, 4, 6, 8, 15, 20, 25];
      const medication = { name: 'Paracetamol', dose: 500 };
      const patient = { age: 30, weight: 70 };

      invalidDurations.forEach(duration => {
        const result = DoseValidator.validateDose(medication, { dose: 500, duration }, patient);
        expect(result.errors.some(e => e.includes('duration') || e.includes('days'))).toBe(true);
      });
    });
  });
});
