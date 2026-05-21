import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { validateFilePath, collectInputs } from './input-collector.js';
import type { CliOptions } from '../cli.js';
import type { ControlRegistry } from '../registries/control-registry.js';

// Mock node:fs to control existsSync behavior
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// Mock inquirer for interactive mode tests
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

import { existsSync } from 'node:fs';
import inquirer from 'inquirer';

const mockedExistsSync = vi.mocked(existsSync);
const mockedPrompt = vi.mocked(inquirer.prompt);

describe('validateFilePath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject empty input', () => {
    const result = validateFilePath('');
    expect(result).toBe('Please enter a file path.');
  });

  it('should reject whitespace-only input', () => {
    const result = validateFilePath('   ');
    expect(result).toBe('Please enter a file path.');
  });

  it('should reject files without .pdf extension', () => {
    const result = validateFilePath('report.txt');
    expect(result).toBe('File must have a .pdf extension.');
  });

  it('should reject files with no extension', () => {
    const result = validateFilePath('report');
    expect(result).toBe('File must have a .pdf extension.');
  });

  it('should reject files with similar but incorrect extensions', () => {
    expect(validateFilePath('report.pdfx')).toBe('File must have a .pdf extension.');
    expect(validateFilePath('report.pd')).toBe('File must have a .pdf extension.');
    expect(validateFilePath('report.doc')).toBe('File must have a .pdf extension.');
  });

  it('should accept .pdf extension case-insensitively', () => {
    mockedExistsSync.mockReturnValue(true);
    expect(validateFilePath('report.PDF')).toBe(true);
    expect(validateFilePath('report.Pdf')).toBe(true);
    expect(validateFilePath('report.pDf')).toBe(true);
  });

  it('should reject a .pdf file that does not exist', () => {
    mockedExistsSync.mockReturnValue(false);
    const result = validateFilePath('nonexistent.pdf');
    expect(result).toContain('File not found:');
    expect(result).toContain('nonexistent.pdf');
  });

  it('should accept a .pdf file that exists', () => {
    mockedExistsSync.mockReturnValue(true);
    const result = validateFilePath('report.pdf');
    expect(result).toBe(true);
  });

  it('should resolve relative paths before checking existence', () => {
    mockedExistsSync.mockReturnValue(true);
    validateFilePath('./relative/path/report.pdf');
    expect(mockedExistsSync).toHaveBeenCalledWith(resolve('./relative/path/report.pdf'));
  });

  it('should handle absolute paths', () => {
    mockedExistsSync.mockReturnValue(true);
    validateFilePath('/absolute/path/report.pdf');
    expect(mockedExistsSync).toHaveBeenCalledWith('/absolute/path/report.pdf');
  });

  it('should trim whitespace from input before validation', () => {
    mockedExistsSync.mockReturnValue(true);
    const result = validateFilePath('  report.pdf  ');
    expect(result).toBe(true);
  });
});


describe('collectInputs', () => {
  let mockControlRegistry: ControlRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    mockControlRegistry = {
      getControls: vi.fn().mockReturnValue([
        { control_id: 'SOC-001', title: 'Logical Access Controls', description: '', criteria: '', edge_cases: '', examples: '' },
        { control_id: 'SOC-002', title: 'Change Management', description: '', criteria: '', edge_cases: '', examples: '' },
      ]),
      getControl: vi.fn().mockReturnValue({
        control_id: 'SOC-001', title: 'Logical Access Controls', description: '', criteria: '', edge_cases: '', examples: '',
      }),
      getControlIds: vi.fn().mockReturnValue(['SOC-001', 'SOC-002']),
    } as unknown as ControlRegistry;
  });

  describe('non-interactive mode', () => {
    it('should return EvaluationInputs without prompting when all flags are valid', async () => {
      mockedExistsSync.mockReturnValue(true);

      const options: CliOptions = {
        reportType: 'soc2',
        file: 'report.pdf',
      };

      const result = await collectInputs(options, mockControlRegistry);

      expect(result.reportType).toBe('soc2');
      expect(result.filePath).toBe(resolve('report.pdf'));
      expect(result.controlId).toBeUndefined();
      // Verify no interactive prompts were called
      expect(mockedPrompt).not.toHaveBeenCalled();
    });

    it('should pass through controlId when provided', async () => {
      mockedExistsSync.mockReturnValue(true);

      const options: CliOptions = {
        reportType: 'soc2',
        file: 'report.pdf',
        controlId: 'SOC-001',
      };

      const result = await collectInputs(options, mockControlRegistry);

      expect(result.controlId).toBe('SOC-001');
      expect(mockControlRegistry.getControl).toHaveBeenCalledWith('soc2', 'SOC-001');
    });

    it('should throw error mentioning "--file" when file flag is missing', async () => {
      const options: CliOptions = {
        reportType: 'soc2',
      };

      await expect(collectInputs(options, mockControlRegistry)).rejects.toThrow('--file');
    });

    it('should throw error mentioning "--report-type" when report-type flag is missing', async () => {
      const options: CliOptions = {
        file: 'report.pdf',
      };

      await expect(collectInputs(options, mockControlRegistry)).rejects.toThrow('--report-type');
    });

    it('should throw error for invalid report type', async () => {
      const options: CliOptions = {
        reportType: 'invalid',
        file: 'report.pdf',
      };

      await expect(collectInputs(options, mockControlRegistry)).rejects.toThrow(
        'Invalid report type "invalid"',
      );
    });

    it('should throw error when file does not exist', async () => {
      mockedExistsSync.mockReturnValue(false);

      const options: CliOptions = {
        reportType: 'soc2',
        file: 'nonexistent.pdf',
      };

      await expect(collectInputs(options, mockControlRegistry)).rejects.toThrow('File not found');
    });

    it('should throw error when file does not have .pdf extension', async () => {
      const options: CliOptions = {
        reportType: 'soc2',
        file: 'report.txt',
      };

      await expect(collectInputs(options, mockControlRegistry)).rejects.toThrow(
        'File must have a .pdf extension',
      );
    });
  });

  describe('interactive mode', () => {
    it('should call interactive prompts when no flags are provided', async () => {
      // Mock the three sequential prompts
      mockedPrompt
        .mockResolvedValueOnce({ reportType: 'wafr' })   // promptReportType
        .mockResolvedValueOnce({ filePath: '/tmp/report.pdf' })  // promptFilePath
        .mockResolvedValueOnce({ controlId: undefined });  // promptControlSelection

      const options: CliOptions = {};

      const result = await collectInputs(options, mockControlRegistry);

      expect(result.reportType).toBe('wafr');
      expect(result.filePath).toBe(resolve('/tmp/report.pdf'));
      expect(result.controlId).toBeUndefined();
      // Verify prompts were invoked
      expect(mockedPrompt).toHaveBeenCalledTimes(3);
    });

    it('should pass selected control ID from interactive prompt', async () => {
      mockedPrompt
        .mockResolvedValueOnce({ reportType: 'soc2' })
        .mockResolvedValueOnce({ filePath: '/tmp/report.pdf' })
        .mockResolvedValueOnce({ controlId: 'SOC-001' });

      const options: CliOptions = {};

      const result = await collectInputs(options, mockControlRegistry);

      expect(result.reportType).toBe('soc2');
      expect(result.controlId).toBe('SOC-001');
    });
  });
});
