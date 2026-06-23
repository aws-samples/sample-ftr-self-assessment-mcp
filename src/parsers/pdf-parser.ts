import { promises as fs } from 'node:fs';
import path from 'node:path';
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
    const resolvedPath = path.resolve(filePath);

    if (path.extname(resolvedPath).toLowerCase() !== '.pdf') {
      throw new Error(`Invalid file type: only PDF files are supported`);
    }

    const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
    const stats = await fs.stat(resolvedPath).catch(() => null);
    if (!stats) {
      throw new Error(`File not found: ${filePath}`);
    }
    if (stats.size > MAX_PDF_SIZE) {
      throw new Error(`PDF exceeds maximum allowed size of 50MB`);
    }

    let dataBuffer: Buffer;

    try {
      dataBuffer = await fs.readFile(resolvedPath);
    } catch {
      throw new Error(`Unable to read file: ${filePath}`);
    }

    // Validate PDF magic bytes (%PDF-) to prevent processing disguised files
    if (dataBuffer.length < 5 || dataBuffer.slice(0, 5).toString('ascii') !== '%PDF-') {
      throw new Error(`Invalid file type: only PDF files are supported`);
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
      throw new Error(`Failed to parse PDF: ${filePath}`);
    }
  }
}
