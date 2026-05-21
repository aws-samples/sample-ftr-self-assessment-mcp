import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PdfParser } from '../parsers/pdf-parser.js';

/**
 * Registers the `parse_pdf` tool with the MCP server.
 *
 * This tool extracts text content from a PDF file and returns
 * the text, character count, and page count.
 */
export function registerParsePdfTool(server: McpServer, pdfParser: PdfParser): void {
  server.tool(
    'parse_pdf',
    'Extract text content from a PDF document. Returns the full text, character count, and page count.',
    {
      file_path: z.string().describe('Absolute or relative path to the PDF file'),
    },
    async ({ file_path }) => {
      try {
        const result = await pdfParser.parse(file_path);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: message }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
