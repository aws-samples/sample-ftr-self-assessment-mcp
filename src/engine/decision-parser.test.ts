import { describe, it, expect } from 'vitest';
import { parseDecision } from './decision-parser.js';

describe('Decision Parser', () => {
  describe('parsing PASS decisions', () => {
    it('parses a standard PASS response with reason', () => {
      const response = `Decision: PASS\nReason: The report meets all criteria for this control.`;
      const result = parseDecision(response, 'SOC-001');

      expect(result.control_id).toBe('SOC-001');
      expect(result.decision).toBe('PASS');
      expect(result.reason).toBe('The report meets all criteria for this control.');
    });

    it('parses PASS with case-insensitive decision value', () => {
      const response = `Decision: pass\nReason: All good.`;
      const result = parseDecision(response, 'WAFR-FTR-001');

      expect(result.decision).toBe('PASS');
      expect(result.reason).toBe('All good.');
    });

    it('parses PASS with mixed case decision value', () => {
      const response = `Decision: Pass\nReason: Criteria met.`;
      const result = parseDecision(response, 'SOC-002');

      expect(result.decision).toBe('PASS');
      expect(result.reason).toBe('Criteria met.');
    });
  });

  describe('parsing FAIL decisions', () => {
    it('parses a standard FAIL response with reason', () => {
      const response = `Decision: FAIL\nReason: The report does not include evidence of annual review.`;
      const result = parseDecision(response, 'SOC-003');

      expect(result.control_id).toBe('SOC-003');
      expect(result.decision).toBe('FAIL');
      expect(result.reason).toBe('The report does not include evidence of annual review.');
    });

    it('parses FAIL with case-insensitive decision value', () => {
      const response = `Decision: fail\nReason: Missing required documentation.`;
      const result = parseDecision(response, 'WAFR-FTR-002');

      expect(result.decision).toBe('FAIL');
      expect(result.reason).toBe('Missing required documentation.');
    });
  });

  describe('multi-line reason extraction', () => {
    it('extracts multi-line reason text', () => {
      const response = `Decision: PASS\nReason: The report demonstrates compliance.\nIt includes all required sections.\nEvidence is sufficient.`;
      const result = parseDecision(response, 'SOC-004');

      expect(result.decision).toBe('PASS');
      expect(result.reason).toBe(
        'The report demonstrates compliance.\nIt includes all required sections.\nEvidence is sufficient.'
      );
    });

    it('handles reason with extra whitespace', () => {
      const response = `Decision: FAIL\nReason:   The report is missing key elements.  `;
      const result = parseDecision(response, 'SOC-005');

      expect(result.decision).toBe('FAIL');
      expect(result.reason).toBe('The report is missing key elements.');
    });
  });

  describe('reason truncation', () => {
    it('truncates reason to 2000 characters', () => {
      const longReason = 'A'.repeat(3000);
      const response = `Decision: PASS\nReason: ${longReason}`;
      const result = parseDecision(response, 'SOC-001');

      expect(result.decision).toBe('PASS');
      expect(result.reason.length).toBe(2000);
    });

    it('does not truncate reason at exactly 2000 characters', () => {
      const exactReason = 'B'.repeat(2000);
      const response = `Decision: FAIL\nReason: ${exactReason}`;
      const result = parseDecision(response, 'SOC-002');

      expect(result.reason.length).toBe(2000);
    });

    it('does not truncate reason under 2000 characters', () => {
      const shortReason = 'C'.repeat(500);
      const response = `Decision: PASS\nReason: ${shortReason}`;
      const result = parseDecision(response, 'SOC-003');

      expect(result.reason.length).toBe(500);
    });
  });

  describe('ERROR handling for unparseable responses', () => {
    it('returns ERROR when no Decision marker is found', () => {
      const response = `The report looks good overall but I cannot determine a clear pass or fail.`;
      const result = parseDecision(response, 'SOC-001');

      expect(result.control_id).toBe('SOC-001');
      expect(result.decision).toBe('ERROR');
      expect(result.reason).toContain('Unable to parse decision');
    });

    it('returns ERROR for empty response', () => {
      const result = parseDecision('', 'WAFR-FTR-003');

      expect(result.decision).toBe('ERROR');
      expect(result.reason).toContain('Unable to parse decision');
    });

    it('returns ERROR when Decision has invalid value', () => {
      const response = `Decision: MAYBE\nReason: Not sure about this one.`;
      const result = parseDecision(response, 'SOC-004');

      expect(result.decision).toBe('ERROR');
      expect(result.reason).toContain('Unable to parse decision');
    });
  });

  describe('response with preamble text before Decision', () => {
    it('parses decision when preceded by analysis text', () => {
      const response = `After reviewing the document, I found that the SOC 2 report covers the required period.\n\nDecision: PASS\nReason: The report covers a 12-month period ending within the last 18 months.`;
      const result = parseDecision(response, 'SOC-001');

      expect(result.decision).toBe('PASS');
      expect(result.reason).toBe('The report covers a 12-month period ending within the last 18 months.');
    });
  });

  describe('response without explicit Reason marker', () => {
    it('uses full response as reason when no Reason: marker exists', () => {
      const response = `Some analysis here.\n\nDecision: FAIL`;
      const result = parseDecision(response, 'SOC-002');

      expect(result.decision).toBe('FAIL');
      expect(result.reason).toBe('Some analysis here.\n\nDecision: FAIL');
    });
  });
});
