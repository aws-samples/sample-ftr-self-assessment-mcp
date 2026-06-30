import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CalibrationGuideRegistry } from '../registries/calibration-guide-registry.js';
import { GetCalibrationGuideOutput, ReportType } from '../types.js';

/**
 * Registers the `get_calibration_guide` tool with the MCP server.
 * This tool retrieves calibration guide content for a given report type,
 * optionally filtered to a specific control section.
 */
export function registerGetCalibrationGuideTool(
  server: McpServer,
  calibrationGuideRegistry: CalibrationGuideRegistry
): void {
  server.tool(
    'get_calibration_guide',
    'Retrieve the FTR calibration guide with detailed evaluation guidance, edge cases, and examples for each check',
    {
      report_type: z.enum(['soc2', 'wafr']).describe('The report type to get the calibration guide for'),
      control_id: z.string().optional().describe('Optional specific control ID to get only that section'),
    },
    async (args): Promise<{ content: Array<{ type: 'text'; text: string }>, isError?: boolean }> => {
      try {
        const { report_type, control_id } = args;

        let content: string;
        if (control_id) {
          content = calibrationGuideRegistry.getSection(report_type as ReportType, control_id);
        } else {
          content = calibrationGuideRegistry.getFullGuide(report_type as ReportType);
        }

        const output: GetCalibrationGuideOutput = {
          report_type,
          content,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        };
      }
    }
  );
}
