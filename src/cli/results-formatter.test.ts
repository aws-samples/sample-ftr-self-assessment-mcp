import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatResults } from './results-formatter.js';
import { EvaluateSubmissionOutput } from '../types.js';

// Force chalk to output colors in the test environment
process.env.FORCE_COLOR = '3';

/**
 * Strip ANSI escape codes from a string for plain-text assertions.
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

describe('Results Formatter', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  function getCapturedOutput(): string[] {
    return consoleSpy.mock.calls.map((call) => String(call[0] ?? ''));
  }

  function getCapturedOutputPlain(): string[] {
    return getCapturedOutput().map(stripAnsi);
  }

  const baseOutput: EvaluateSubmissionOutput = {
    report_type: 'soc2',
    file_path: './reports/test-report.pdf',
    overall_decision: 'PASS',
    summary: { passed: 3, failed: 1, errored: 0, total: 4 },
    results: [
      { control_id: 'SOC-001', decision: 'PASS', reason: 'Adequate controls in place.' },
      { control_id: 'SOC-002', decision: 'PASS', reason: 'Change management documented.' },
      { control_id: 'SOC-003', decision: 'FAIL', reason: 'Missing monitoring evidence.' },
      { control_id: 'SOC-004', decision: 'PASS', reason: 'Encryption properly configured.' },
    ],
  };

  describe('Property 4: Decision-to-color mapping', () => {
    it('should format PASS results with green color', async () => {
      const passOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'PASS',
        summary: { passed: 1, failed: 0, errored: 0, total: 1 },
        results: [{ control_id: 'SOC-001', decision: 'PASS', reason: 'All good.' }],
      };

      await formatResults(passOutput);

      const rawOutput = getCapturedOutput().join('\n');
      // Green ANSI code: \x1B[32m
      expect(rawOutput).toContain('\x1B[32m');

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('PASS');
      expect(plainOutput).toContain('SOC-001');
    });

    it('should format FAIL results with red color', async () => {
      const failOutput: EvaluateSubmissionOutput = {
        report_type: 'wafr',
        file_path: './test.pdf',
        overall_decision: 'FAIL',
        summary: { passed: 0, failed: 1, errored: 0, total: 1 },
        results: [{ control_id: 'WAFR-SEC-01', decision: 'FAIL', reason: 'Insufficient controls.' }],
      };

      await formatResults(failOutput);

      const rawOutput = getCapturedOutput().join('\n');
      // Red ANSI code: \x1B[31m
      expect(rawOutput).toContain('\x1B[31m');

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('FAIL');
      expect(plainOutput).toContain('WAFR-SEC-01');
    });

    it('should format ERROR results with yellow color', async () => {
      const errorOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'FAIL',
        summary: { passed: 0, failed: 0, errored: 1, total: 1 },
        results: [{ control_id: 'SOC-005', decision: 'ERROR', reason: 'Bedrock timeout.' }],
      };

      await formatResults(errorOutput);

      const rawOutput = getCapturedOutput().join('\n');
      // Yellow ANSI code: \x1B[33m
      expect(rawOutput).toContain('\x1B[33m');

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('ERROR');
      expect(plainOutput).toContain('SOC-005');
    });
  });

  describe('Property 5: Results formatting completeness', () => {
    it('should display the overall decision', async () => {
      await formatResults(baseOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('PASS');
      expect(plainOutput).toContain('Overall Decision');
    });

    it('should display summary counts where passed + failed + errored === total', async () => {
      await formatResults(baseOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('3 passed');
      expect(plainOutput).toContain('1 failed');
      expect(plainOutput).toContain('0 errors');
      expect(plainOutput).toContain('4 total');
    });

    it('should display each control result with control_id, decision, and reason', async () => {
      await formatResults(baseOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');

      // Each control_id should appear
      expect(plainOutput).toContain('SOC-001');
      expect(plainOutput).toContain('SOC-002');
      expect(plainOutput).toContain('SOC-003');
      expect(plainOutput).toContain('SOC-004');

      // Each decision should appear
      expect(plainOutput).toContain('PASS');
      expect(plainOutput).toContain('FAIL');

      // Each reason should appear
      expect(plainOutput).toContain('Adequate controls in place.');
      expect(plainOutput).toContain('Change management documented.');
      expect(plainOutput).toContain('Missing monitoring evidence.');
      expect(plainOutput).toContain('Encryption properly configured.');
    });

    it('should display the report type', async () => {
      await formatResults(baseOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('SOC 2');
    });

    it('should display the file path', async () => {
      await formatResults(baseOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('./reports/test-report.pdf');
    });

    it('should handle WAFR report type display', async () => {
      const wafrOutput: EvaluateSubmissionOutput = {
        ...baseOutput,
        report_type: 'wafr',
      };

      await formatResults(wafrOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('WAFR');
    });
  });

  describe('Property 6: Reason text line wrapping', () => {
    it('should wrap long reason text so no line exceeds 80 characters', async () => {
      const longReason =
        'This is a very long reason that should be wrapped across multiple lines because it exceeds the maximum line width of eighty characters which is the configured limit for readable output in the terminal.';

      const longReasonOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'FAIL',
        summary: { passed: 0, failed: 1, errored: 0, total: 1 },
        results: [{ control_id: 'SOC-001', decision: 'FAIL', reason: longReason }],
      };

      await formatResults(longReasonOutput);

      const plainLines = getCapturedOutputPlain();
      for (const line of plainLines) {
        expect(line.length).toBeLessThanOrEqual(80);
      }
    });

    it('should preserve the full reason content across wrapped lines', async () => {
      const longReason =
        'The report demonstrates inadequate logical access controls with no evidence of multi-factor authentication, role-based access control, or periodic access reviews being implemented.';

      const longReasonOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'FAIL',
        summary: { passed: 0, failed: 1, errored: 0, total: 1 },
        results: [{ control_id: 'SOC-001', decision: 'FAIL', reason: longReason }],
      };

      await formatResults(longReasonOutput);

      const plainOutput = getCapturedOutputPlain().join(' ');
      // All words from the reason should appear in the output
      const words = longReason.split(/\s+/);
      for (const word of words) {
        expect(plainOutput).toContain(word);
      }
    });

    it('should handle short reason text without wrapping', async () => {
      const shortOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'PASS',
        summary: { passed: 1, failed: 0, errored: 0, total: 1 },
        results: [{ control_id: 'SOC-001', decision: 'PASS', reason: 'OK' }],
      };

      await formatResults(shortOutput);

      const plainLines = getCapturedOutputPlain();
      const reasonLine = plainLines.find((l) => l.includes('Reason:'));
      expect(reasonLine).toBeDefined();
      expect(reasonLine).toContain('OK');
    });

    it('should handle empty reason gracefully', async () => {
      const emptyReasonOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'PASS',
        summary: { passed: 1, failed: 0, errored: 0, total: 1 },
        results: [{ control_id: 'SOC-001', decision: 'PASS', reason: '' }],
      };

      await formatResults(emptyReasonOutput);

      // Should not throw and should still display the control
      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('SOC-001');
    });

    it('should ensure box lines do not exceed 80 characters', async () => {
      await formatResults(baseOutput);

      const plainLines = getCapturedOutputPlain();
      for (const line of plainLines) {
        expect(line.length).toBeLessThanOrEqual(80);
      }
    });
  });

  describe('Summary line generation', () => {
    it('should generate correct summary for all-pass results', async () => {
      const allPassOutput: EvaluateSubmissionOutput = {
        report_type: 'soc2',
        file_path: './test.pdf',
        overall_decision: 'PASS',
        summary: { passed: 5, failed: 0, errored: 0, total: 5 },
        results: [
          { control_id: 'SOC-001', decision: 'PASS', reason: 'Good.' },
          { control_id: 'SOC-002', decision: 'PASS', reason: 'Good.' },
          { control_id: 'SOC-003', decision: 'PASS', reason: 'Good.' },
          { control_id: 'SOC-004', decision: 'PASS', reason: 'Good.' },
          { control_id: 'SOC-005', decision: 'PASS', reason: 'Good.' },
        ],
      };

      await formatResults(allPassOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('5 passed');
      expect(plainOutput).toContain('0 failed');
      expect(plainOutput).toContain('0 errors');
      expect(plainOutput).toContain('5 total');
    });

    it('should generate correct summary for mixed results', async () => {
      const mixedOutput: EvaluateSubmissionOutput = {
        report_type: 'wafr',
        file_path: './test.pdf',
        overall_decision: 'FAIL',
        summary: { passed: 2, failed: 1, errored: 1, total: 4 },
        results: [
          { control_id: 'WAFR-001', decision: 'PASS', reason: 'Good.' },
          { control_id: 'WAFR-002', decision: 'PASS', reason: 'Good.' },
          { control_id: 'WAFR-003', decision: 'FAIL', reason: 'Bad.' },
          { control_id: 'WAFR-004', decision: 'ERROR', reason: 'Timeout.' },
        ],
      };

      await formatResults(mixedOutput);

      const plainOutput = getCapturedOutputPlain().join('\n');
      expect(plainOutput).toContain('2 passed');
      expect(plainOutput).toContain('1 failed');
      expect(plainOutput).toContain('1 errors');
      expect(plainOutput).toContain('4 total');
    });
  });
});
