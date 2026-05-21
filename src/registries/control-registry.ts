import * as fs from 'fs';
import * as path from 'path';
import { ControlDefinition, ReportType } from '../types.js';

const VALID_REPORT_TYPES: ReportType[] = ['soc2', 'wafr'];

/**
 * Parses a control markdown file into an array of ControlDefinition objects.
 *
 * Expected markdown format:
 * ```
 * # Top-level heading (ignored)
 *
 * ## CONTROL-ID: Title
 *
 * First paragraph is the description/criteria.
 * Subsequent paragraphs cover edge cases and examples.
 *
 * ---
 * ```
 */
function parseControlMarkdown(content: string): ControlDefinition[] {
  const controls: ControlDefinition[] = [];
  // Split on ## headings (level 2)
  const sections = content.split(/^## /m).slice(1); // Skip content before first ##

  for (const section of sections) {
    const lines = section.trim().split('\n');
    if (lines.length === 0) continue;

    // Parse heading line: "CONTROL-ID: Title"
    const headingLine = lines[0].trim();
    const colonIndex = headingLine.indexOf(':');
    if (colonIndex === -1) continue;

    const controlId = headingLine.substring(0, colonIndex).trim();
    const title = headingLine.substring(colonIndex + 1).trim();

    // Remaining lines (after heading) form the body, trimmed of trailing ---
    const bodyLines = lines.slice(1);
    // Remove trailing --- separator if present
    const bodyText = bodyLines
      .join('\n')
      .replace(/\n---\s*$/, '')
      .trim();

    // Split body into paragraphs (separated by blank lines)
    const paragraphs = bodyText.split(/\n\n+/).filter(p => p.trim().length > 0);

    // First paragraph is the primary description/criteria
    const description = paragraphs[0]?.trim() || '';

    // The full body text serves as the criteria (complete evaluation guidance)
    const criteria = bodyText;

    // Edge cases: paragraphs that discuss exceptions, special cases, or conditions
    // (paragraphs after the first that aren't purely examples)
    const edgeCaseParagraphs = paragraphs.slice(1).filter(p =>
      !p.trim().startsWith('Example') && !p.trim().startsWith('e.g.')
    );
    const edgeCases = edgeCaseParagraphs.join('\n\n').trim();

    // Examples: paragraphs that start with "Example" or contain example-like content
    const exampleParagraphs = paragraphs.slice(1).filter(p =>
      p.trim().startsWith('Example') || p.trim().startsWith('e.g.')
    );
    const examples = exampleParagraphs.join('\n\n').trim();

    controls.push({
      control_id: controlId,
      title,
      description,
      criteria,
      edge_cases: edgeCases,
      examples,
    });
  }

  return controls;
}

/**
 * Registry for FTR control definitions.
 * Parses and caches control definitions from bundled markdown files at startup.
 */
export class ControlRegistry {
  private soc2Controls: ControlDefinition[];
  private wafrControls: ControlDefinition[];

  constructor() {
    const soc2Path = path.join(__dirname, '../assets/controls/soc2-controls.md');
    const wafrPath = path.join(__dirname, '../assets/controls/wafr-controls.md');

    const soc2Content = fs.readFileSync(soc2Path, 'utf-8');
    const wafrContent = fs.readFileSync(wafrPath, 'utf-8');

    this.soc2Controls = parseControlMarkdown(soc2Content);
    this.wafrControls = parseControlMarkdown(wafrContent);
  }

  /**
   * Returns all control definitions for the given report type.
   * @throws Error if reportType is invalid.
   */
  getControls(reportType: ReportType): ControlDefinition[] {
    this.validateReportType(reportType);
    return reportType === 'soc2' ? this.soc2Controls : this.wafrControls;
  }

  /**
   * Returns a single control definition by ID, or null if not found.
   * @throws Error if reportType is invalid.
   * @throws Error if controlId does not exist for the given report type.
   */
  getControl(reportType: ReportType, controlId: string): ControlDefinition {
    this.validateReportType(reportType);
    const controls = this.getControls(reportType);
    const control = controls.find(c => c.control_id === controlId);
    if (!control) {
      const validIds = controls.map(c => c.control_id);
      throw new Error(
        `Control ID "${controlId}" not found for report type "${reportType}". ` +
        `Valid control IDs: ${validIds.join(', ')}`
      );
    }
    return control;
  }

  /**
   * Returns all control IDs for the given report type.
   * @throws Error if reportType is invalid.
   */
  getControlIds(reportType: ReportType): string[] {
    this.validateReportType(reportType);
    return this.getControls(reportType).map(c => c.control_id);
  }

  /**
   * Validates that the report type is one of the supported values.
   * @throws Error if reportType is not valid.
   */
  private validateReportType(reportType: string): asserts reportType is ReportType {
    if (!VALID_REPORT_TYPES.includes(reportType as ReportType)) {
      throw new Error(
        `Invalid report type "${reportType}". Valid report types: ${VALID_REPORT_TYPES.join(', ')}`
      );
    }
  }
}
