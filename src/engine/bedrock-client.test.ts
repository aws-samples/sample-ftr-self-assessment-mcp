import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BedrockClient, BedrockClientConfig } from './bedrock-client.js';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    InvokeModelCommand: vi.fn().mockImplementation((input) => input),
  };
});

describe('BedrockClient', () => {
  const config: BedrockClientConfig = {
    region: 'us-east-1',
    modelId: 'global.anthropic.claude-opus-4-6-v1',
  };

  let client: BedrockClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new BedrockClient(config);
  });

  it('should invoke the model with correct Anthropic Messages API format', async () => {
    const responseBody = {
      content: [{ type: 'text', text: 'Decision: PASS\nReason: All criteria met.' }],
    };
    mockSend.mockResolvedValueOnce({
      body: new TextEncoder().encode(JSON.stringify(responseBody)),
    });

    const result = await client.invokeModel('Evaluate this document', 'You are an evaluator');

    expect(result).toBe('Decision: PASS\nReason: All criteria met.');

    // Verify the command was constructed with correct body
    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    expect(InvokeModelCommand).toHaveBeenCalledWith({
      modelId: 'global.anthropic.claude-opus-4-6-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        system: 'You are an evaluator',
        messages: [{ role: 'user', content: 'Evaluate this document' }],
      }),
    });
  });

  it('should throw descriptive error when credentials are not configured', async () => {
    const credError = new Error('Could not load credentials from any providers');
    (credError as { name: string }).name = 'CredentialsProviderError';
    mockSend.mockRejectedValueOnce(credError);

    await expect(client.invokeModel('test', 'system')).rejects.toThrow(
      'AWS credentials are not configured. Please configure AWS credentials before running evaluations.'
    );
  });

  it('should throw descriptive error for expired token', async () => {
    const expiredError = new Error('The security token included in the request is expired');
    (expiredError as { name: string }).name = 'ExpiredTokenException';
    mockSend.mockRejectedValueOnce(expiredError);

    await expect(client.invokeModel('test', 'system')).rejects.toThrow(
      'AWS credentials are not configured. Please configure AWS credentials before running evaluations.'
    );
  });

  it('should throw descriptive error for access denied', async () => {
    const accessError = new Error('User is not authorized to perform this action');
    (accessError as { name: string }).name = 'AccessDeniedException';
    mockSend.mockRejectedValueOnce(accessError);

    await expect(client.invokeModel('test', 'system')).rejects.toThrow(
      'AWS credentials are not configured. Please configure AWS credentials before running evaluations.'
    );
  });

  it('should re-throw non-credential errors as-is', async () => {
    const serviceError = new Error('Model not found');
    (serviceError as { name: string }).name = 'ResourceNotFoundException';
    mockSend.mockRejectedValueOnce(serviceError);

    await expect(client.invokeModel('test', 'system')).rejects.toThrow('Model not found');
  });

  it('should use the configured region and model ID', async () => {
    const customConfig: BedrockClientConfig = {
      region: 'eu-west-1',
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    };
    const customClient = new BedrockClient(customConfig);

    const responseBody = {
      content: [{ type: 'text', text: 'Response text' }],
    };
    mockSend.mockResolvedValueOnce({
      body: new TextEncoder().encode(JSON.stringify(responseBody)),
    });

    await customClient.invokeModel('prompt', 'system');

    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    expect(InvokeModelCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      })
    );

    const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
    expect(BedrockRuntimeClient).toHaveBeenCalledWith({ region: 'eu-west-1' });
  });

  it('should handle credential error detected by message content', async () => {
    const credError = new Error('Missing credentials in config');
    (credError as { name: string }).name = 'SomeOtherError';
    mockSend.mockRejectedValueOnce(credError);

    await expect(client.invokeModel('test', 'system')).rejects.toThrow(
      'AWS credentials are not configured. Please configure AWS credentials before running evaluations.'
    );
  });
});
