import { describe, it, expect } from 'vitest';
import { CalibrationGuideRegistry } from './calibration-guide-registry.js';

describe('CalibrationGuideRegistry', () => {
  const registry = new CalibrationGuideRegistry();

  describe('getFullGuide', () => {
    it('returns the full SOC 2 calibration guide', () => {
      const guide = registry.getFullGuide('soc2');
      expect(guide).toContain('SOC 2 Controls Calibration Guide');
      expect(guide).toContain('SOC-001');
      expect(guide).toContain('SOC-002');
      expect(guide).toContain('SOC-003');
      expect(guide).toContain('SOC-004');
      expect(guide).toContain('SOC-005');
    });

    it('returns the full WAFR calibration guide', () => {
      const guide = registry.getFullGuide('wafr');
      expect(guide).toContain('Well-Architected Framework Review');
      expect(guide).toContain('WAFR-FTR-001');
      expect(guide).toContain('WAFR-FTR-002');
      expect(guide).toContain('WAFR-FTR-003');
      expect(guide).toContain('WAFR-FTR-004');
    });

    it('throws an error for an invalid report type', () => {
      expect(() => registry.getFullGuide('invalid' as any)).toThrow(
        'Invalid report type: "invalid". Valid report types are: "soc2", "wafr"'
      );
    });
  });

  describe('getSection', () => {
    it('returns the SOC-001 section from the SOC 2 guide', () => {
      const section = registry.getSection('soc2', 'SOC-001');
      expect(section).toContain('SOC-001');
      expect(section).toContain('SOC 2 Type II Report is Active');
      // Should not contain other control headings
      expect(section).not.toContain('## SOC-002');
      expect(section).not.toContain('## SOC-003');
    });

    it('returns the SOC-005 section from the SOC 2 guide', () => {
      const section = registry.getSection('soc2', 'SOC-005');
      expect(section).toContain('SOC-005');
      expect(section).toContain('Security and Availability Trust Centers Present');
      expect(section).not.toContain('## SOC-001');
      expect(section).not.toContain('## SOC-004');
    });

    it('returns the WAFR-FTR-001 section from the WAFR guide', () => {
      const section = registry.getSection('wafr', 'WAFR-FTR-001');
      expect(section).toContain('WAFR-FTR-001');
      expect(section).toContain('12 Months');
      expect(section).not.toContain('## WAFR-FTR-002');
      expect(section).not.toContain('## WAFR-FTR-003');
    });

    it('returns the WAFR-FTR-004 section from the WAFR guide', () => {
      const section = registry.getSection('wafr', 'WAFR-FTR-004');
      expect(section).toContain('WAFR-FTR-004');
      expect(section).toContain('Reliability Pillar');
      expect(section).not.toContain('## WAFR-FTR-001');
      expect(section).not.toContain('## WAFR-FTR-002');
    });

    it('returns the full guide when control ID is not found', () => {
      const fullGuide = registry.getFullGuide('soc2');
      const section = registry.getSection('soc2', 'NONEXISTENT-999');
      expect(section).toBe(fullGuide);
    });

    it('throws an error for an invalid report type', () => {
      expect(() => registry.getSection('invalid' as any, 'SOC-001')).toThrow(
        'Invalid report type: "invalid". Valid report types are: "soc2", "wafr"'
      );
    });
  });
});
