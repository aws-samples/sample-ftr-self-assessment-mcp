import { describe, it, expect } from 'vitest';
import { PdfParser } from './pdf-parser.js';
import path from 'node:path';

describe('PdfParser', () => {
  const parser = new PdfParser();

  describe('error handling', () => {
    it('should throw an error for a non-existent file', async () => {
      const filePath = '/nonexistent/path/to/file.pdf';

      await expect(parser.parse(filePath)).rejects.toThrow(
        `File not found: ${filePath}`
      );
    });

    it('should throw an error for a non-PDF file extension', async () => {
      const filePath = path.resolve(__dirname, '../../tsconfig.json');

      await expect(parser.parse(filePath)).rejects.toThrow(
        'Invalid file type: only PDF files are supported'
      );
    });
  });
});
