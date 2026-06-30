import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ControlResult } from './types.js';

// --- Mock all dependencies ---

const mockValidateAwsCredentials = vi.fn();
vi.mock('./cli/credential-validator.js', () => ({
  validateAwsCredentials: (...args: unknown[]) => mockValidateAwsCredentials(...args),
}));

const mockCollectInputs = vi.fn();
vi.mock('./cli/input-collector.js', () => ({
  collectInputs: (...args: unknown[]) => mockCollectInputs(...args),
}));

const mockProgressReporter = {
  start: vi.fn(),
  update: vi.fn(),
  stop: vi.fn(),
};
const mockCreateProgressReporter = vi.fn().mockResolvedValue(mockProgressReporter);
vi.mock('./cli/progress-reporter.js', () => ({
  createProgressReporter: (...args: unknown[]) => mockCreateProgressReporter(...args),
}));

const mockFormatResults = vi.fn();
vi.mock('./cli/results-formatter.js', () => ({
  formatResults: (...args: unknown[]) => mockFormatResults(...args),
}));

const mockParse = vi.fn();
vi.mock('./parsers/pdf-parser.js', () => ({
  PdfParser: vi.fn().mockImplementation(() => ({
    parse: mockParse,
  })),
}));

const mockGetControlIds = vi.fn();
const mockGetControls = vi.fn();
vi.mock('./registries/control-registry.js', () => ({
  ControlRegistry: vi.fn().mockImplementation(() => ({
    getControlIds: mockGetControlIds,
    getControls: mockGetControls,
  })),
}));

vi.mock('./registries/calibration-guide-registry.js', () => ({
  CalibrationGuideRegistry: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('./engine/prompt-builder.js', () => ({
  PromptBuilder: {
    fromAssets: vi.fn().mockReturnValue({}),
  },
}));

vi.mock('./engine/bedrock-client.js', () => ({
  BedrockClient: vi.fn().mockImplementation(() => ({})),
}));

const mockEvaluateControl = vi.fn();
vi.mock('./engine/evaluation-engine.js', () => ({
  EvaluationEngine: vi.fn().mockImplementation(() => ({
    evaluateControl: mockEvaluateControl,
  })),
}));

vi.mock('./config.js', () => ({
  resolveConfig: vi.fn().mockReturnValue({
    transport: 'stdio',
    port: 3000,
    awsRegion: 'us-east-1',
    bedrockModelId: 'test-model',
    logLevel: 'info',
  }),
}));

vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
  },
}));

// Mock process.exit to prevent test process from exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
  throw new Error('process.exit called');
}) as never);

