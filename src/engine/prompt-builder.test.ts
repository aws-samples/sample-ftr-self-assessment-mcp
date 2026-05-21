import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PromptBuilder } from './prompt-builder.js';

describe('PromptBuilder', () => {
  describe('parseTemplate', () => {
    it('extracts system prompt and template body from raw markdown', () => {
      const raw = `# FTR LLM Prompt Template

## System Definition

You are a helpful assistant.

## Prompt Template

\`\`\`
Context: {context}
Question: {question}
\`\`\`
`;
      const { systemPrompt, templateBody } = PromptBuilder.parseTemplate(raw);
      expect(systemPrompt).toBe('You are a helpful assistant.');
      expect(templateBody).toBe('Context: {context}\nQuestion: {question}');
    });

    it('returns empty strings when sections are missing', () => {
      const raw = '# No sections here';
      const { systemPrompt, templateBody } = PromptBuilder.parseTemplate(raw);
      expect(systemPrompt).toBe('');
      expect(templateBody).toBe('');
    });
  });

  describe('build', () => {
    let builder: PromptBuilder;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-03-15'));
      builder = new PromptBuilder(
        '<context>\n{context}\n</context>\n<question>\n{question}\n</question>',
        'You are a QA analyst.'
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('substitutes {context} with dated calibration guide', () => {
      const result = builder.build('Guide content here', 'PDF text here');
      expect(result.prompt).toContain("Today's date: 2025-03-15");
      expect(result.prompt).toContain('Guide content here');
    });

    it('substitutes {question} with PDF text', () => {
      const result = builder.build('Guide content', 'The partner submission text');
      expect(result.prompt).toContain('The partner submission text');
    });

    it('returns the system prompt unchanged', () => {
      const result = builder.build('Guide', 'PDF');
      expect(result.systemPrompt).toBe('You are a QA analyst.');
    });

    it('prepends today\'s date before the calibration guide', () => {
      const result = builder.build('My calibration guide', 'Some PDF');
      const contextSection = result.prompt.split('<context>')[1].split('</context>')[0].trim();
      expect(contextSection.startsWith("Today's date: 2025-03-15")).toBe(true);
      expect(contextSection).toContain('My calibration guide');
    });

    it('places date on a separate line from the guide content', () => {
      const result = builder.build('Guide text', 'PDF text');
      expect(result.prompt).toContain("Today's date: 2025-03-15\n\nGuide text");
    });
  });

  describe('fromAssets', () => {
    it('loads the template from the bundled assets and creates a working builder', () => {
      const builder = PromptBuilder.fromAssets();
      const result = builder.build('Test calibration guide', 'Test PDF content');

      expect(result.systemPrompt).toBeTruthy();
      expect(result.systemPrompt.length).toBeGreaterThan(0);
      expect(result.prompt).toContain('Test calibration guide');
      expect(result.prompt).toContain('Test PDF content');
      expect(result.prompt).toContain("Today's date:");
    });

    it('returns a system prompt that mentions response format', () => {
      const builder = PromptBuilder.fromAssets();
      const result = builder.build('Guide', 'PDF');
      // The system prompt should contain instructions about the response format
      expect(result.systemPrompt).toContain('Decision');
    });

    it('returns a template body with context and question sections', () => {
      const builder = PromptBuilder.fromAssets();
      const result = builder.build('My guide', 'My PDF');
      expect(result.prompt).toContain('My guide');
      expect(result.prompt).toContain('My PDF');
    });
  });
});
