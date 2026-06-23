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
      .replace('{question}', this.sanitize(pdfText));

    return { prompt, systemPrompt: this.systemPrompt };
  }

  private sanitize(text: string): string {
    // Strip zero-width/invisible Unicode chars used to hide injection payloads
    // U+200B-U+200F: zero-width spaces, U+FEFF: BOM, U+202A-U+202E: bidi controls
    // U+E0000-U+E007F: Unicode tags block
    let cleaned = text
      .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, '')
      .replace(/[\uE000-\uF8FF]/gu, '');
    // Escape prompt boundary tags so attacker content cannot break out of <question>
    cleaned = cleaned.replace(
      /<\/?(?:context|question|instructions|persona|thinking|amazon-bedrock-guardrails-guardContent)>/gi,
      '[TAG_REMOVED]'
    );
    return cleaned;
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
