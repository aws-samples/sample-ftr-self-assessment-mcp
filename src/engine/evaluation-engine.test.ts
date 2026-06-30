import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvaluationEngine } from './evaluation-engine.js';
import { PdfParser } from '../parsers/pdf-parser.js';
import { ControlRegistry } from '../registries/control-registry.js';
import { CalibrationGuideRegistry } from '../registries/calibration-guide-registry.js';
import { PromptBuilder } from './prompt-builder.js';
import { BedrockClient } from './bedrock-client.js';
import type { EvaluateSubmissionInput, ControlResult } from '../types.js';

// Mock dependencies
vi.mock('../parsers/pdf-parser.js');
vi.mock('../registries/control-registry.js');
vi.mock('../registries/calibration-guide-registry.js');
vi.mock('./prompt-builder.js');
vi.mock('./bedrock-client.js');

describe('EvaluationEngine', () => {
  let engine: EvaluationEngine;
  let mockPdfParser: { parse: ReturnType<typeof vi.fn> };
  let mockControlRegistry: {
    getControl: ReturnType<typeof vi.fn>;
    getControlIds: ReturnType<typeof vi.fn>;
  };
  let mockCalibrationGuideRegistry: { getSection: ReturnType<typeof vi.fn> };
  let mockPromptBuilder: { build: ReturnType<typeof vi.fn> };
  let mockBedrockClient: { invokeModel: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPdfParser = { parse: vi.fn() };
    mockControlRegistry = {
      getControl: vi.fn(),
      getControlIds: vi.fn(),
    };
    mockCalibrationGuideRegistry = { getSection: vi.fn() };
    mockPromptBuilder = { build: vi.fn() };
    mockBedrockClient = { invokeModel: vi.fn() };

    engine = new EvaluationEngine(
      mockPdfParser as unknown as PdfParser,
      mockControlRegistry as unknown as ControlRegistry,
      mockCalibrationGuideRegistry as unknown as CalibrationGuideRegistry,
      mockPromptBuilder as unknown as PromptBuilder,
      mockBedrockClient as unknown as BedrockClient
    );
  });

  describe('evaluate', () => {
    it('evaluates all SOC 2 controls and returns PASS when all pass', async () => {
      const input: EvaluateSubmissionInput = {
        file_path: '/path/to/report.pdf',
        report_type: 'soc2',
      };

      mockPdfParser.parse.mockResolvedValue({
        text: 'PDF content here',
        char_count: 16,
        page_count: 5,
      });

      mockControlRegistry.getControlIds.mockReturnValue([
        'SOC-001', 'SOC-002', 'SOC-003', 'SOC-004', 'SOC-005',
      ]);

      mockCalibrationGuideRegistry.getSection.mockReturnValue('Calibration guide section');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Built prompt',
        systemPrompt: 'System prompt',
      });
      mockBedrockClient.invokeModel.mockResolvedValue('Decision: PASS\nReason: Meets criteria.');

      const result = await engine.evaluate(input);

      expect(result.report_type).toBe('soc2');
      expect(result.file_path).toBe('/path/to/report.pdf');
      expect(result.overall_decision).toBe('PASS');
      expect(result.results).toHaveLength(5);
      expect(result.summary).toEqual({ passed: 5, failed: 0, errored: 0, total: 5 });
      expect(result.results.every(r => r.decision === 'PASS')).toBe(true);
    });

    it('evaluates all WAFR controls (6 controls)', async () => {
      const input: EvaluateSubmissionInput = {
        file_path: '/path/to/wafr.pdf',
        report_type: 'wafr',
      };

      mockPdfParser.parse.mockResolvedValue({
        text: 'WAFR content',
        char_count: 12,
        page_count: 3,
      });

      mockControlRegistry.getControlIds.mockReturnValue([
        'WAFR-FTR-001', 'WAFR-FTR-002', 'WAFR-FTR-003', 'WAFR-FTR-004',
      ]);

      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide section');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });
      mockBedrockClient.invokeModel.mockResolvedValue('Decision: PASS\nReason: OK.');

      const result = await engine.evaluate(input);

      expect(result.report_type).toBe('wafr');
      expect(result.results).toHaveLength(4);
      expect(result.summary.total).toBe(4);
      expect(result.overall_decision).toBe('PASS');
    });

    it('returns FAIL overall when one control fails', async () => {
      const input: EvaluateSubmissionInput = {
        file_path: '/path/to/report.pdf',
        report_type: 'soc2',
      };

      mockPdfParser.parse.mockResolvedValue({
        text: 'PDF content',
        char_count: 11,
        page_count: 2,
      });

      mockControlRegistry.getControlIds.mockReturnValue([
        'SOC-001', 'SOC-002', 'SOC-003', 'SOC-004', 'SOC-005',
      ]);

      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });

      // SOC-003 fails, rest pass
      mockBedrockClient.invokeModel
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.')
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.')
        .mockResolvedValueOnce('Decision: FAIL\nReason: Missing evidence.')
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.')
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.');

      const result = await engine.evaluate(input);

      expect(result.overall_decision).toBe('FAIL');
      expect(result.summary).toEqual({ passed: 4, failed: 1, errored: 0, total: 5 });
      expect(result.results[2].decision).toBe('FAIL');
      expect(result.results[2].control_id).toBe('SOC-003');
    });

    it('evaluates only a single control when control_id is specified', async () => {
      const input: EvaluateSubmissionInput = {
        file_path: '/path/to/report.pdf',
        report_type: 'soc2',
        control_id: 'SOC-002',
      };

      mockPdfParser.parse.mockResolvedValue({
        text: 'PDF content',
        char_count: 11,
        page_count: 1,
      });

      mockControlRegistry.getControl.mockReturnValue({
        control_id: 'SOC-002',
        title: 'Test Control',
        description: 'Desc',
        criteria: 'Criteria',
        edge_cases: '',
        examples: '',
      });

      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide for SOC-002');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });
      mockBedrockClient.invokeModel.mockResolvedValue('Decision: PASS\nReason: Meets criteria.');

      const result = await engine.evaluate(input);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].control_id).toBe('SOC-002');
      expect(result.summary).toEqual({ passed: 1, failed: 0, errored: 0, total: 1 });
      expect(result.overall_decision).toBe('PASS');
      // Should not call getControlIds when control_id is specified
      expect(mockControlRegistry.getControlIds).not.toHaveBeenCalled();
    });

    it('marks control as ERROR on Bedrock failure and continues evaluating', async () => {
      const input: EvaluateSubmissionInput = {
        file_path: '/path/to/report.pdf',
        report_type: 'wafr',
      };

      mockPdfParser.parse.mockResolvedValue({
        text: 'PDF content',
        char_count: 11,
        page_count: 2,
      });

      mockControlRegistry.getControlIds.mockReturnValue([
        'WAFR-FTR-001', 'WAFR-FTR-002', 'WAFR-FTR-003', 'WAFR-FTR-004',
      ]);

      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });

      // Second control throws an error
      mockBedrockClient.invokeModel
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.')
        .mockRejectedValueOnce(new Error('Bedrock throttling error'))
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.')
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.');

      const result = await engine.evaluate(input);

      expect(result.results).toHaveLength(4);
      expect(result.results[1].control_id).toBe('WAFR-FTR-002');
      expect(result.results[1].decision).toBe('ERROR');
      expect(result.results[1].reason).toBe('Bedrock throttling error');
      // Overall is FAIL because of ERROR
      expect(result.overall_decision).toBe('FAIL');
      expect(result.summary).toEqual({ passed: 3, failed: 0, errored: 1, total: 4 });
    });

    it('returns FAIL overall when any control has ERROR status', async () => {
      const input: EvaluateSubmissionInput = {
        file_path: '/path/to/report.pdf',
        report_type: 'soc2',
      };

      mockPdfParser.parse.mockResolvedValue({
        text: 'Content',
        char_count: 7,
        page_count: 1,
      });

      mockControlRegistry.getControlIds.mockReturnValue(['SOC-001', 'SOC-002']);

      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });

      mockBedrockClient.invokeModel
        .mockResolvedValueOnce('Decision: PASS\nReason: Good.')
        .mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await engine.evaluate(input);

      expect(result.overall_decision).toBe('FAIL');
      expect(result.summary.errored).toBe(1);
    });
  });

  describe('evaluateControl', () => {
    it('returns PASS result for a passing control', async () => {
      mockCalibrationGuideRegistry.getSection.mockReturnValue('Calibration guide text');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Full prompt',
        systemPrompt: 'System prompt',
      });
      mockBedrockClient.invokeModel.mockResolvedValue(
        'Decision: PASS\nReason: The report meets all requirements.'
      );

      const result = await engine.evaluateControl('PDF text', 'SOC-001', 'soc2');

      expect(result.control_id).toBe('SOC-001');
      expect(result.decision).toBe('PASS');
      expect(result.reason).toBe('The report meets all requirements.');
    });

    it('returns FAIL result for a failing control', async () => {
      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });
      mockBedrockClient.invokeModel.mockResolvedValue(
        'Decision: FAIL\nReason: Report is expired.'
      );

      const result = await engine.evaluateControl('PDF text', 'SOC-001', 'soc2');

      expect(result.decision).toBe('FAIL');
      expect(result.reason).toBe('Report is expired.');
    });

    it('returns ERROR when Bedrock throws', async () => {
      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });
      mockBedrockClient.invokeModel.mockRejectedValue(new Error('Connection timeout'));

      const result = await engine.evaluateControl('PDF text', 'SOC-001', 'soc2');

      expect(result.control_id).toBe('SOC-001');
      expect(result.decision).toBe('ERROR');
      expect(result.reason).toBe('Connection timeout');
    });

    it('truncates error message to 2000 characters', async () => {
      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });
      const longError = 'E'.repeat(3000);
      mockBedrockClient.invokeModel.mockRejectedValue(new Error(longError));

      const result = await engine.evaluateControl('PDF text', 'SOC-001', 'soc2');

      expect(result.decision).toBe('ERROR');
      expect(result.reason.length).toBe(2000);
    });

    it('passes correct arguments to dependencies', async () => {
      mockCalibrationGuideRegistry.getSection.mockReturnValue('SOC-003 guide section');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Built prompt with context',
        systemPrompt: 'FTR system prompt',
      });
      mockBedrockClient.invokeModel.mockResolvedValue('Decision: PASS\nReason: OK.');

      await engine.evaluateControl('Extracted PDF text', 'SOC-003', 'soc2');

      expect(mockCalibrationGuideRegistry.getSection).toHaveBeenCalledWith('soc2', 'SOC-003');
      expect(mockPromptBuilder.build).toHaveBeenCalledWith('SOC-003 guide section', 'Extracted PDF text');
      expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith(
        'Built prompt with context',
        'FTR system prompt'
      );
    });

    it('handles non-Error thrown values gracefully', async () => {
      mockCalibrationGuideRegistry.getSection.mockReturnValue('Guide');
      mockPromptBuilder.build.mockReturnValue({
        prompt: 'Prompt',
        systemPrompt: 'System',
      });
      mockBedrockClient.invokeModel.mockRejectedValue('string error');

      const result = await engine.evaluateControl('PDF text', 'SOC-001', 'soc2');

      expect(result.decision).toBe('ERROR');
      expect(result.reason).toBe('Unknown error occurred');
    });
  });
});
