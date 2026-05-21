/**
 * Results formatter for the interactive CLI.
 * Renders evaluation results with color-coded output.
 */

import { EvaluateSubmissionOutput, ControlResult } from '../types.js';

/** Maximum line width (excluding ANSI color codes) */
const MAX_LINE_WIDTH = 80;

/** Indent for reason text continuation lines */
const REASON_INDENT = '    ';

/** Indent for the first reason line */
const REASON_PREFIX = '    Reason: ';

/**
 * Returns the symbol for a given decision.
 */
function decisionSymbol(decision: 'PASS' | 'FAIL' | 'ERROR'): string {
  switch (decision) {
    case 'PASS':
      return '✓';
    case 'FAIL':
      return '✗';
    case 'ERROR':
      return '⚠';
  }
}

/**
 * Wraps text to fit within maxWidth, breaking at word boundaries.
 * Returns an array of lines.
 */
function wrapText(text: string, firstLineWidth: number, continuationWidth: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = '';
  let currentMaxWidth = firstLineWidth;

  for (const word of words) {
    if (currentLine === '') {
      // If a single word exceeds the max width, break it
      if (word.length > currentMaxWidth) {
        let remaining = word;
        while (remaining.length > currentMaxWidth) {
          lines.push(remaining.substring(0, currentMaxWidth));
          remaining = remaining.substring(currentMaxWidth);
          currentMaxWidth = continuationWidth;
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    } else if (currentLine.length + 1 + word.length <= currentMaxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentMaxWidth = continuationWidth;
      // Handle word that exceeds continuation width
      if (word.length > currentMaxWidth) {
        let remaining = word;
        while (remaining.length > currentMaxWidth) {
          lines.push(remaining.substring(0, currentMaxWidth));
          remaining = remaining.substring(currentMaxWidth);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Formats the report type for display.
 */
function formatReportType(reportType: string): string {
  switch (reportType) {
    case 'soc2':
      return 'SOC 2';
    case 'wafr':
      return 'WAFR';
    default:
      return reportType.toUpperCase();
  }
}

/**
 * Formats and prints evaluation results with color coding.
 * Uses dynamic import for chalk (ESM-only package).
 * - Overall PASS: green
 * - Overall FAIL: red
 * - Per-control PASS: green
 * - Per-control FAIL: red
 * - Per-control ERROR: yellow
 */
export async function formatResults(output: EvaluateSubmissionOutput): Promise<void> {
  const { default: chalk } = await import('chalk');

  function colorize(text: string, decision: 'PASS' | 'FAIL' | 'ERROR'): string {
    switch (decision) {
      case 'PASS':
        return chalk.green(text);
      case 'FAIL':
        return chalk.red(text);
      case 'ERROR':
        return chalk.yellow(text);
    }
  }

  const { report_type, file_path, overall_decision, summary, results } = output;

  const reportTypeDisplay = formatReportType(report_type);
  const overallSymbol = decisionSymbol(overall_decision);
  const overallText = `${overallSymbol} ${overall_decision}`;
  const overallColored = colorize(overallText, overall_decision);

  const summaryText = `${summary.passed} passed, ${summary.failed} failed, ${summary.errored} errors (${summary.total} total)`;

  // Build box content lines (plain text for width calculation)
  const boxLines = [
    `  FTR Evaluation Results`,
    `  Report Type: ${reportTypeDisplay}`,
    `  File: ${file_path}`,
    `  Overall Decision: ${overallText}`,
    `  Summary: ${summaryText}`,
  ];

  // Calculate box width (max content width + padding)
  const maxContentWidth = Math.max(...boxLines.map(l => l.length));
  const boxWidth = Math.min(Math.max(maxContentWidth + 2, 50), MAX_LINE_WIDTH - 2);

  // Draw the box
  const topBorder = '┌' + '─'.repeat(boxWidth) + '┐';
  const bottomBorder = '└' + '─'.repeat(boxWidth) + '┘';
  const separator = '├' + '─'.repeat(boxWidth) + '┤';

  console.log('');
  console.log(topBorder);

  // Title line
  const titleContent = '  FTR Evaluation Results';
  const titlePad = Math.max(0, boxWidth - titleContent.length);
  console.log('│' + titleContent + ' '.repeat(titlePad) + '│');

  console.log(separator);

  // Report Type
  const rtContent = `  Report Type: ${reportTypeDisplay}`;
  const rtPad = Math.max(0, boxWidth - rtContent.length);
  console.log('│' + rtContent + ' '.repeat(rtPad) + '│');

  // File (truncate if too long for box)
  let fileContent = `  File: ${file_path}`;
  if (fileContent.length > boxWidth) {
    fileContent = fileContent.substring(0, boxWidth - 3) + '...';
  }
  const filePad = Math.max(0, boxWidth - fileContent.length);
  console.log('│' + fileContent + ' '.repeat(filePad) + '│');

  // Overall Decision (colored)
  const odPrefix = '  Overall Decision: ';
  const odPlainLength = odPrefix.length + overallText.length;
  const odPad = Math.max(0, boxWidth - odPlainLength);
  console.log('│' + odPrefix + overallColored + ' '.repeat(odPad) + '│');

  // Summary
  const sumContent = `  Summary: ${summaryText}`;
  const sumPad = Math.max(0, boxWidth - sumContent.length);
  console.log('│' + sumContent + ' '.repeat(sumPad) + '│');

  console.log(bottomBorder);
  console.log('');

  // Display individual control results
  for (const result of results) {
    const { control_id, decision, reason } = result;

    const symbol = decisionSymbol(decision);

    // Print the control header line
    console.log('  ' + colorize(`${symbol} ${control_id}`, decision) + '  ' + colorize(decision, decision));

    // Print the reason with wrapping
    if (reason) {
      const firstLineMaxChars = MAX_LINE_WIDTH - REASON_PREFIX.length;
      const continuationMaxChars = MAX_LINE_WIDTH - REASON_INDENT.length;

      const wrappedLines = wrapText(reason, firstLineMaxChars, continuationMaxChars);

      for (let i = 0; i < wrappedLines.length; i++) {
        if (i === 0) {
          console.log(REASON_PREFIX + wrappedLines[i]);
        } else {
          console.log(REASON_INDENT + wrappedLines[i]);
        }
      }
    }

    console.log('');
  }
}
