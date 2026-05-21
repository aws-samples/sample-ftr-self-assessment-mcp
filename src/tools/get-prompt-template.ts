import * as fs from 'node:fs';
import * as path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PromptBuilder } from '../engine/prompt-builder.js';
import type { GetPromptTemplateOutput } from '../types.js';

/**
 * Registers the `get_prompt_template` tool with the MCP server.
 *
 * This tool returns the FTR evaluation prompt template as structured data,
 * including the system prompt and template body used for Bedrock invocations.
 */
export function registerGetPromptTemplateTool(server: McpServer): void {
  server.tool(
    'get_prompt_template',
    'Retrieve the FTR evaluation prompt template including system prompt and template body',
    async () => {
      const { systemPrompt, templateBody } = loadPromptTemplate();

      const output: GetPromptTemplateOutput = {
        system_prompt: systemPrompt,
        template_body: templateBody,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    }
  );
}

/**
 * Loads and parses the prompt template from bundled assets.
 */
function loadPromptTemplate(): { systemPrompt: string; templateBody: string } {
  const templatePath = path.join(__dirname, '../assets/prompts/ftr-prompt-template.md');
  const raw = fs.readFileSync(templatePath, 'utf-8');
  return PromptBuilder.parseTemplate(raw);
}
