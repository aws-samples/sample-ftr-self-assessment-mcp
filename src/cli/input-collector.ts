/**
 * Input collector for the interactive CLI.
 * Gathers report type, file path, and control selection via inquirer prompts or CLI flags.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CliOptions } from '../cli.js';
import { ControlRegistry } from '../registries/control-registry.js';
import { ReportType } from '../types.js';

export interface EvaluationInputs {
  reportType: ReportType;
  filePath: string;
  controlId?: string;
}

/**
 * Collects evaluation inputs either from CLI flags (non-interactive)
 * or via interactive prompts.
 */
export async function collectInputs(
  options: CliOptions,
  controlRegistry: ControlRegistry,
): Promise<EvaluationInputs> {
  const hasAnyFlag = !!(options.reportType || options.file);

  if (hasAnyFlag) {
    // Non-interactive mode: validate that all required flags are present
    const missingFlags: string[] = [];
    if (!options.reportType) missingFlags.push('--report-type');
    if (!options.file) missingFlags.push('--file');

    if (missingFlags.length > 0) {
      throw new Error(
        `Missing required flags for non-interactive mode: ${missingFlags.join(', ')}`,
      );
    }

    // Validate report type
    const reportType = options.reportType as string;
    if (reportType !== 'soc2' && reportType !== 'wafr') {
      throw new Error(
        `Invalid report type "${reportType}". Valid report types: soc2, wafr`,
      );
    }

    // Validate file path
    const filePath = options.file as string;
    const fileValidation = validateFilePath(filePath);
    if (fileValidation !== true) {
      throw new Error(fileValidation);
    }

    // Validate control ID if provided
    if (options.controlId) {
      // This will throw if the control ID is invalid
      controlRegistry.getControl(reportType, options.controlId);
    }

    return {
      reportType,
      filePath: resolve(filePath.trim()),
      controlId: options.controlId,
    };
  }

  // Interactive mode: prompt for all inputs
  const reportType = await promptReportType();
  const filePath = await promptFilePath();
  const controlId = await promptControlSelection(reportType, controlRegistry);

  return {
    reportType,
    filePath,
    controlId,
  };
}

/**
 * Prompts user to select report type from a list.
 */
export async function promptReportType(): Promise<ReportType> {
  const { default: inquirer } = await import('inquirer');
  const { reportType } = await inquirer.prompt<{ reportType: ReportType }>([
    {
      type: 'list',
      name: 'reportType',
      message: 'Select the report type to evaluate:',
      choices: [
        { name: 'SOC 2', value: 'soc2' as ReportType },
        { name: 'WAFR', value: 'wafr' as ReportType },
      ],
    },
  ]);
  return reportType;
}

/**
 * Validates a file path for the PDF prompt.
 * Checks that the path ends with .pdf (case-insensitive) and that the file exists.
 * Returns true if valid, or an error message string if invalid.
 */
export function validateFilePath(input: string): true | string {
  const trimmed = input.trim();

  if (!trimmed) {
    return 'Please enter a file path.';
  }

  if (!trimmed.toLowerCase().endsWith('.pdf')) {
    return 'File must have a .pdf extension.';
  }

  const resolved = resolve(trimmed);
  if (!existsSync(resolved)) {
    return `File not found: ${resolved}`;
  }

  return true;
}

/**
 * Prompts user for PDF file path with validation.
 */
export async function promptFilePath(): Promise<string> {
  const { default: inquirer } = await import('inquirer');
  const { filePath } = await inquirer.prompt<{ filePath: string }>([
    {
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to your PDF report:',
      validate: validateFilePath,
    },
  ]);

  return resolve(filePath.trim());
}

/**
 * Prompts user to select a control or "Evaluate All".
 */
export async function promptControlSelection(
  reportType: ReportType,
  controlRegistry: ControlRegistry,
): Promise<string | undefined> {
  const { default: inquirer } = await import('inquirer');
  const controls = controlRegistry.getControls(reportType);

  const choices = [
    { name: 'Evaluate All Controls', value: undefined as string | undefined },
    ...controls.map((control) => ({
      name: `${control.control_id}: ${control.title}`,
      value: control.control_id as string | undefined,
    })),
  ];

  const { controlId } = await inquirer.prompt<{ controlId: string | undefined }>([
    {
      type: 'list',
      name: 'controlId',
      message: 'Select a control to evaluate:',
      choices,
    },
  ]);

  return controlId;
}
