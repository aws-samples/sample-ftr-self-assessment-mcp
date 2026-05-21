import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateAwsCredentials } from './credential-validator.js';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-sts', () => {
  return {
    STSClient: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    GetCallerIdentityCommand: vi.fn().mockImplementation((input) => input),
  };
});

describe('validateAwsCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when credentials are valid', async () => {
    mockSend.mockResolvedValueOnce({
      Account: '123456789012',
      Arn: 'arn:aws:iam::123456789012:user/testuser',
      UserId: 'AIDEXAMPLE',
    });

    const result = await validateAwsCredentials('us-east-1');

    expect(result).toBe(true);
  });

  it('should throw an error with configuration suggestions when credentials are not configured', async () => {
    mockSend.mockRejectedValueOnce(new Error('Could not load credentials from any providers'));

    await expect(validateAwsCredentials('us-east-1')).rejects.toThrow(
      'AWS credentials are not configured'
    );

    await mockSend.mockRejectedValueOnce(new Error('Could not load credentials'));
    await expect(validateAwsCredentials('us-east-1')).rejects.toThrow(
      /environment variables.*AWS_ACCESS_KEY_ID/s
    );
  });

  it('should include all suggested configuration methods in the error message', async () => {
    mockSend.mockRejectedValueOnce(new Error('Missing credentials'));

    try {
      await validateAwsCredentials('us-east-1');
      expect.fail('Should have thrown');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('AWS_ACCESS_KEY_ID');
      expect(message).toContain('AWS_SECRET_ACCESS_KEY');
      expect(message).toContain('aws configure');
      expect(message).toContain('IAM role');
    }
  });

  it('should create the STS client with the provided region', async () => {
    mockSend.mockResolvedValueOnce({
      Account: '123456789012',
      Arn: 'arn:aws:iam::123456789012:user/testuser',
      UserId: 'AIDEXAMPLE',
    });

    await validateAwsCredentials('eu-west-1');

    const { STSClient } = await import('@aws-sdk/client-sts');
    expect(STSClient).toHaveBeenCalledWith({ region: 'eu-west-1' });
  });
});
