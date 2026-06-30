import { describe, it, expect, beforeAll } from 'vitest';
import { ControlRegistry } from './control-registry.js';

describe('ControlRegistry', () => {
  let registry: ControlRegistry;

  beforeAll(() => {
    registry = new ControlRegistry();
  });

  describe('getControls', () => {
    it('returns all 5 SOC 2 controls', () => {
      const controls = registry.getControls('soc2');
      expect(controls).toHaveLength(5);
      const ids = controls.map(c => c.control_id);
      expect(ids).toEqual(['SOC-001', 'SOC-002', 'SOC-003', 'SOC-004', 'SOC-005']);
    });

    it('returns all 6 WAFR controls', () => {
      const controls = registry.getControls('wafr');
      expect(controls).toHaveLength(6);
      const ids = controls.map(c => c.control_id);
      expect(ids).toEqual(['WAFR-FTR-001', 'WAFR-FTR-002', 'WAFR-FTR-003', 'WAFR-FTR-004', 'WAFR-FTR-005', 'WAFR-FTR-006']);
    });

    it('throws error for invalid report type', () => {
      expect(() => registry.getControls('invalid' as any)).toThrow(
        'Invalid report type "invalid". Valid report types: soc2, wafr'
      );
    });

    it('each SOC 2 control has required fields populated', () => {
      const controls = registry.getControls('soc2');
      for (const control of controls) {
        expect(control.control_id).toBeTruthy();
        expect(control.title).toBeTruthy();
        expect(control.description).toBeTruthy();
        expect(control.criteria).toBeTruthy();
      }
    });

    it('each WAFR control has required fields populated', () => {
      const controls = registry.getControls('wafr');
      for (const control of controls) {
        expect(control.control_id).toBeTruthy();
        expect(control.title).toBeTruthy();
        expect(control.description).toBeTruthy();
        expect(control.criteria).toBeTruthy();
      }
    });
  });

  describe('getControl', () => {
    it('returns a specific SOC 2 control by ID', () => {
      const control = registry.getControl('soc2', 'SOC-001');
      expect(control.control_id).toBe('SOC-001');
      expect(control.title).toBe('SOC 2 Type II Report Must Be Active');
    });

    it('returns a specific WAFR control by ID', () => {
      const control = registry.getControl('wafr', 'WAFR-FTR-001');
      expect(control.control_id).toBe('WAFR-FTR-001');
      expect(control.title).toBe('WAFR Completed Within 12 Months');
    });

    it('throws error for non-existent control ID', () => {
      expect(() => registry.getControl('soc2', 'SOC-999')).toThrow(
        'Control ID "SOC-999" not found for report type "soc2"'
      );
    });

    it('error for non-existent control ID lists valid IDs', () => {
      try {
        registry.getControl('soc2', 'INVALID');
      } catch (e: any) {
        expect(e.message).toContain('SOC-001');
        expect(e.message).toContain('SOC-002');
        expect(e.message).toContain('SOC-003');
        expect(e.message).toContain('SOC-004');
        expect(e.message).toContain('SOC-005');
      }
    });

    it('error for non-existent WAFR control ID lists valid WAFR IDs', () => {
      try {
        registry.getControl('wafr', 'INVALID');
      } catch (e: any) {
        expect(e.message).toContain('WAFR-FTR-001');
        expect(e.message).toContain('WAFR-FTR-002');
        expect(e.message).toContain('WAFR-FTR-003');
        expect(e.message).toContain('WAFR-FTR-004');
        expect(e.message).toContain('WAFR-FTR-005');
        expect(e.message).toContain('WAFR-FTR-006');
      }
    });

    it('throws error for invalid report type', () => {
      expect(() => registry.getControl('bad' as any, 'SOC-001')).toThrow(
        'Invalid report type "bad". Valid report types: soc2, wafr'
      );
    });
  });

  describe('getControlIds', () => {
    it('returns SOC 2 control IDs', () => {
      const ids = registry.getControlIds('soc2');
      expect(ids).toEqual(['SOC-001', 'SOC-002', 'SOC-003', 'SOC-004', 'SOC-005']);
    });

    it('returns WAFR control IDs', () => {
      const ids = registry.getControlIds('wafr');
      expect(ids).toEqual(['WAFR-FTR-001', 'WAFR-FTR-002', 'WAFR-FTR-003', 'WAFR-FTR-004', 'WAFR-FTR-005', 'WAFR-FTR-006']);
    });

    it('throws error for invalid report type', () => {
      expect(() => registry.getControlIds('nope' as any)).toThrow(
        'Invalid report type "nope". Valid report types: soc2, wafr'
      );
    });
  });

  describe('parsed control content', () => {
    it('SOC-001 has correct title about active report', () => {
      const control = registry.getControl('soc2', 'SOC-001');
      expect(control.title).toContain('Active');
    });

    it('SOC-005 criteria mentions Security and Availability', () => {
      const control = registry.getControl('soc2', 'SOC-005');
      expect(control.criteria).toContain('Security');
      expect(control.criteria).toContain('Availability');
    });

    it('WAFR-FTR-002 criteria mentions HRIs', () => {
      const control = registry.getControl('wafr', 'WAFR-FTR-002');
      expect(control.criteria).toContain('HRIs');
    });
  });
});
