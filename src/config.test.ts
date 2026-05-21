import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveConfig,
  ServerConfig,
  DEFAULT_TRANSPORT,
  DEFAULT_PORT,
  DEFAULT_AWS_REGION,
  DEFAULT_BEDROCK_MODEL,
  DEFAULT_LOG_LEVEL,
} from './config.js';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear all FTR env vars before each test
    delete process.env.FTR_TRANSPORT;
    delete process.env.FTR_PORT;
    delete process.env.FTR_AWS_REGION;
    delete process.env.FTR_BEDROCK_MODEL;
    delete process.env.FTR_LOG_LEVEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('defaults', () => {
    it('returns all default values when no CLI args or env vars are set', () => {
      const config = resolveConfig();

      expect(config).toEqual({
        transport: 'stdio',
        port: 3000,
        awsRegion: 'us-east-1',
        bedrockModelId: 'global.anthropic.claude-opus-4-6-v1',
        logLevel: 'info',
      });
    });

    it('exports correct default constants', () => {
      expect(DEFAULT_TRANSPORT).toBe('stdio');
      expect(DEFAULT_PORT).toBe(3000);
      expect(DEFAULT_AWS_REGION).toBe('us-east-1');
      expect(DEFAULT_BEDROCK_MODEL).toBe('global.anthropic.claude-opus-4-6-v1');
      expect(DEFAULT_LOG_LEVEL).toBe('info');
    });
  });

  describe('environment variables', () => {
    it('reads FTR_TRANSPORT from environment', () => {
      process.env.FTR_TRANSPORT = 'http';
      const config = resolveConfig();
      expect(config.transport).toBe('http');
    });

    it('reads FTR_PORT from environment', () => {
      process.env.FTR_PORT = '8080';
      const config = resolveConfig();
      expect(config.port).toBe(8080);
    });

    it('reads FTR_AWS_REGION from environment', () => {
      process.env.FTR_AWS_REGION = 'eu-west-1';
      const config = resolveConfig();
      expect(config.awsRegion).toBe('eu-west-1');
    });

    it('reads FTR_BEDROCK_MODEL from environment', () => {
      process.env.FTR_BEDROCK_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0';
      const config = resolveConfig();
      expect(config.bedrockModelId).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
    });

    it('reads FTR_LOG_LEVEL from environment', () => {
      process.env.FTR_LOG_LEVEL = 'debug';
      const config = resolveConfig();
      expect(config.logLevel).toBe('debug');
    });

    it('ignores invalid FTR_TRANSPORT values', () => {
      process.env.FTR_TRANSPORT = 'websocket';
      const config = resolveConfig();
      expect(config.transport).toBe('stdio');
    });

    it('ignores invalid FTR_PORT values', () => {
      process.env.FTR_PORT = 'not-a-number';
      const config = resolveConfig();
      expect(config.port).toBe(3000);
    });

    it('ignores FTR_PORT out of range (0)', () => {
      process.env.FTR_PORT = '0';
      const config = resolveConfig();
      expect(config.port).toBe(3000);
    });

    it('ignores FTR_PORT out of range (99999)', () => {
      process.env.FTR_PORT = '99999';
      const config = resolveConfig();
      expect(config.port).toBe(3000);
    });

    it('ignores invalid FTR_LOG_LEVEL values', () => {
      process.env.FTR_LOG_LEVEL = 'verbose';
      const config = resolveConfig();
      expect(config.logLevel).toBe('info');
    });
  });

  describe('CLI args override environment variables', () => {
    it('CLI transport overrides env var', () => {
      process.env.FTR_TRANSPORT = 'http';
      const config = resolveConfig({ transport: 'stdio' });
      expect(config.transport).toBe('stdio');
    });

    it('CLI port overrides env var', () => {
      process.env.FTR_PORT = '8080';
      const config = resolveConfig({ port: 4000 });
      expect(config.port).toBe(4000);
    });

    it('CLI awsRegion overrides env var', () => {
      process.env.FTR_AWS_REGION = 'eu-west-1';
      const config = resolveConfig({ awsRegion: 'ap-southeast-1' });
      expect(config.awsRegion).toBe('ap-southeast-1');
    });

    it('CLI bedrockModelId overrides env var', () => {
      process.env.FTR_BEDROCK_MODEL = 'model-from-env';
      const config = resolveConfig({ bedrockModelId: 'model-from-cli' });
      expect(config.bedrockModelId).toBe('model-from-cli');
    });

    it('CLI logLevel overrides env var', () => {
      process.env.FTR_LOG_LEVEL = 'debug';
      const config = resolveConfig({ logLevel: 'error' });
      expect(config.logLevel).toBe('error');
    });
  });

  describe('partial CLI args', () => {
    it('uses env var for fields not specified in CLI args', () => {
      process.env.FTR_AWS_REGION = 'us-west-2';
      process.env.FTR_LOG_LEVEL = 'warn';

      const config = resolveConfig({ transport: 'http', port: 9000 });

      expect(config.transport).toBe('http');
      expect(config.port).toBe(9000);
      expect(config.awsRegion).toBe('us-west-2');
      expect(config.logLevel).toBe('warn');
      expect(config.bedrockModelId).toBe('global.anthropic.claude-opus-4-6-v1');
    });

    it('uses defaults for fields not in CLI args or env vars', () => {
      const config = resolveConfig({ transport: 'http' });

      expect(config.transport).toBe('http');
      expect(config.port).toBe(3000);
      expect(config.awsRegion).toBe('us-east-1');
      expect(config.bedrockModelId).toBe('global.anthropic.claude-opus-4-6-v1');
      expect(config.logLevel).toBe('info');
    });
  });

  describe('resolveConfig returns complete ServerConfig', () => {
    it('always returns a fully populated config object', () => {
      const config = resolveConfig();

      // Verify all fields are defined (not undefined)
      expect(config.transport).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.awsRegion).toBeDefined();
      expect(config.bedrockModelId).toBeDefined();
      expect(config.logLevel).toBeDefined();

      // Verify types
      expect(typeof config.transport).toBe('string');
      expect(typeof config.port).toBe('number');
      expect(typeof config.awsRegion).toBe('string');
      expect(typeof config.bedrockModelId).toBe('string');
      expect(typeof config.logLevel).toBe('string');
    });
  });
});
