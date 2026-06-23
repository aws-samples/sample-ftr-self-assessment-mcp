#!/usr/bin/env node

/**
 * FTR MCP Server entry point.
 *
 * Uses commander subcommand pattern to route between:
 * - `serve` (default): starts the MCP server (backward-compatible)
 * - `evaluate`: launches the interactive CLI evaluation workflow
 */

import { Command } from 'commander';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { resolveConfig, ServerConfig, LogLevel, Transport } from './config.js';
import { ControlRegistry } from './registries/control-registry.js';
import { CalibrationGuideRegistry } from './registries/calibration-guide-registry.js';
import { PdfParser } from './parsers/pdf-parser.js';
import { PromptBuilder } from './engine/prompt-builder.js';
import { BedrockClient } from './engine/bedrock-client.js';
import { EvaluationEngine } from './engine/evaluation-engine.js';

import { registerParsePdfTool } from './tools/parse-pdf.js';
import { registerGetControlsTool } from './tools/get-controls.js';
import { registerGetCalibrationGuideTool } from './tools/get-calibration-guide.js';
import { registerEvaluateSubmissionTool } from './tools/evaluate-submission.js';
import { registerGetPromptTemplateTool } from './tools/get-prompt-template.js';

import { runEvaluateCli } from './cli.js';

/**
 * Starts the MCP server with the given CLI options.
 * This is the default action when no subcommand is specified.
 */
export async function startMcpServer(options: Record<string, string | undefined>): Promise<void> {
  const cliArgs: Partial<ServerConfig> = {};

  if (options.transport) {
    const t = options.transport;
    if (t === 'stdio' || t === 'http') {
      cliArgs.transport = t as Transport;
    }
  }

  if (options.port) {
    const port = parseInt(options.port, 10);
    if (!isNaN(port) && port >= 1 && port <= 65535) {
      cliArgs.port = port;
    }
  }

  if (options.region) {
    cliArgs.awsRegion = options.region;
  }

  if (options.model) {
    cliArgs.bedrockModelId = options.model;
  }

  if (options.logLevel) {
    const level = options.logLevel;
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      cliArgs.logLevel = level as LogLevel;
    }
  }

  const config = resolveConfig(cliArgs);

  // Log startup configuration (without credential values)
  console.error(
    `[info] FTR MCP Server starting - region: ${config.awsRegion}, model: ${config.bedrockModelId}, transport: ${config.transport}`
  );

  // Initialize registries and parsers
  const controlRegistry = new ControlRegistry();
  const calibrationGuideRegistry = new CalibrationGuideRegistry();
  const pdfParser = new PdfParser();

  // Initialize engine components
  const promptBuilder = PromptBuilder.fromAssets();
  const bedrockClient = new BedrockClient({
    region: config.awsRegion,
    modelId: config.bedrockModelId,
  });
  const evaluationEngine = new EvaluationEngine(
    pdfParser,
    controlRegistry,
    calibrationGuideRegistry,
    promptBuilder,
    bedrockClient
  );

  // Create MCP server
  const server = new McpServer({
    name: 'ftr-eval-mcp',
    version: '1.0.0',
  });

  // Register all five tools
  registerParsePdfTool(server, pdfParser);
  registerGetControlsTool(server, controlRegistry);
  registerGetCalibrationGuideTool(server, calibrationGuideRegistry);
  registerEvaluateSubmissionTool(server, evaluationEngine);
  registerGetPromptTemplateTool(server);

  // Set up transport and connect
  if (config.transport === 'stdio') {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[info] FTR MCP Server running on stdio transport`);
  } else {
    // HTTP+SSE transport
    const http = await import('node:http');
    const url = await import('node:url');

    const transports: Record<string, SSEServerTransport> = {};

    const httpServer = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url ?? '', true);

      if (parsedUrl.pathname === '/sse' && req.method === 'GET') {
        const transport = new SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;

        res.on('close', () => {
          delete transports[transport.sessionId];
        });

        await server.connect(transport);
      } else if (parsedUrl.pathname === '/messages' && req.method === 'POST') {
        const sessionId = parsedUrl.query.sessionId as string | undefined;
        const transport = sessionId ? transports[sessionId] : undefined;

        if (transport) {
          let body = '';
          let bodySize = 0;
          const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB
          req.on('data', (chunk: Buffer) => {
            bodySize += chunk.length;
            if (bodySize > MAX_BODY_SIZE) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request body too large' }));
              req.destroy();
              return;
            }
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              await transport.handlePostMessage(req, res, body);
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid message' }));
            }
          });
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No transport found for sessionId' }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    httpServer.headersTimeout = 10000;
    httpServer.requestTimeout = 30000;
    httpServer.keepAliveTimeout = 5000;

    httpServer.listen(config.port, '127.0.0.1', () => {
      console.error(
        `[info] FTR MCP Server running on HTTP+SSE transport at 127.0.0.1:${config.port}`
      );
    });
  }
}

// Set up commander program with subcommands
const program = new Command();

program
  .name('ftr-eval-mcp')
  .description('FTR MCP Server - Foundational Technical Review evaluation tools')
  .version('1.0.0');

// Default action: start MCP server (backward-compatible)
program
  .command('serve', { isDefault: true })
  .description('Start the MCP server (default behavior)')
  .option('--transport <type>', 'Transport type: stdio or http')
  .option('--port <number>', 'HTTP port (default: 3000)')
  .option('--region <region>', 'AWS region (default: us-east-1)')
  .option('--model <modelId>', 'Bedrock model ID')
  .option('--log-level <level>', 'Log level: debug, info, warn, error')
  .action(startMcpServer);

// Evaluate subcommand: interactive CLI
program
  .command('evaluate')
  .description('Interactively evaluate an FTR report')
  .option('--report-type <type>', 'Report type: soc2 or wafr')
  .option('--file <path>', 'Path to the PDF report file')
  .option('--control-id <id>', 'Specific control ID to evaluate')
  .option('--region <region>', 'AWS region (default: us-east-1)')
  .option('--model <modelId>', 'Bedrock model ID')
  .action(runEvaluateCli);

program.parse(process.argv);
