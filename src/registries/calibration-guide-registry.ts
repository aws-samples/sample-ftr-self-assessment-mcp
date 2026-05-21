import * as fs from 'fs';
import * as path from 'path';
import { ReportType } from '../types.js';

/**
 * Registry for loading and retrieving calibration guide content.
 * Guides are loaded from bundled markdown files at startup and cached in memory.
 * Section extraction uses heading-based parsing — scanning for `##` headings
 * containing the control ID and collecting text until the next `---` separator.
 */
export class CalibrationGuideRegistry {
  private guides: Map<ReportType, string> = new Map();

  constructor() {
    this.loadGuides();
  }

  /**
   * Load calibration guide markdown files from bundled assets at startup.
   */
  private loadGuides(): void {
    const guidesDir = path.join(__dirname, '../assets/calibration-guides');

    const soc2Path = path.join(guidesDir, 'soc2-calibration-guide.md');
    const wafrPath = path.join(guidesDir, 'wafr-calibration-guide.md');

    this.guides.set('soc2', fs.readFileSync(soc2Path, 'utf-8'));
    this.guides.set('wafr', fs.readFileSync(wafrPath, 'utf-8'));
  }

  /**
   * Returns the full calibration guide for the given report type.
   * @throws Error if the report type is invalid.
   */
  getFullGuide(reportType: ReportType): string {
    this.validateReportType(reportType);
    return this.guides.get(reportType)!;
  }

  /**
   * Returns the calibration guide section for a specific control ID.
   * Uses heading-based parsing: scans for `##` headings containing the control ID
   * and collects text until the next `---` separator.
   *
   * If the control ID is not found in the guide, returns the full guide content.
   */
  getSection(reportType: ReportType, controlId: string): string {
    this.validateReportType(reportType);

    const fullGuide = this.guides.get(reportType)!;
    return this.extractSection(fullGuide, controlId);
  }

  /**
   * Extract a section from the guide content by scanning for a `##` heading
   * containing the control ID and collecting all text until the next `---` separator.
   */
  private extractSection(content: string, controlId: string): string {
    const lines = content.split('\n');
    let capturing = false;
    const sectionLines: string[] = [];

    for (const line of lines) {
      if (!capturing) {
        // Look for a ## heading that contains the control ID
        if (line.startsWith('## ') && line.includes(controlId)) {
          capturing = true;
          sectionLines.push(line);
        }
      } else {
        // Stop capturing when we hit a `---` separator
        if (line.trim() === '---') {
          break;
        }
        sectionLines.push(line);
      }
    }

    // If no section was found, return the full guide content
    if (sectionLines.length === 0) {
      return content;
    }

    return sectionLines.join('\n');
  }

  /**
   * Validates that the report type is one of the supported values.
   * @throws Error listing valid report types if invalid.
   */
  private validateReportType(reportType: string): asserts reportType is ReportType {
    const validTypes: ReportType[] = ['soc2', 'wafr'];
    if (!validTypes.includes(reportType as ReportType)) {
      throw new Error(
        `Invalid report type: "${reportType}". Valid report types are: "soc2", "wafr"`
      );
    }
  }
}
