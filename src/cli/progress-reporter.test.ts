import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProgressReporter } from './progress-reporter.js';

const mockSpinner = {
  start: vi.fn(),
  succeed: vi.fn(),
  fail: vi.fn(),
  text: '',
};

vi.mock('ora', () => {
  return {
    default: vi.fn(() => mockSpinner),
  };
});

vi.mock('chalk', () => {
  return {
    default: {
      green: vi.fn((text: string) => `\x1b[32m${text}\x1b[0m`),
      red: vi.fn((text: string) => `\x1b[31m${text}\x1b[0m`),
      yellow: vi.fn((text: string) => `\x1b[33m${text}\x1b[0m`),
    },
  };
});

describe('createProgressReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpinner.text = '';
  });

  it('should call spinner.start with the provided message', async () => {
    const reporter = await createProgressReporter();

    reporter.start('Evaluating 5 control(s) for SOC2...');

    expect(mockSpinner.start).toHaveBeenCalledWith('Evaluating 5 control(s) for SOC2...');
  });

  it('should update spinner text with progress format on update', async () => {
    const reporter = await createProgressReporter();

    reporter.update(3, 10, 'SOC-003', 'PASS');

    expect(mockSpinner.text).toContain('[3/10]');
    expect(mockSpinner.text).toContain('Evaluated SOC-003');
    expect(mockSpinner.text).toContain('PASS');
  });

  it('should call spinner.succeed when stop is called with success=true', async () => {
    const reporter = await createProgressReporter();

    reporter.stop(true);

    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });

  it('should call spinner.fail when stop is called with success=false', async () => {
    const reporter = await createProgressReporter();

    reporter.stop(false);

    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(mockSpinner.succeed).not.toHaveBeenCalled();
  });

  it('should colorize PASS decision in green', async () => {
    const reporter = await createProgressReporter();
    const chalk = (await import('chalk')).default;

    reporter.update(1, 5, 'SOC-001', 'PASS');

    expect(chalk.green).toHaveBeenCalledWith('PASS');
  });

  it('should colorize FAIL decision in red', async () => {
    const reporter = await createProgressReporter();
    const chalk = (await import('chalk')).default;

    reporter.update(2, 5, 'SOC-002', 'FAIL');

    expect(chalk.red).toHaveBeenCalledWith('FAIL');
  });

  it('should colorize ERROR decision in yellow', async () => {
    const reporter = await createProgressReporter();
    const chalk = (await import('chalk')).default;

    reporter.update(3, 5, 'SOC-003', 'ERROR');

    expect(chalk.yellow).toHaveBeenCalledWith('ERROR');
  });

  it('should show correct progress count after i-th control completes (Property 7)', async () => {
    const reporter = await createProgressReporter();
    const total = 8;

    for (let i = 1; i <= total; i++) {
      reporter.update(i, total, `CTRL-${i}`, 'PASS');
      expect(mockSpinner.text).toContain(`[${i}/${total}]`);
    }
  });

  it('should not colorize unknown decision values', async () => {
    const reporter = await createProgressReporter();
    const chalk = (await import('chalk')).default;

    reporter.update(1, 5, 'SOC-001', 'UNKNOWN');

    expect(chalk.green).not.toHaveBeenCalled();
    expect(chalk.red).not.toHaveBeenCalled();
    expect(chalk.yellow).not.toHaveBeenCalled();
    expect(mockSpinner.text).toContain('UNKNOWN');
  });
});
