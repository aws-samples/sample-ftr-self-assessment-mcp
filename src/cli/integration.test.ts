/**
 * Integration test for CLI non-interactive mode.
 *
 * Exercises the full CLI flow with mocked external dependencies (AWS STS, Bedrock).
 * Verifies that when --report-type, --file, and --control-id flags are provided,
 * the CLI skips interactive prompts and produces formatted output.
 *
 * Validates: Requirements 8.1, 8.2, 8.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';

// --- Mock external AWS dependencies ---

vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({
      Account: '123456789012',
      Arn: 'arn:aws:iam::123456789012:user/test-user',
      UserId: 'AIDEXAMPLE',
    }),
  })),
  GetCallerIdentityCommand: vi.fn(),
}));

const mockBedrockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
    send: mockBedrockSend,
  })),
  InvokeModelCommand: vi.fn().mockImplementation((input: unknown) => input),
}));

// Track whether inquirer is ever imported/called
const inquirerPromptSpy = vi.fn();
vi.mock('inquirer', () => ({
  default: {
    prompt: inquirerPromptSpy,
  },
}));

// Mock process.exit to prevent test process from exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
  throw new Error('process.exit called');
}) as never);

// Capture console.log output for verification
const consoleLogOutput: string[] = [];
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
  consoleLogOutput.push(args.map(String).join(' '));
});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('CLI Non-Interactive Mode Integration', () => {
  const testPdfPath = path.resolve(
    __dirname,
    '../../test_files/FTR_WAFR_PASSING_wellarchitected.pdf',
  );

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogOutput.length = 0;

    // Mock Bedrock to return a PASS decision
    mockBedrockSend.mockResolvedValue({
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [
            {
              text: 'Decision: PASS\n\nThe report demonstrates compliance with the control requirements. The WAFR was conducted by an authorized reviewer within the required timeframe.',
            },
          ],
        }),
      ),
    });
  });

  afterEach(() => {
    process.removeAllListeners('SIGINT');
  });

  it('should skip prompts and produce formatted output when all flags are provided', async () => {
    const { runEvaluateCli } = await import('../cli.js');

    await runEvaluateCli({
      reportType: 'wafr',
      file: testPdfPath,
      controlId: 'WAFR-FTR-001',
      region: 'us-east-1',
    });

    // Verify inquirer was never called (no interactive prompts)
    expect(inquirerPromptSpy).not.toHaveBeenCalled();

    // Verify Bedrock was called (evaluation happened)
    expect(mockBedrockSend).toHaveBeenCalled();

    // Verify formatted output was produced (console.log was called with results)
    const fullOutput = consoleLogOutput.join('\n');
    expect(fullOutput).toContain('FTR Evaluation Results');
    expect(fullOutput).toContain('WAFR');
    expect(fullOutput).toContain('PASS');
  });

  it('should evaluate a single control when --control-id is provided', async () => {
    const { runEvaluateCli } = await import('../cli.js');

    await runEvaluateCli({
      reportType: 'wafr',
      file: testPdfPath,
      controlId: 'WAFR-FTR-001',
    });

    // Bedrock should be called exactly once (single control)
    expect(mockBedrockSend).toHaveBeenCalledTimes(1);

    // Output should contain the control ID
    const fullOutput = consoleLogOutput.join('\n');
    expect(fullOutput).toContain('WAFR-FTR-001');
  });

  it('should evaluate all controls when --control-id is not provided', async () => {
    const { runEvaluateCli } = await import('../cli.js');

    await runEvaluateCli({
      reportType: 'wafr',
      file: testPdfPath,
    });

    // Bedrock should be called 4 times (all WAFR controls)
    expect(mockBedrockSend).toHaveBeenCalledTimes(4);

    // Output should contain summary with all controls
    const fullOutput = consoleLogOutput.join('\n');
    expect(fullOutput).toContain('4 passed');
    expect(fullOutput).toContain('4 total');
  });

  it('should display FAIL results correctly when Bedrock returns FAIL', async () => {
    // Override mock to return FAIL for this test
    mockBedrockSend.mockResolvedValue({
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [
            {
              text: 'Decision: FAIL\n\nThe report does not demonstrate compliance. The WAFR was not conducted by an authorized reviewer.',
            },
          ],
        }),
      ),
    });

    const { runEvaluateCli } = await import('../cli.js');

    await runEvaluateCli({
      reportType: 'wafr',
      file: testPdfPath,
      controlId: 'WAFR-FTR-001',
    });

    // Output should contain FAIL
    const fullOutput = consoleLogOutput.join('\n');
    expect(fullOutput).toContain('FAIL');
    expect(fullOutput).toContain('WAFR-FTR-001');
  });

  it('should handle Bedrock errors gracefully and mark control as ERROR', async () => {
    // Override mock to throw an error
    mockBedrockSend.mockRejectedValue(new Error('Bedrock throttling error'));

    const { runEvaluateCli } = await import('../cli.js');

    await runEvaluateCli({
      reportType: 'wafr',
      file: testPdfPath,
      controlId: 'WAFR-FTR-001',
    });

    // Output should contain ERROR indication
    const fullOutput = consoleLogOutput.join('\n');
    expect(fullOutput).toContain('WAFR-FTR-001');
    expect(fullOutput).toContain('1 errors');
  });

  it('should not invoke inquirer prompts in non-interactive mode', async () => {
    const { runEvaluateCli } = await import('../cli.js');

    await runEvaluateCli({
      reportType: 'wafr',
      file: testPdfPath,
      controlId: 'WAFR-FTR-001',
    });

    // Verify inquirer.prompt was never called
    expect(inquirerPromptSpy).not.toHaveBeenCalled();
  });

  it('should exit with error when file does not exist in non-interactive mode', async () => {
    const { runEvaluateCli } = await import('../cli.js');

    await expect(
      runEvaluateCli({
        reportType: 'wafr',
        file: '/nonexistent/path/report.pdf',
        controlId: 'WAFR-FTR-001',
      }),
    ).rejects.toThrow();

    // Bedrock should not be called since validation fails
    expect(mockBedrockSend).not.toHaveBeenCalled();
  });

  it('should exit with error for invalid report type in non-interactive mode', async () => {
    const { runEvaluateCli } = await import('../cli.js');

    await expect(
      runEvaluateCli({
        reportType: 'invalid',
        file: testPdfPath,
        controlId: 'WAFR-FTR-001',
      }),
    ).rejects.toThrow();

    // Bedrock should not be called since validation fails
    expect(mockBedrockSend).not.toHaveBeenCalled();
  });
});
