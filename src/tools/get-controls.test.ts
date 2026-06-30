import { describe, it, expect, beforeAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ControlRegistry } from '../registries/control-registry.js';
import { registerGetControlsTool } from './get-controls.js';
import { GetControlsOutput } from '../types.js';

/**
 * Helper to invoke a registered tool on the McpServer by simulating a tool call.
 * Since McpServer doesn't expose a direct "call tool" method for testing,
 * we test the handler logic by directly calling the registry and verifying
 * the tool registration works with the MCP server.
 */
describe('get_controls tool handler', () => {
  let controlRegistry: ControlRegistry;
  let server: McpServer;

  beforeAll(() => {
    controlRegistry = new ControlRegistry();
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    registerGetControlsTool(server, controlRegistry);
  });

  describe('registration', () => {
    it('registers the tool without throwing', () => {
      // If we get here, registration succeeded in beforeAll
      expect(server).toBeDefined();
    });
  });

  describe('handler logic - SOC 2 controls', () => {
    it('returns all 5 SOC 2 controls when no control_id specified', () => {
      const controls = controlRegistry.getControls('soc2');
      const output: GetControlsOutput = {
        report_type: 'soc2',
        controls,
      };
      expect(output.controls).toHaveLength(5);
      expect(output.report_type).toBe('soc2');
      const ids = output.controls.map(c => c.control_id);
      expect(ids).toEqual(['SOC-001', 'SOC-002', 'SOC-003', 'SOC-004', 'SOC-005']);
    });

    it('returns a single SOC 2 control when control_id is specified', () => {
      const control = controlRegistry.getControl('soc2', 'SOC-001');
      const output: GetControlsOutput = {
        report_type: 'soc2',
        controls: [control],
      };
      expect(output.controls).toHaveLength(1);
      expect(output.controls[0].control_id).toBe('SOC-001');
    });
  });

  describe('handler logic - WAFR controls', () => {
    it('returns all 6 WAFR controls when no control_id specified', () => {
      const controls = controlRegistry.getControls('wafr');
      const output: GetControlsOutput = {
        report_type: 'wafr',
        controls,
      };
      expect(output.controls).toHaveLength(6);
      expect(output.report_type).toBe('wafr');
      const ids = output.controls.map(c => c.control_id);
      expect(ids).toEqual(['WAFR-FTR-001', 'WAFR-FTR-002', 'WAFR-FTR-003', 'WAFR-FTR-004', 'WAFR-FTR-005', 'WAFR-FTR-006']);
    });

    it('returns a single WAFR control when control_id is specified', () => {
      const control = controlRegistry.getControl('wafr', 'WAFR-FTR-002');
      const output: GetControlsOutput = {
        report_type: 'wafr',
        controls: [control],
      };
      expect(output.controls).toHaveLength(1);
      expect(output.controls[0].control_id).toBe('WAFR-FTR-002');
    });
  });

  describe('handler logic - error cases', () => {
    it('throws error for invalid report type', () => {
      expect(() => controlRegistry.getControls('invalid' as any)).toThrow(
        'Invalid report type "invalid". Valid report types: soc2, wafr'
      );
    });

    it('throws error for non-existent control ID', () => {
      expect(() => controlRegistry.getControl('soc2', 'SOC-999')).toThrow(
        'Control ID "SOC-999" not found for report type "soc2"'
      );
    });

    it('error message for invalid report type contains valid options', () => {
      try {
        controlRegistry.getControls('bad' as any);
      } catch (e: any) {
        expect(e.message).toContain('soc2');
        expect(e.message).toContain('wafr');
      }
    });

    it('error message for non-existent control ID lists valid IDs', () => {
      try {
        controlRegistry.getControl('wafr', 'INVALID');
      } catch (e: any) {
        expect(e.message).toContain('WAFR-FTR-001');
        expect(e.message).toContain('WAFR-FTR-002');
        expect(e.message).toContain('WAFR-FTR-003');
        expect(e.message).toContain('WAFR-FTR-004');
      }
    });
  });

  describe('output format', () => {
    it('output serializes to valid JSON with expected structure', () => {
      const controls = controlRegistry.getControls('soc2');
      const output: GetControlsOutput = {
        report_type: 'soc2',
        controls,
      };
      const json = JSON.stringify(output, null, 2);
      const parsed = JSON.parse(json);
      expect(parsed.report_type).toBe('soc2');
      expect(parsed.controls).toBeInstanceOf(Array);
      expect(parsed.controls[0]).toHaveProperty('control_id');
      expect(parsed.controls[0]).toHaveProperty('title');
      expect(parsed.controls[0]).toHaveProperty('description');
      expect(parsed.controls[0]).toHaveProperty('criteria');
      expect(parsed.controls[0]).toHaveProperty('edge_cases');
      expect(parsed.controls[0]).toHaveProperty('examples');
    });
  });
});
