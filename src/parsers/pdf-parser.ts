import { promises as fs } from 'node:fs';
import type { ParsePdfOutput } from '../types.js';

// pdf-parse is a CommonJS module without TypeScript types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

/**
 * Parses PDF files and extracts text content.
 * Uses pdf-parse (wrapping Mozilla's pdf.js) for text extraction.
 */
export class PdfParser {
  /**
   * Parse a PDF file and extract its text content.
   *
   * @param filePath - Absolute or relative path to the PDF file
   * @returns Extracted text, character count, and page count
   * @throws Error if file does not exist or PDF is corrupted/unreadable
   */
  async parse(filePath: string): Promise<ParsePdfOutput> {
    let dataBuffer: Buffer;

    try {
      dataBuffer = await fs.readFile(filePath);
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(
        `Unable to read file: ${filePath}${err instanceof Error ? ` - ${err.message}` : ''}`
      );
    }

    try {
      const pdf = await pdfParse(dataBuffer, { password: '' });
      const text: string = pdf.text ?? '';

      return {
        text,
        char_count: text.length,
        page_count: pdf.numpages,
      };
    } catch (err: unknown) {
      throw new Error(
        `Failed to parse PDF: ${filePath}${err instanceof Error ? ` - ${err.message}` : ''}`
      );
    }
  }
}
