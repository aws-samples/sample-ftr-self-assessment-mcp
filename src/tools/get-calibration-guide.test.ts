import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { registerGetCalibrationGuideTool } from './get-calibration-guide.js';
import { CalibrationGuideRegistry } from '../registries/calibration-guide-registry.js';

describe('get_calibration_guide tool handler', () => {
  let mockServer: any;
  let registeredHandler: any;
  let registeredName: string;
  let registry: CalibrationGuideRegistry;

  beforeEach(() => {
    // Capture the tool registration call
    mockServer = {
      tool: vi.fn((name: string, _description: string, _schema: any, handler: any) => {
        registeredName = name;
        registeredHandler = handler;
      }),
    };

    registry = new CalibrationGuideRegistry();
    registerGetCalibrationGuideTool(mockServer, registry);
  });

  it('registers the tool with name "get_calibration_guide"', () => {
    expect(mockServer.tool).toHaveBeenCalledOnce();
    expect(registeredName).toBe('get_calibration_guide');
  });

  it('returns full SOC 2 calibration guide when no control_id is provided', async () => {
    const result = await registeredHandler({ report_type: 'soc2' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const output = JSON.parse(result.content[0].text);
    expect(output.report_type).toBe('soc2');
    expect(output.content).toBeDefined();
    expect(output.content.length).toBeGreaterThan(0);
  });

  it('returns full WAFR calibration guide when no control_id is provided', async () => {
    const result = await registeredHandler({ report_type: 'wafr' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const output = JSON.parse(result.content[0].text);
    expect(output.report_type).toBe('wafr');
    expect(output.content).toBeDefined();
    expect(output.content.length).toBeGreaterThan(0);
  });

  it('returns a specific section when control_id is provided', async () => {
    const result = await registeredHandler({ report_type: 'soc2', control_id: 'SOC-001' });

    expect(result.isError).toBeUndefined();
    const output = JSON.parse(result.content[0].text);
    expect(output.report_type).toBe('soc2');
    expect(output.content).toContain('SOC-001');
  });

  it('returns an error for invalid report type', async () => {
    const result = await registeredHandler({ report_type: 'invalid' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('soc2');
    expect(result.content[0].text).toContain('wafr');
  });

  it('returns full guide when control_id is not found in the guide', async () => {
    const result = await registeredHandler({ report_type: 'soc2', control_id: 'NONEXISTENT-999' });

    // The registry returns the full guide when section is not found
    expect(result.isError).toBeUndefined();
    const output = JSON.parse(result.content[0].text);
    expect(output.report_type).toBe('soc2');
    expect(output.content.length).toBeGreaterThan(0);
  });
});
