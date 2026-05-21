import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import * as path from 'node:path';

describe('FTR MCP Server entry point', () => {
  const serverPath = path.join(__dirname, 'server.ts');

  describe('CLI --help', () => {
    it('should display top-level help with subcommands', async () => {
      const result = await runServer(['--help']);
      expect(result.stdout).toContain('ftr-mcp-server');
      expect(result.stdout).toContain('serve');
      expect(result.stdout).toContain('evaluate');
    });

    it('should display serve subcommand help with all options', async () => {
      const result = await runServer(['serve', '--help']);
      expect(result.stdout).toContain('--transport');
      expect(result.stdout).toContain('--port');
      expect(result.stdout).toContain('--region');
      expect(result.stdout).toContain('--model');
      expect(result.stdout).toContain('--log-level');
    });

    it('should display evaluate subcommand help with all options', async () => {
      const result = await runServer(['evaluate', '--help']);
      expect(result.stdout).toContain('--report-type');
      expect(result.stdout).toContain('--file');
      expect(result.stdout).toContain('--control-id');
      expect(result.stdout).toContain('--region');
      expect(result.stdout).toContain('--model');
    });
  });

  describe('CLI --version', () => {
    it('should display version number', async () => {
      const result = await runServer(['--version']);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('server startup logging', () => {
    it('should log configured region and model at info level', async () => {
      // Start the server with stdio transport - it will log to stderr then wait for input
      const result = await runServerWithTimeout(['--transport', 'stdio', '--region', 'us-west-2', '--model', 'test-model'], 3000);
      expect(result.stderr).toContain('region: us-west-2');
      expect(result.stderr).toContain('model: test-model');
      expect(result.stderr).toContain('transport: stdio');
    });

    it('should use default region and model when not specified', async () => {
      const result = await runServerWithTimeout(['serve', '--transport', 'stdio'], 3000);
      expect(result.stderr).toContain('region: us-east-1');
      expect(result.stderr).toContain('model: global.anthropic.claude-opus-4-6-v1');
    });

    it('should not expose credential values in logs', async () => {
      const result = await runServerWithTimeout(['--transport', 'stdio'], 3000);
      expect(result.stderr).not.toMatch(/AWS_ACCESS_KEY/i);
      expect(result.stderr).not.toMatch(/AWS_SECRET/i);
      expect(result.stderr).not.toMatch(/SESSION_TOKEN/i);
    });
  });
});

/**
 * Run the server with given args and wait for it to exit (e.g., --help, --version).
 */
function runServer(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', 'src/server.ts', ...args], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}

/**
 * Run the server with given args and kill it after a timeout.
 * Used for testing startup behavior of long-running server processes.
 */
function runServerWithTimeout(args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', 'src/server.ts', ...args], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeoutMs);

    child.on('close', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr });
    });
  });
}
