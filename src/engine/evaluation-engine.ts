import { PdfParser } from '../parsers/pdf-parser.js';
import { ControlRegistry } from '../registries/control-registry.js';
import { CalibrationGuideRegistry } from '../registries/calibration-guide-registry.js';
import { PromptBuilder } from './prompt-builder.js';
import { BedrockClient } from './bedrock-client.js';
import { parseDecision } from './decision-parser.js';
import {
  EvaluateSubmissionInput,
  EvaluateSubmissionOutput,
  ControlResult,
  ReportType,
} from '../types.js';

/**
 * Orchestrates per-control evaluation of FTR submissions.
 *
 * For each control:
 * 1. Loads the calibration guide section for that control
 * 2. Builds the prompt using the template with context (date + calibration guide) and question (PDF text)
 * 3. Calls Bedrock with the system prompt and constructed user prompt
 * 4. Parses the response for Decision: PASS or Decision: FAIL
 *
 * Error handling:
 * - If Bedrock fails for a single control, that control is marked as ERROR and evaluation continues
 * - Overall decision is PASS only when ALL controls have decision === 'PASS'
 */
export class EvaluationEngine {
  constructor(
    private pdfParser: PdfParser,
    private controlRegistry: ControlRegistry,
    private calibrationGuideRegistry: CalibrationGuideRegistry,
    private promptBuilder: PromptBuilder,
    private bedrockClient: BedrockClient
  ) {}

  /**
   * Evaluate a PDF submission against all controls for the given report type,
   * or a single control if control_id is specified.
   *
   * @param input - The evaluation input containing file_path, report_type, and optional control_id
   * @returns Full evaluation output with per-control results, overall decision, and summary
   */
  async evaluate(input: EvaluateSubmissionInput): Promise<EvaluateSubmissionOutput> {
    // Parse the PDF
    const pdfOutput = await this.pdfParser.parse(input.file_path);
    const pdfText = pdfOutput.text;

    // Determine which controls to evaluate
    let controlIds: string[];
    if (input.control_id) {
      // Validate the control_id exists for this report type (throws if invalid)
      this.controlRegistry.getControl(input.report_type, input.control_id);
      controlIds = [input.control_id];
    } else {
      controlIds = this.controlRegistry.getControlIds(input.report_type);
    }

    // Evaluate each control
    const results: ControlResult[] = [];
    for (const controlId of controlIds) {
      const result = await this.evaluateControl(pdfText, controlId, input.report_type);
      results.push(result);
    }

    // Compute overall decision: PASS only if ALL controls pass
    const overallDecision = results.every(r => r.decision === 'PASS') ? 'PASS' : 'FAIL';

    // Build summary counts
    const passed = results.filter(r => r.decision === 'PASS').length;
    const failed = results.filter(r => r.decision === 'FAIL').length;
    const errored = results.filter(r => r.decision === 'ERROR').length;

    return {
      report_type: input.report_type,
      file_path: input.file_path,
      overall_decision: overallDecision,
      summary: {
        passed,
        failed,
        errored,
        total: results.length,
      },
      results,
    };
  }

  /**
   * Evaluate a single control against the provided PDF text.
   *
   * Steps:
   * 1. Load calibration guide section for the control
   * 2. Build the prompt with date context and PDF text
   * 3. Call Bedrock with the constructed prompt
   * 4. Parse the decision from the model response
   *
   * If Bedrock fails, the control is marked as ERROR with the error message as reason.
   *
   * @param pdfText - The extracted PDF text content
   * @param controlId - The control ID to evaluate (e.g., "SOC-001")
   * @param reportType - The report type ("soc2" or "wafr")
   * @returns The control evaluation result
   */
  async evaluateControl(
    pdfText: string,
    controlId: string,
    reportType: string
  ): Promise<ControlResult> {
    try {
      // 1. Load calibration guide section for this control
      const calibrationGuide = this.calibrationGuideRegistry.getSection(
        reportType as ReportType,
        controlId
      );

      // 2. Build the prompt (includes current date in context)
      const { prompt, systemPrompt } = this.promptBuilder.build(calibrationGuide, pdfText);

      // 3. Call Bedrock
      const response = await this.bedrockClient.invokeModel(prompt, systemPrompt);

      // 4. Parse the decision from the response
      return parseDecision(response, controlId);
    } catch (error: unknown) {
      // Mark this control as ERROR and continue (caller handles remaining controls)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        control_id: controlId,
        decision: 'ERROR',
        reason: errorMessage.slice(0, 2000),
      };
    }
  }
}
