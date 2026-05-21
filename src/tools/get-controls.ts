import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ControlRegistry } from '../registries/control-registry.js';
import { GetControlsOutput } from '../types.js';

/**
 * Registers the `get_controls` tool with the MCP server.
 * This tool retrieves FTR control definitions by report type, optionally filtered by control ID.
 */
export function registerGetControlsTool(server: McpServer, controlRegistry: ControlRegistry): void {
  server.tool(
    'get_controls',
    'Retrieve FTR control definitions for a given report type. Optionally filter by a specific control ID.',
    {
      report_type: z.enum(['soc2', 'wafr']).describe('The report type to get controls for'),
      control_id: z.string().optional().describe('Optional specific control ID (e.g., SOC-001)'),
    },
    async (args) => {
      try {
        const { report_type, control_id } = args;

        let output: GetControlsOutput;

        if (control_id) {
          const control = controlRegistry.getControl(report_type, control_id);
          output = {
            report_type,
            controls: [control],
          };
        } else {
          const controls = controlRegistry.getControls(report_type);
          output = {
            report_type,
            controls,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(output, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: message,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
