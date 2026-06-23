/**
 * Bedrock Client for invoking Amazon Bedrock foundation models.
 *
 * Uses the Anthropic Messages API format via Bedrock with the standard
 * AWS credential chain. The AWS SDK's built-in retry mechanism (3 retries
 * with exponential backoff) handles transient errors.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export interface BedrockClientConfig {
  region: string;
  modelId: string;
}

export class BedrockClient {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(config: BedrockClientConfig) {
    this.modelId = config.modelId;
    this.client = new BedrockRuntimeClient({ region: config.region });
  }

  /**
   * Invokes the configured Bedrock model with the given prompt and system prompt.
   *
   * Uses the Anthropic Messages API format:
   * - anthropic_version: "bedrock-2023-05-31"
   * - max_tokens: 4096
   * - system: systemPrompt
   * - messages: [{ role: "user", content: prompt }]
   *
   * @param prompt - The user message content
   * @param systemPrompt - The system prompt for the model
   * @returns The text content from the model's response
   * @throws Error with descriptive message if AWS credentials are not configured
   */
  async invokeModel(prompt: string, systemPrompt: string): Promise<string> {
    const requestBody = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: requestBody,
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await this.client.send(command, { abortSignal: controller.signal });
      clearTimeout(timeout);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text;
    } catch (error: unknown) {
      if (isCredentialError(error)) {
        throw new Error(
          'AWS credentials are not configured. Please configure AWS credentials before running evaluations.'
        );
      }
      throw new Error('Model invocation failed. Please verify your AWS region and model configuration and try again.');
    }
  }
}

/**
 * Checks whether an error is related to missing or invalid AWS credentials.
 */
function isCredentialError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const credentialErrorNames = [
    'CredentialsProviderError',
    'ExpiredTokenException',
    'UnrecognizedClientException',
    'InvalidIdentityToken',
    'AccessDeniedException',
  ];

  const name = (error as { name?: string }).name ?? '';
  if (credentialErrorNames.includes(name)) return true;

  const message = error.message.toLowerCase();
  return (
    message.includes('could not load credentials') ||
    message.includes('missing credentials') ||
    message.includes('credential') && message.includes('not') && message.includes('found')
  );
}
