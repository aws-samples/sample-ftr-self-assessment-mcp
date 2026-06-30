import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EvaluationEngine } from '../engine/evaluation-engine.js';
import { EvaluateSubmissionInput } from '../types.js';

/**
 * Registers the `evaluate_submission` tool with the MCP server.
 *
 * This tool evaluates a partner's PDF submission against FTR controls
 * using Amazon Bedrock, producing PASS/FAIL decisions with reasoning
 * for each control.
 */
export function registerEvaluateSubmissionTool(
  server: McpServer,
  evaluationEngine: EvaluationEngine
): void {
  server.tool(
    'evaluate_submission',
    'Evaluate a PDF report against FTR checks. Returns per-check PASS/FAIL decisions with reasoning and an overall result.',
    {
      file_path: z.string().describe('Path to the PDF report to evaluate'),
      report_type: z.enum(['soc2', 'wafr']).describe('The report type to evaluate against'),
      control_id: z.string().optional().describe('Optional specific control ID to evaluate only that control'),
    },
    async (args) => {
      try {
        const input: EvaluateSubmissionInput = {
          file_path: args.file_path,
          report_type: args.report_type,
          control_id: args.control_id,
        };

        const result = await evaluationEngine.evaluate(input);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
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
