/**
 * Configuration module for the FTR MCP Server.
 *
 * Resolution order (highest priority first):
 * 1. CLI arguments
 * 2. Environment variables (FTR_TRANSPORT, FTR_PORT, FTR_AWS_REGION, FTR_BEDROCK_MODEL, FTR_LOG_LEVEL)
 * 3. Defaults
 */

export type Transport = 'stdio' | 'http';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ServerConfig {
  transport: Transport;
  port: number;
  awsRegion: string;
  bedrockModelId: string;
  logLevel: LogLevel;
}

export const DEFAULT_TRANSPORT: Transport = 'stdio';
export const DEFAULT_PORT = 3000;
export const DEFAULT_AWS_REGION = 'us-east-1';
export const DEFAULT_BEDROCK_MODEL = 'global.anthropic.claude-opus-4-6-v1';
export const DEFAULT_LOG_LEVEL: LogLevel = 'info';

const VALID_TRANSPORTS: Transport[] = ['stdio', 'http'];
const VALID_LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

function isValidTransport(value: string): value is Transport {
  return VALID_TRANSPORTS.includes(value as Transport);
}

function isValidLogLevel(value: string): value is LogLevel {
  return VALID_LOG_LEVELS.includes(value as LogLevel);
}

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) return undefined;
  return parsed;
}

/**
 * Reads configuration from environment variables.
 */
function getEnvConfig(): Partial<ServerConfig> {
  const config: Partial<ServerConfig> = {};

  const transport = process.env.FTR_TRANSPORT;
  if (transport && isValidTransport(transport)) {
    config.transport = transport;
  }

  const port = parsePort(process.env.FTR_PORT);
  if (port !== undefined) {
    config.port = port;
  }

  const region = process.env.FTR_AWS_REGION;
  if (region) {
    config.awsRegion = region;
  }

  const model = process.env.FTR_BEDROCK_MODEL;
  if (model) {
    config.bedrockModelId = model;
  }

  const logLevel = process.env.FTR_LOG_LEVEL;
  if (logLevel && isValidLogLevel(logLevel)) {
    config.logLevel = logLevel;
  }

  return config;
}

/**
 * Resolves the final server configuration by merging CLI args, environment
 * variables, and defaults (in that priority order).
 *
 * @param cliArgs - Optional partial config from CLI argument parsing
 * @returns The fully resolved ServerConfig
 */
export function resolveConfig(cliArgs?: Partial<ServerConfig>): ServerConfig {
  const envConfig = getEnvConfig();

  return {
    transport: cliArgs?.transport ?? envConfig.transport ?? DEFAULT_TRANSPORT,
    port: cliArgs?.port ?? envConfig.port ?? DEFAULT_PORT,
    awsRegion: cliArgs?.awsRegion ?? envConfig.awsRegion ?? DEFAULT_AWS_REGION,
    bedrockModelId: cliArgs?.bedrockModelId ?? envConfig.bedrockModelId ?? DEFAULT_BEDROCK_MODEL,
    logLevel: cliArgs?.logLevel ?? envConfig.logLevel ?? DEFAULT_LOG_LEVEL,
  };
}
