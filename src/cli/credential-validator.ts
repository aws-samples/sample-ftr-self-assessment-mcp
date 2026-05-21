/**
 * AWS credential validator for the interactive CLI.
 * Verifies AWS credentials are available before starting evaluation.
 */

import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

/**
 * Verifies AWS credentials are available by calling STS GetCallerIdentity.
 * @param region - The AWS region to use for the STS client
 * @returns true if credentials are valid
 * @throws Error with user-friendly message if credentials are not configured
 */
export async function validateAwsCredentials(region: string): Promise<boolean> {
  const client = new STSClient({ region });

  try {
    await client.send(new GetCallerIdentityCommand({}));
    return true;
  } catch {
    throw new Error(
      'AWS credentials are not configured. Please configure credentials using one of the following methods:\n' +
      '  • Set environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n' +
      '  • Configure an AWS CLI profile: run `aws configure`\n' +
      '  • Use an IAM role attached to your compute environment'
    );
  }
}
