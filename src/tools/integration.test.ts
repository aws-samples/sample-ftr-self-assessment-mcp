import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'node:path';
import { ControlRegistry } from '../registries/control-registry.js';
import { CalibrationGuideRegistry } from '../registries/calibration-guide-registry.js';
import { PdfParser } from '../parsers/pdf-parser.js';
import { PromptBuilder } from '../engine/prompt-builder.js';
import type {
  ParsePdfOutput,
  GetControlsOutput,
  GetCalibrationGuideOutput,
  GetPromptTemplateOutput,
} from '../types.js';

/**
 * Integration tests for MCP tool handlers.
 *
 * These tests exercise the tool handler logic end-to-end by creating real
 * instances of all components (ControlRegistry, CalibrationGuideRegistry,
 * PdfParser, PromptBuilder) and invoking them with real inputs.
 *
 * Validates: Requirements 1.3, 1.4, 2.1, 3.1, 3.2, 4.1, 4.2, 6.1
 */
describe('MCP Tool Handlers - Integration Tests', () => {
  let controlRegistry: ControlRegistry;
  let calibrationGuideRegistry: CalibrationGuideRegistry;
  let pdfParser: PdfParser;

  beforeAll(() => {
    controlRegistry = new ControlRegistry();
    calibrationGuideRegistry = new CalibrationGuideRegistry();
    pdfParser = new PdfParser();
  });

  describe('parse_pdf', () => {
    it('returns file not found error for non-existent file', async () => {
      await expect(pdfParser.parse('/nonexistent/file.pdf')).rejects.toThrow(
        'File not found: /nonexistent/file.pdf'
      );
    });
  });

  describe('get_controls', () => {
    it('returns 5 SOC 2 controls with correct IDs', () => {
      const controls = controlRegistry.getControls('soc2');
      const output: GetControlsOutput = {
        report_type: 'soc2',
        controls,
      };

      expect(output.controls).toHaveLength(5);
      expect(output.report_type).toBe('soc2');

      const ids = output.controls.map(c => c.control_id);
      expect(ids).toEqual(['SOC-001', 'SOC-002', 'SOC-003', 'SOC-004', 'SOC-005']);

      // Verify each control has required fields
      for (const control of output.controls) {
        expect(control.control_id).toBeTruthy();
        expect(control.title).toBeTruthy();
        expect(control.description).toBeTruthy();
        expect(control.criteria).toBeTruthy();
      }
    });

    it('returns 6 WAFR controls with correct IDs', () => {
      const controls = controlRegistry.getControls('wafr');
      const output: GetControlsOutput = {
        report_type: 'wafr',
        controls,
      };

      expect(output.controls).toHaveLength(6);
      expect(output.report_type).toBe('wafr');

      const ids = output.controls.map(c => c.control_id);
      expect(ids).toEqual(['WAFR-FTR-001', 'WAFR-FTR-002', 'WAFR-FTR-003', 'WAFR-FTR-004', 'WAFR-FTR-005', 'WAFR-FTR-006']);

      // Verify each control has required fields
      for (const control of output.controls) {
        expect(control.control_id).toBeTruthy();
        expect(control.title).toBeTruthy();
        expect(control.description).toBeTruthy();
        expect(control.criteria).toBeTruthy();
      }
    });

    it('returns error listing valid types for invalid report type', () => {
      expect(() => controlRegistry.getControls('invalid' as any)).toThrow();

      try {
        controlRegistry.getControls('invalid' as any);
      } catch (error: any) {
        expect(error.message).toContain('soc2');
        expect(error.message).toContain('wafr');
        expect(error.message).toContain('invalid');
      }
    });
  });

  describe('get_calibration_guide', () => {
    it('returns non-empty SOC 2 calibration guide content', () => {
      const content = calibrationGuideRegistry.getFullGuide('soc2');
      const output: GetCalibrationGuideOutput = {
        report_type: 'soc2',
        content,
      };

      expect(output.content).toBeDefined();
      expect(typeof output.content).toBe('string');
      expect(output.content.length).toBeGreaterThan(0);
      expect(output.report_type).toBe('soc2');
    });

    it('returns non-empty WAFR calibration guide content', () => {
      const content = calibrationGuideRegistry.getFullGuide('wafr');
      const output: GetCalibrationGuideOutput = {
        report_type: 'wafr',
        content,
      };

      expect(output.content).toBeDefined();
      expect(typeof output.content).toBe('string');
      expect(output.content.length).toBeGreaterThan(0);
      expect(output.report_type).toBe('wafr');
    });

    it('returns error listing valid types for invalid report type', () => {
      expect(() => calibrationGuideRegistry.getFullGuide('invalid' as any)).toThrow();

      try {
        calibrationGuideRegistry.getFullGuide('invalid' as any);
      } catch (error: any) {
        expect(error.message).toContain('soc2');
        expect(error.message).toContain('wafr');
      }
    });
  });

  describe('get_prompt_template', () => {
    it('returns structured data with system_prompt and template_body', () => {
      const promptBuilder = PromptBuilder.fromAssets();
      const { prompt, systemPrompt } = promptBuilder.build('test context', 'test question');

      // Verify the PromptBuilder loaded successfully and produces output
      const output: GetPromptTemplateOutput = {
        system_prompt: systemPrompt,
        template_body: prompt,
      };

      expect(output.system_prompt).toBeDefined();
      expect(typeof output.system_prompt).toBe('string');
      expect(output.system_prompt.length).toBeGreaterThan(0);

      expect(output.template_body).toBeDefined();
      expect(typeof output.template_body).toBe('string');
      expect(output.template_body.length).toBeGreaterThan(0);
    });

    it('parseTemplate returns non-empty system_prompt and template_body', () => {
      const { systemPrompt, templateBody } = PromptBuilder.fromAssets() as any;

      // Access the private fields via the static parseTemplate method
      const fs = require('node:fs');
      const templatePath = path.join(__dirname, '../assets/prompts/ftr-prompt-template.md');
      const raw = fs.readFileSync(templatePath, 'utf-8');
      const parsed = PromptBuilder.parseTemplate(raw);

      expect(parsed.systemPrompt).toBeDefined();
      expect(typeof parsed.systemPrompt).toBe('string');
      expect(parsed.systemPrompt.length).toBeGreaterThan(0);

      expect(parsed.templateBody).toBeDefined();
      expect(typeof parsed.templateBody).toBe('string');
      expect(parsed.templateBody.length).toBeGreaterThan(0);
    });
  });

  describe('error responses for invalid inputs', () => {
    it('get_controls with invalid report type returns descriptive error', () => {
      try {
        controlRegistry.getControls('badtype' as any);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Invalid report type');
        expect(error.message).toContain('soc2');
        expect(error.message).toContain('wafr');
      }
    });

    it('get_calibration_guide with invalid report type returns descriptive error', () => {
      try {
        calibrationGuideRegistry.getFullGuide('badtype' as any);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Invalid report type');
        expect(error.message).toContain('soc2');
        expect(error.message).toContain('wafr');
      }
    });

    it('parse_pdf with missing file returns file not found error', async () => {
      try {
        await pdfParser.parse('/nonexistent/path/to/report.pdf');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('File not found');
        expect(error.message).toContain('/nonexistent/path/to/report.pdf');
      }
    });

    it('get_controls with non-existent control_id returns error with valid IDs', () => {
      try {
        controlRegistry.getControl('soc2', 'NONEXISTENT-001');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('NONEXISTENT-001');
        expect(error.message).toContain('SOC-001');
        expect(error.message).toContain('SOC-005');
      }
    });
  });
});
