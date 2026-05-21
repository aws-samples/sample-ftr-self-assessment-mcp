import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PdfParser } from '../parsers/pdf-parser.js';
import { registerParsePdfTool } from './parse-pdf.js';

describe('parse-pdf tool handler', () => {
  let server: McpServer;
  let pdfParser: PdfParser;
  let toolCallback: (args: { file_path: string }) => Promise<unknown>;

  beforeEach(() => {
    server = {
      tool: vi.fn(),
    } as unknown as McpServer;

    pdfParser = new PdfParser();

    registerParsePdfTool(server, pdfParser);

    // Extract the callback registered with server.tool()
    const toolCall = vi.mocked(server.tool).mock.calls[0];
    // The callback is the last argument
    toolCallback = toolCall[toolCall.length - 1] as typeof toolCallback;
  });

  it('registers the tool with correct name and description', () => {
    expect(server.tool).toHaveBeenCalledTimes(1);
    const [name, description] = vi.mocked(server.tool).mock.calls[0];
    expect(name).toBe('parse_pdf');
    expect(description).toContain('PDF');
  });

  it('registers the tool with a file_path input schema', () => {
    const callArgs = vi.mocked(server.tool).mock.calls[0];
    // The schema is the third argument (name, description, schema, callback)
    const schema = callArgs[2] as Record<string, unknown>;
    expect(schema).toHaveProperty('file_path');
  });

  it('returns structured output on successful parse', async () => {
    const mockOutput = { text: 'Hello PDF', char_count: 9, page_count: 1 };
    vi.spyOn(pdfParser, 'parse').mockResolvedValue(mockOutput);

    const result = await toolCallback({ file_path: '/path/to/file.pdf' });

    expect(pdfParser.parse).toHaveBeenCalledWith('/path/to/file.pdf');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockOutput),
        },
      ],
    });
  });

  it('returns error response when file is not found', async () => {
    vi.spyOn(pdfParser, 'parse').mockRejectedValue(new Error('File not found: /missing.pdf'));

    const result = await toolCallback({ file_path: '/missing.pdf' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'File not found: /missing.pdf' }),
        },
      ],
      isError: true,
    });
  });

  it('returns error response when PDF is corrupted', async () => {
    vi.spyOn(pdfParser, 'parse').mockRejectedValue(
      new Error('Failed to parse PDF: /bad.pdf - Invalid PDF structure')
    );

    const result = await toolCallback({ file_path: '/bad.pdf' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Failed to parse PDF: /bad.pdf - Invalid PDF structure',
          }),
        },
      ],
      isError: true,
    });
  });

  it('handles non-Error thrown values', async () => {
    vi.spyOn(pdfParser, 'parse').mockRejectedValue('unexpected string error');

    const result = await toolCallback({ file_path: '/file.pdf' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'unexpected string error' }),
        },
      ],
      isError: true,
    });
  });
});
