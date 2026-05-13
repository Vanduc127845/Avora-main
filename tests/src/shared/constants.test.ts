import { describe, it, expect } from 'vitest';
import { DISABILITY_TYPES, SEVERITY_LEVELS, SKILL_LEVELS } from '@ai4a/shared';

describe('Shared Constants', () => {
  describe('DISABILITY_TYPES', () => {
    it('should have all required disability types', () => {
      const expectedTypes = [
        'motor',
        'visual',
        'auditory',
        'cognitive',
        'speech',
        'chronic_illness',
        'psychiatric',
        'other',
      ];

      expect(DISABILITY_TYPES).toHaveLength(expectedTypes.length);
      expectedTypes.forEach((type) => {
        expect(DISABILITY_TYPES.find((t) => t.value === type)).toBeDefined();
      });
    });

    it('should have label for each type', () => {
      DISABILITY_TYPES.forEach((type) => {
        expect(type.label).toBeTruthy();
        expect(type.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SEVERITY_LEVELS', () => {
    it('should have all severity levels', () => {
      const expectedLevels = ['mild', 'moderate', 'severe', 'profound'];
      expect(SEVERITY_LEVELS).toHaveLength(expectedLevels.length);
    });

    it('should have description for each level', () => {
      SEVERITY_LEVELS.forEach((level) => {
        expect(level.description).toBeTruthy();
      });
    });
  });

  describe('SKILL_LEVELS', () => {
    it('should have 4 skill levels', () => {
      expect(SKILL_LEVELS).toHaveLength(4);
    });

    it('should have correct order', () => {
      const expectedOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
      expectedOrder.forEach((level, index) => {
        expect(SKILL_LEVELS[index].value).toBe(level);
      });
    });
  });
});