// Spy on console.error and console.log
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('runEvaluateCli', () => {
  let runEvaluateCli: typeof import('./cli.js').runEvaluateCli;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to get fresh module with mocks applied
    const cliModule = await import('./cli.js');
    runEvaluateCli = cliModule.runEvaluateCli;
  });

  afterEach(() => {
    // Remove any lingering SIGINT listeners added by tests
    process.removeAllListeners('SIGINT');
  });

  describe('credential validation', () => {
    it('should call credential validation first and exit with code 1 on failure', async () => {
      mockValidateAwsCredentials.mockRejectedValueOnce(
        new Error('AWS credentials are not configured'),
      );

      await expect(runEvaluateCli({})).rejects.toThrow('process.exit called');

      // Credential validation was called
      expect(mockValidateAwsCredentials).toHaveBeenCalledWith('us-east-1');
      // process.exit(1) was called
      expect(mockExit).toHaveBeenCalledWith(1);
      // Error message was displayed
      expect(mockConsoleError).toHaveBeenCalled();
      // No further steps were taken
      expect(mockCollectInputs).not.toHaveBeenCalled();
      expect(mockEvaluateControl).not.toHaveBeenCalled();
    });

    it('should proceed to input collection when credentials are valid', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'soc2',
        filePath: '/tmp/report.pdf',
        controlId: undefined,
      });
      mockParse.mockResolvedValueOnce({ text: 'pdf content', char_count: 11, page_count: 1 });
      mockGetControlIds.mockReturnValueOnce(['SOC-001']);
      mockEvaluateControl.mockResolvedValueOnce({
        control_id: 'SOC-001',
        decision: 'PASS',
        reason: 'Looks good',
      });

      await runEvaluateCli({});

      expect(mockValidateAwsCredentials).toHaveBeenCalled();
      expect(mockCollectInputs).toHaveBeenCalled();
    });
  });

  describe('successful evaluation', () => {
    it('should evaluate all controls and call formatResults with correct output', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'soc2',
        filePath: '/tmp/report.pdf',
        controlId: undefined,
      });
      mockParse.mockResolvedValueOnce({ text: 'pdf content', char_count: 11, page_count: 1 });
      mockGetControlIds.mockReturnValueOnce(['SOC-001', 'SOC-002', 'SOC-003']);

      const results: ControlResult[] = [
        { control_id: 'SOC-001', decision: 'PASS', reason: 'Control 1 passes' },
        { control_id: 'SOC-002', decision: 'FAIL', reason: 'Control 2 fails' },
        { control_id: 'SOC-003', decision: 'PASS', reason: 'Control 3 passes' },
      ];

      mockEvaluateControl
        .mockResolvedValueOnce(results[0])
        .mockResolvedValueOnce(results[1])
        .mockResolvedValueOnce(results[2]);

      await runEvaluateCli({});

      // Progress reporter was started and stopped
      expect(mockProgressReporter.start).toHaveBeenCalledWith(
        'Evaluating 3 check(s) for SOC2...',
      );
      expect(mockProgressReporter.update).toHaveBeenCalledTimes(3);
      expect(mockProgressReporter.update).toHaveBeenCalledWith(1, 3, 'SOC-001', 'PASS');
      expect(mockProgressReporter.update).toHaveBeenCalledWith(2, 3, 'SOC-002', 'FAIL');
      expect(mockProgressReporter.update).toHaveBeenCalledWith(3, 3, 'SOC-003', 'PASS');
      expect(mockProgressReporter.stop).toHaveBeenCalledWith(true);

      // formatResults was called with the correct output structure
      expect(mockFormatResults).toHaveBeenCalledWith({
        report_type: 'soc2',
        file_path: '/tmp/report.pdf',
        overall_decision: 'FAIL', // One control failed
        summary: {
          passed: 2,
          failed: 1,
          errored: 0,
          total: 3,
        },
        results,
      });
    });

    it('should evaluate a single control when controlId is specified', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'wafr',
        filePath: '/tmp/wafr-report.pdf',
        controlId: 'WAFR-SEC-01',
      });
      mockParse.mockResolvedValueOnce({ text: 'wafr pdf content', char_count: 16, page_count: 2 });
      // When controlId is specified, getControlIds is not called for all controls
      // The CLI uses the controlId directly
      mockEvaluateControl.mockResolvedValueOnce({
        control_id: 'WAFR-SEC-01',
        decision: 'PASS',
        reason: 'Security control passes',
      });

      await runEvaluateCli({});

      expect(mockProgressReporter.start).toHaveBeenCalledWith(
        'Evaluating 1 check(s) for WAFR...',
      );
      expect(mockEvaluateControl).toHaveBeenCalledTimes(1);
      expect(mockEvaluateControl).toHaveBeenCalledWith('wafr pdf content', 'WAFR-SEC-01', 'wafr');
      expect(mockFormatResults).toHaveBeenCalledWith(
        expect.objectContaining({
          overall_decision: 'PASS',
          summary: { passed: 1, failed: 0, errored: 0, total: 1 },
        }),
      );
    });
  });

  describe('per-control error handling', () => {
    it('should include ERROR result and continue evaluating remaining controls', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'soc2',
        filePath: '/tmp/report.pdf',
        controlId: undefined,
      });
      mockParse.mockResolvedValueOnce({ text: 'pdf content', char_count: 11, page_count: 1 });
      mockGetControlIds.mockReturnValueOnce(['SOC-001', 'SOC-002', 'SOC-003']);

      // Second control throws an error
      mockEvaluateControl
        .mockResolvedValueOnce({
          control_id: 'SOC-001',
          decision: 'PASS',
          reason: 'Control 1 passes',
        })
        .mockRejectedValueOnce(new Error('Bedrock throttling error'))
        .mockResolvedValueOnce({
          control_id: 'SOC-003',
          decision: 'PASS',
          reason: 'Control 3 passes',
        });

      await runEvaluateCli({});

      // All three controls were attempted
      expect(mockEvaluateControl).toHaveBeenCalledTimes(3);

      // Progress was updated for all three including the error
      expect(mockProgressReporter.update).toHaveBeenCalledWith(2, 3, 'SOC-002', 'ERROR');

      // formatResults was called with the ERROR result included
      expect(mockFormatResults).toHaveBeenCalledWith(
        expect.objectContaining({
          overall_decision: 'FAIL', // ERROR means not all PASS
          summary: {
            passed: 2,
            failed: 0,
            errored: 1,
            total: 3,
          },
          results: expect.arrayContaining([
            expect.objectContaining({
              control_id: 'SOC-002',
              decision: 'ERROR',
              reason: 'Bedrock throttling error',
            }),
          ]),
        }),
      );
    });

    it('should truncate error messages to 2000 characters', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'soc2',
        filePath: '/tmp/report.pdf',
        controlId: undefined,
      });
      mockParse.mockResolvedValueOnce({ text: 'pdf content', char_count: 11, page_count: 1 });
      mockGetControlIds.mockReturnValueOnce(['SOC-001']);

      const longError = 'x'.repeat(3000);
      mockEvaluateControl.mockRejectedValueOnce(new Error(longError));

      await runEvaluateCli({});

      expect(mockFormatResults).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({
              control_id: 'SOC-001',
              decision: 'ERROR',
              reason: expect.any(String),
            }),
          ],
        }),
      );

      const output = mockFormatResults.mock.calls[0][0];
      expect(output.results[0].reason.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('SIGINT handling during evaluation', () => {
    it('should display partial results when SIGINT is received during evaluation', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'soc2',
        filePath: '/tmp/report.pdf',
        controlId: undefined,
      });
      mockParse.mockResolvedValueOnce({ text: 'pdf content', char_count: 11, page_count: 1 });
      mockGetControlIds.mockReturnValueOnce(['SOC-001', 'SOC-002', 'SOC-003']);

      // First control succeeds, second control triggers SIGINT during evaluation
      mockEvaluateControl
        .mockResolvedValueOnce({
          control_id: 'SOC-001',
          decision: 'PASS',
          reason: 'Control 1 passes',
        })
        .mockImplementationOnce(async () => {
          // Emit SIGINT during the second control evaluation
          process.emit('SIGINT', 'SIGINT');
          return {
            control_id: 'SOC-002',
            decision: 'FAIL',
            reason: 'Control 2 fails',
          };
        });

      await expect(runEvaluateCli({})).rejects.toThrow('process.exit called');

      // Progress reporter was stopped with failure indicator
      expect(mockProgressReporter.stop).toHaveBeenCalledWith(false);

      // process.exit(0) was called for graceful cancellation
      expect(mockExit).toHaveBeenCalledWith(0);

      // formatResults was called with partial results (the controls that completed)
      expect(mockFormatResults).toHaveBeenCalled();
      const output = mockFormatResults.mock.calls[0][0];
      // Should have the results that completed before/during cancellation
      expect(output.results.length).toBeLessThanOrEqual(2);
      expect(output.results.length).toBeGreaterThanOrEqual(1);
    });

    it('should display interruption message when SIGINT is received', async () => {
      mockValidateAwsCredentials.mockResolvedValueOnce(true);
      mockCollectInputs.mockResolvedValueOnce({
        reportType: 'soc2',
        filePath: '/tmp/report.pdf',
        controlId: undefined,
      });
      mockParse.mockResolvedValueOnce({ text: 'pdf content', char_count: 11, page_count: 1 });
      mockGetControlIds.mockReturnValueOnce(['SOC-001', 'SOC-002']);

      mockEvaluateControl.mockImplementationOnce(async () => {
        // Emit SIGINT during the first control evaluation
        process.emit('SIGINT', 'SIGINT');
        return {
          control_id: 'SOC-001',
          decision: 'PASS',
          reason: 'Control 1 passes',
        };
      });

      await expect(runEvaluateCli({})).rejects.toThrow('process.exit called');

      // Should display interruption message
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('interrupted'),
      );

      // Exit with code 0 (graceful cancellation)
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});
