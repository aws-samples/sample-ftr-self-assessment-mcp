import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * PromptBuilder constructs the full evaluation prompt from a template,
 * calibration guide context, and PDF text.
 *
 * The template contains `{context}` and `{question}` placeholders that are
 * substituted at build time. Today's date is prepended to the calibration
 * guide context so date-based controls (report expiry) evaluate correctly.
 */
export class PromptBuilder {
  constructor(
    private readonly templateBody: string,
    private readonly systemPrompt: string
  ) {}

  /**
   * Build the evaluation prompt by substituting placeholders.
   *
   * @param calibrationGuide - The calibration guide text for the control being evaluated
   * @param pdfText - The extracted PDF text to evaluate
   * @returns An object with the constructed prompt and system prompt
   */
  build(calibrationGuide: string, pdfText: string): { prompt: string; systemPrompt: string } {
    const today = new Date().toISOString().split('T')[0];
    const datedContext = `Today's date: ${today}\n\n${calibrationGuide}`;

    const prompt = this.templateBody
      .replace('{context}', datedContext)
      .replace('{question}', pdfText);

    return { prompt, systemPrompt: this.systemPrompt };
  }

  /**
   * Create a PromptBuilder by loading the template from the bundled assets directory.
   * Parses the markdown template file into system prompt and template body sections.
   */
  static fromAssets(): PromptBuilder {
    const templatePath = path.join(__dirname, '../assets/prompts/ftr-prompt-template.md');
    const raw = fs.readFileSync(templatePath, 'utf-8');
    const { systemPrompt, templateBody } = PromptBuilder.parseTemplate(raw);
    return new PromptBuilder(templateBody, systemPrompt);
  }

  /**
   * Parse the raw template markdown into system prompt and template body.
   *
   * The template file has two sections:
   * - `## System Definition` — contains the system prompt text
   * - `## Prompt Template` — contains the template body inside a code block
   */
  static parseTemplate(raw: string): { systemPrompt: string; templateBody: string } {
    const systemMatch = raw.match(/## System Definition\s*\n([\s\S]*?)(?=\n## )/);
    const templateMatch = raw.match(/## Prompt Template\s*\n[\s\S]*?```\n([\s\S]*?)```/);

    const systemPrompt = systemMatch ? systemMatch[1].trim() : '';
    const templateBody = templateMatch ? templateMatch[1].trim() : '';

    return { systemPrompt, templateBody };
  }
}
