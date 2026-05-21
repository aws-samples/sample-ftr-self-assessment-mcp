import { describe, it, expect, beforeAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetPromptTemplateTool } from './get-prompt-template.js';
import type { GetPromptTemplateOutput } from '../types.js';

describe('get_prompt_template tool handler', () => {
  let server: McpServer;

  beforeAll(() => {
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    registerGetPromptTemplateTool(server);
  });

  it('should register the tool without errors', () => {
    // If we get here without throwing, registration succeeded
    expect(server).toBeDefined();
  });

  it('should return structured data with system_prompt and template_body', async () => {
    // Access the registered tool handler directly via the internal registry
    // Since McpServer doesn't expose a direct way to call tools in tests,
    // we test the loadPromptTemplate logic by importing PromptBuilder
    const { PromptBuilder } = await import('../engine/prompt-builder.js');
    const { systemPrompt, templateBody } = PromptBuilder.fromAssets();

    // Verify the parsed template has the expected structure
    expect(systemPrompt).toBeTruthy();
    expect(templateBody).toBeTruthy();
    expect(systemPrompt.length).toBeGreaterThan(0);
    expect(templateBody.length).toBeGreaterThan(0);
  });

  it('should have system_prompt containing response format instructions', async () => {
    const { PromptBuilder } = await import('../engine/prompt-builder.js');
    const builder = PromptBuilder.fromAssets();
    const { systemPrompt } = PromptBuilder.parseTemplate(
      (await import('node:fs')).readFileSync(
        (await import('node:path')).join(__dirname, '../assets/prompts/ftr-prompt-template.md'),
        'utf-8'
      )
    );

    expect(systemPrompt).toContain('Decision: PASS');
    expect(systemPrompt).toContain('Decision: FAIL');
    expect(systemPrompt).toContain('Reason:');
  });

  it('should have template_body containing context and question placeholders', async () => {
    const { PromptBuilder } = await import('../engine/prompt-builder.js');
    const { templateBody } = PromptBuilder.parseTemplate(
      (await import('node:fs')).readFileSync(
        (await import('node:path')).join(__dirname, '../assets/prompts/ftr-prompt-template.md'),
        'utf-8'
      )
    );

    expect(templateBody).toContain('{context}');
    expect(templateBody).toContain('{question}');
  });

  it('should produce valid GetPromptTemplateOutput format', async () => {
    const { PromptBuilder } = await import('../engine/prompt-builder.js');
    const { systemPrompt, templateBody } = PromptBuilder.parseTemplate(
      (await import('node:fs')).readFileSync(
        (await import('node:path')).join(__dirname, '../assets/prompts/ftr-prompt-template.md'),
        'utf-8'
      )
    );

    const output: GetPromptTemplateOutput = {
      system_prompt: systemPrompt,
      template_body: templateBody,
    };

    // Verify it serializes to valid JSON
    const json = JSON.stringify(output, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty('system_prompt');
    expect(parsed).toHaveProperty('template_body');
    expect(typeof parsed.system_prompt).toBe('string');
    expect(typeof parsed.template_body).toBe('string');
  });
});
