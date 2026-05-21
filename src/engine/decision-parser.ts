import { ControlResult } from '../types.js';

/**
 * Maximum allowed length for the reason field in a ControlResult.
 */
const MAX_REASON_LENGTH = 2000;

/**
 * Parses a Bedrock model response to extract the decision (PASS/FAIL) and reason.
 *
 * Looks for "Decision: PASS" or "Decision: FAIL" (case-insensitive for the decision value)
 * and extracts the text following "Reason:" as the explanation.
 *
 * If the response cannot be parsed (no valid Decision found), returns an ERROR result.
 *
 * @param response - The raw text response from Bedrock
 * @param controlId - The control ID to include in the result
 * @returns A ControlResult with the parsed decision and reason
 */
export function parseDecision(response: string, controlId: string): ControlResult {
  // Match "Decision:" followed by PASS or FAIL (case-insensitive for the value)
  const decisionMatch = response.match(/Decision:\s*(PASS|FAIL)/i);

  if (!decisionMatch) {
    return {
      control_id: controlId,
      decision: 'ERROR',
      reason: truncateReason(
        `Unable to parse decision from model response. Expected "Decision: PASS" or "Decision: FAIL" in the response.`
      ),
    };
  }

  const decision = decisionMatch[1].toUpperCase() as 'PASS' | 'FAIL';

  // Extract reason text: everything after "Reason:" until end of response
  const reasonMatch = response.match(/Reason:\s*([\s\S]*)/i);
  let reason: string;

  if (reasonMatch) {
    reason = reasonMatch[1].trim();
  } else {
    // If no explicit Reason: marker, use the full response as context
    reason = response.trim();
  }

  return {
    control_id: controlId,
    decision,
    reason: truncateReason(reason),
  };
}

/**
 * Truncates a reason string to the maximum allowed length.
 */
function truncateReason(reason: string): string {
  if (reason.length <= MAX_REASON_LENGTH) {
    return reason;
  }
  return reason.slice(0, MAX_REASON_LENGTH);
}
