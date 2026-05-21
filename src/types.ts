/**
 * Type definitions for all FTR MCP Server tool inputs and outputs.
 */

/** Supported report types for FTR evaluation. */
export type ReportType = 'soc2' | 'wafr';

// --- parse_pdf ---

export interface ParsePdfInput {
  file_path: string;
}

export interface ParsePdfOutput {
  text: string;
  char_count: number;
  page_count: number;
}

// --- get_controls ---

export interface GetControlsInput {
  report_type: ReportType;
  control_id?: string;
}

export interface GetControlsOutput {
  report_type: string;
  controls: ControlDefinition[];
}

export interface ControlDefinition {
  control_id: string;
  title: string;
  description: string;
  criteria: string;
  edge_cases: string;
  examples: string;
}

// --- get_calibration_guide ---

export interface GetCalibrationGuideInput {
  report_type: ReportType;
  control_id?: string;
}

export interface GetCalibrationGuideOutput {
  report_type: string;
  content: string;
}

// --- evaluate_submission ---

export interface EvaluateSubmissionInput {
  file_path: string;
  report_type: ReportType;
  control_id?: string;
}

export interface EvaluateSubmissionOutput {
  report_type: string;
  file_path: string;
  overall_decision: 'PASS' | 'FAIL';
  summary: {
    passed: number;
    failed: number;
    errored: number;
    total: number;
  };
  results: ControlResult[];
}

export interface ControlResult {
  control_id: string;
  decision: 'PASS' | 'FAIL' | 'ERROR';
  reason: string; // Max 2000 characters
}

// --- get_prompt_template ---

export interface GetPromptTemplateInput {} // No parameters

export interface GetPromptTemplateOutput {
  system_prompt: string;
  template_body: string;
}
