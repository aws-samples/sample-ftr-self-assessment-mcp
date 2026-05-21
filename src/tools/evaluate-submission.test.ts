import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEvaluateSubmissionTool } from './evaluate-submission.js';
import { EvaluationEngine } from '../engine/evaluation-engine.js';
import { EvaluateSubmissionOutput } from '../types.js';

describe('registerEvaluateSubmissionTool', () => {
  let server: McpServer;
  let evaluationEngine: { evaluate: ReturnType<typeof vi.fn> };
  let toolHandler: (args: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    // Capture the tool handler when server.tool() is called
    server = {
      tool: vi.fn((_name: string, _desc: string, _schema: unknown, handler: unknown) => {
        toolHandler = handler as (args: Record<string, unknown>) => Promise<unknown>;
      }),
    } as unknown as McpServer;

    evaluationEngine = {
      evaluate: vi.fn(),
    };

    registerEvaluateSubmissionTool(server, evaluationEngine as unknown as EvaluationEngine);
  });

  it('registers the tool with the correct name and schema', () => {
    expect(server.tool).toHaveBeenCalledWith(
      'evaluate_submission',
      expect.any(String),
      expect.objectContaining({
        file_path: expect.anything(),
        report_type: expect.anything(),
        control_id: expect.anything(),
      }),
      expect.any(Function)
    );
  });

  it('returns structured evaluation output on success', async () => {
    const mockOutput: EvaluateSubmissionOutput = {
      report_type: 'soc2',
      file_path: '/path/to/report.pdf',
      overall_decision: 'PASS',
      summary: { passed: 5, failed: 0, errored: 0, total: 5 },
      results: [
        { control_id: 'SOC-001', decision: 'PASS', reason: 'Report is current.' },
        { control_id: 'SOC-002', decision: 'PASS', reason: 'Adequate coverage.' },
        { control_id: 'SOC-003', decision: 'PASS', reason: 'Controls present.' },
        { control_id: 'SOC-004', decision: 'PASS', reason: 'No exceptions.' },
        { control_id: 'SOC-005', decision: 'PASS', reason: 'Monitoring in place.' },
      ],
    };

    evaluationEngine.evaluate.mockResolvedValue(mockOutput);

    const result = await toolHandler({
      file_path: '/path/to/report.pdf',
      report_type: 'soc2',
    });

    expect(evaluationEngine.evaluate).toHaveBeenCalledWith({
      file_path: '/path/to/report.pdf',
      report_type: 'soc2',
      control_id: undefined,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockOutput, null, 2),
        },
      ],
    });
  });

  it('passes control_id to the evaluation engine when provided', async () => {
    const mockOutput: EvaluateSubmissionOutput = {
      report_type: 'wafr',
      file_path: '/path/to/wafr.pdf',
      overall_decision: 'PASS',
      summary: { passed: 1, failed: 0, errored: 0, total: 1 },
      results: [
        { control_id: 'WAFR-FTR-001', decision: 'PASS', reason: 'Meets criteria.' },
      ],
    };

    evaluationEngine.evaluate.mockResolvedValue(mockOutput);

    await toolHandler({
      file_path: '/path/to/wafr.pdf',
      report_type: 'wafr',
      control_id: 'WAFR-FTR-001',
    });

    expect(evaluationEngine.evaluate).toHaveBeenCalledWith({
      file_path: '/path/to/wafr.pdf',
      report_type: 'wafr',
      control_id: 'WAFR-FTR-001',
    });
  });

  it('returns an MCP tool error when the evaluation engine throws', async () => {
    evaluationEngine.evaluate.mockRejectedValue(
      new Error('AWS credentials are not configured')
    );

    const result = await toolHandler({
      file_path: '/path/to/report.pdf',
      report_type: 'soc2',
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'AWS credentials are not configured',
        },
      ],
      isError: true,
    });
  });

  it('handles non-Error thrown values gracefully', async () => {
    evaluationEngine.evaluate.mockRejectedValue('unexpected string error');

    const result = await toolHandler({
      file_path: '/path/to/report.pdf',
      report_type: 'soc2',
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'unexpected string error',
        },
      ],
      isError: true,
    });
  });
});
