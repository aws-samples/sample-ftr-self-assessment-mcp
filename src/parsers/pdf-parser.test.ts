import { describe, it, expect } from 'vitest';
import { PdfParser } from './pdf-parser.js';
import path from 'node:path';

const TEST_FILES_DIR = path.resolve(__dirname, '../../test_files');

describe('PdfParser', () => {
  const parser = new PdfParser();

  describe('successful parsing', () => {
    it('should extract text from a valid PDF file', async () => {
      const filePath = path.join(TEST_FILES_DIR, 'FTR_WAFR_PASSING_wellarchitected.pdf');
      const result = await parser.parse(filePath);

      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.page_count).toBeGreaterThan(0);
    });

    it('should return char_count equal to text.length', async () => {
      const filePath = path.join(TEST_FILES_DIR, 'FTR_WAFR_PASSING_wellarchitected.pdf');
      const result = await parser.parse(filePath);

      expect(result.char_count).toBe(result.text.length);
    });

    it('should return page_count as a positive number', async () => {
      const filePath = path.join(TEST_FILES_DIR, 'FTR_WAFR_FAILING_wellarchitected.pdf');
      const result = await parser.parse(filePath);

      expect(result.page_count).toBeGreaterThan(0);
    });
  });

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
