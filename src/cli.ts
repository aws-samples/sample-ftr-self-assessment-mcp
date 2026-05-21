/**
 * Main CLI orchestrator for the interactive evaluation workflow.
 * Handles both interactive and non-interactive modes.
 */

import { resolveConfig } from './config.js';
import { PdfParser } from './parsers/pdf-parser.js';
import { ControlRegistry } from './registries/control-registry.js';
import { CalibrationGuideRegistry } from './registries/calibration-guide-registry.js';
import { PromptBuilder } from './engine/prompt-builder.js';
import { BedrockClient } from './engine/bedrock-client.js';
import { EvaluationEngine } from './engine/evaluation-engine.js';
import { validateAwsCredentials } from './cli/credential-validator.js';
import { collectInputs } from './cli/input-collector.js';
import { createProgressReporter } from './cli/progress-reporter.js';
import { formatResults } from './cli/results-formatter.js';
import { ControlResult, EvaluateSubmissionOutput } from './types.js';

export interface CliOptions {
  reportType?: string;
  file?: string;
  controlId?: string;
  region?: string;
  model?: string;
}

/** Tracks the current phase of the CLI workflow for SIGINT handling. */
export type CliPhase = 'prompts' | 'evaluation';

/**
 * Main entry point for the interactive CLI evaluation workflow.
 * Handles both interactive and non-interactive modes.
 */
export async function runEvaluateCli(options: CliOptions): Promise<void> {
  // Phase and cancellation state for graceful interruption handling
  let phase: CliPhase = 'prompts';
  let cancelled = false;
  const partialResults: ControlResult[] = [];

  // Register SIGINT handler for graceful interruption
  const sigintHandler = async () => {
    if (phase === 'prompts') {
      const { default: chalk } = await import('chalk');
      console.log('\n' + chalk.dim('Goodbye! Evaluation cancelled.'));
      process.exit(0);
    } else if (phase === 'evaluation') {
      cancelled = true;
    }
  };
  process.on('SIGINT', sigintHandler);

  try {
    // Resolve configuration from CLI options or defaults
    const config = resolveConfig({
      awsRegion: options.region,
      bedrockModelId: options.model,
    });

    // Validate AWS credentials first; exit with code 1 if not configured
    try {
      await validateAwsCredentials(config.awsRegion);
    } catch (error: unknown) {
      const { default: chalk } = await import('chalk');
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error: ') + message);
      process.exit(1);
    }

    // Initialize existing components
    const pdfParser = new PdfParser();
    const controlRegistry = new ControlRegistry();
    const calibrationGuideRegistry = new CalibrationGuideRegistry();
    const promptBuilder = PromptBuilder.fromAssets();
    const bedrockClient = new BedrockClient({
      region: config.awsRegion,
      modelId: config.bedrockModelId,
    });
    const engine = new EvaluationEngine(
      pdfParser,
      controlRegistry,
      calibrationGuideRegistry,
      promptBuilder,
      bedrockClient,
    );

    // Collect evaluation inputs (interactive or non-interactive)
    const input = await collectInputs(options, controlRegistry);

    // Transition to evaluation phase
    phase = 'evaluation';

    // Parse the PDF
    const pdfOutput = await pdfParser.parse(input.filePath);

    // Determine which controls to evaluate
    const controlIds = input.controlId
      ? [input.controlId]
      : controlRegistry.getControlIds(input.reportType);

    // Create progress reporter and start it
    const progress = await createProgressReporter();
    progress.start(
      `Evaluating ${controlIds.length} control(s) for ${input.reportType.toUpperCase()}...`,
    );

    // Evaluate each control with progress updates
    for (let i = 0; i < controlIds.length; i++) {
      // Check cancellation flag before each control evaluation
      if (cancelled) {
        progress.stop(false);
        await displayPartialResults(partialResults, input.reportType, input.filePath);
        process.exit(0);
      }

      try {
        const result = await engine.evaluateControl(
          pdfOutput.text,
          controlIds[i],
          input.reportType,
        );
        partialResults.push(result);
        progress.update(i + 1, controlIds.length, controlIds[i], result.decision);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        partialResults.push({
          control_id: controlIds[i],
          decision: 'ERROR',
          reason: errorMessage.slice(0, 2000),
        });
        progress.update(i + 1, controlIds.length, controlIds[i], 'ERROR');
      }

      // Check cancellation flag after each control evaluation completes
      if (cancelled) {
        progress.stop(false);
        await displayPartialResults(partialResults, input.reportType, input.filePath);
        process.exit(0);
      }
    }

    // Stop progress reporter
    progress.stop(true);

    // Compute overall decision and summary
    const overallDecision = partialResults.every((r) => r.decision === 'PASS')
      ? 'PASS'
      : 'FAIL';
    const output: EvaluateSubmissionOutput = {
      report_type: input.reportType,
      file_path: input.filePath,
      overall_decision: overallDecision,
      summary: {
        passed: partialResults.filter((r) => r.decision === 'PASS').length,
        failed: partialResults.filter((r) => r.decision === 'FAIL').length,
        errored: partialResults.filter((r) => r.decision === 'ERROR').length,
        total: partialResults.length,
      },
      results: partialResults,
    };

    // Display formatted results
    await formatResults(output);
  } finally {
    // Clean up the SIGINT handler
    process.removeListener('SIGINT', sigintHandler);
  }
}

/**
 * Displays partial results when evaluation is interrupted by SIGINT.
 * Shows whatever controls have been evaluated so far.
 */
async function displayPartialResults(
  results: ControlResult[],
  reportType: string,
  filePath: string,
): Promise<void> {
  const { default: chalk } = await import('chalk');

  console.log('\n' + chalk.yellow('Evaluation interrupted. Displaying partial results...\n'));

  if (results.length === 0) {
    console.log(chalk.dim('No controls were evaluated before interruption.'));
    return;
  }

  const overallDecision = results.every((r) => r.decision === 'PASS') ? 'PASS' : 'FAIL';
  const output: EvaluateSubmissionOutput = {
    report_type: reportType,
    file_path: filePath,
    overall_decision: overallDecision,
    summary: {
      passed: results.filter((r) => r.decision === 'PASS').length,
      failed: results.filter((r) => r.decision === 'FAIL').length,
      errored: results.filter((r) => r.decision === 'ERROR').length,
      total: results.length,
    },
    results,
  };

  await formatResults(output);
}
