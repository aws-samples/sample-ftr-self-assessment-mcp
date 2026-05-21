# SOC 2 Controls Calibration Guide V1.0

## Introduction

This guide covers the five core SOC 2 Type II validation controls derived from the Alternative FTR process (Original Control ID: ALT-002). All SOC 2 Type II audit examinations must be completed by an independent auditor. The SOC 2 report validates that security controls are in place and operating effectively.

IMPORTANT: Do not determine the final decision until ALL criteria have been analyzed individually.

Partners must provide:
- SOC 2 Type II report

---

## SOC-001: SOC 2 Type II Report is Active

### Control Description

The SOC 2 Type II report must be active based on a 12-month validation window. Extract the report issue date (the date the auditor signed the report) and add 12 months to determine expiration. If the current date exceeds the expiration, the control is not met.

### Criteria for Passing

- Extract the report issue date from the SOC 2 report (this is the date the auditor signed the Independent Service Auditor's Report)
- Add 12 months to the issue date to determine expiration
- Current date on or before expiration date = control is met
- Current date after expiration date = control is not met
- Example: Report issued March 3, 2025 -> Active until March 3, 2026
  - Feb 15, 2026 -> still active (met)
  - March 4, 2026 -> expired (not met)

### Why is this important

SOC 2 Type II reports provide independent third-party verification that security and availability controls are in place and operating effectively over an extended period (typically 6-12 months). The report is not valid until the auditor signs it, so the issue date (not the evaluation period end date) determines when the 12-month validity window begins. Expired reports no longer provide assurance that controls are functioning as intended.

### Edge Cases

- The SOC 2 report PDF will be analyzed to extract the report issue date
- The issue date is the auditor's signature date, NOT the evaluation period end date
- The current date will be provided in the partner response for date calculation
- If partner provides a WAFR report instead of a SOC 2 report, control FAILS

### Examples

Acceptable:
- Report issue date: March 3, 2025
- Report is active until: March 3, 2026 (today's date < March 3, 2026)

Unacceptable:
- Report expired (report issue date + 12 months < today's date)
- NO EXCEPTIONS for expired reports

---

## SOC-002: Auditor Opinion is Unqualified

### Control Description

The SOC 2 Type II audit must have an "Unqualified" auditor opinion. The opinion must be exactly "Unqualified" - any other opinion results in control not met.

### Criteria for Passing

- Auditor opinion must be exactly "Unqualified"
- Any other opinion = control not met:
  - Qualified
  - Adverse
  - Disclaimer
  - Modified

### Why is this important

An unqualified opinion means the independent auditor found that the partner's controls are suitably designed and operating effectively without material exceptions. Any qualification indicates weaknesses in the control environment that could impact the security and reliability of the partner's solution.

### Edge Cases

- Only "Unqualified" is acceptable - no partial credit for other opinion types
- The opinion is typically found in the auditor's report section of the SOC 2 document

### Examples

Acceptable:
- Auditor Opinion: Unqualified

Unacceptable:
- Qualified opinion
- Adverse opinion
- Disclaimer of opinion
- Modified opinion

---

## SOC-003: AWS is Included as Cloud Provider in Scope

### Control Description

AWS MUST be included as a cloud provider in the SOC 2 audit scope. The presence of other cloud providers does not cause failure as long as AWS is listed.

### Criteria for Passing

- AWS must be listed as a cloud provider in the audit scope
- If other cloud providers (Azure, GCP, Oracle Cloud, etc.) are also in scope, note them in the reason but do NOT fail the control for this alone
- Control is not met ONLY if AWS is absent from the audit scope entirely

### Why is this important

The SOC 2 report must cover the AWS infrastructure where the partner solution is hosted. Without AWS in scope, the report does not validate the security and availability controls relevant to the partner's AWS-hosted solution. The audit must specifically attest to controls operating in the AWS environment.

### Edge Cases

- Multiple cloud providers in scope is acceptable as long as AWS is included
- Note other providers in the reason but do not fail for their presence
- Look for AWS references in the system description and scope sections of the SOC 2 report

### Examples

Acceptable:
- Cloud Provider in scope: AWS
- Cloud Provider in scope: AWS, Azure (both listed - acceptable, note Azure)

Unacceptable:
- AWS not listed as a cloud provider in the audit scope at all
- Only Azure or GCP listed without AWS

---

## SOC-004: Partner Solution is in Audit Scope

### Control Description

The partner's solution must be explicitly mentioned in the SOC 2 audit scope. The solution name from the partner's FTR checklist must appear in or closely match a product/service mentioned in the audit scope.

### Criteria for Passing

- The solution partner is validating against must appear in or closely match a product/service mentioned in the audit scope
- Accept partial or similar name matches (e.g., abbreviations, product line names)

### Why is this important

The SOC 2 report must specifically cover the solution being validated through FTR. A generic SOC 2 report that does not include the specific solution in its scope provides no assurance about that solution's security and availability controls. The audit must attest to the controls governing the actual product.

### Edge Cases

- Partial or similar name matches are acceptable
- Abbreviations and product line names count as matches
- Look for the solution name in the system description and scope sections

### Examples

Acceptable:
- Solution in scope: solution name mentioned in audit scope
- Solution in scope: abbreviated or product line name closely matches

Unacceptable:
- Solution name not mentioned in audit scope
- Generic SOC 2 report with no reference to the specific solution

---

## SOC-005: Security and Availability Trust Centers Present

### Control Description

BOTH Security AND Availability trust centers must be present in the SOC 2 audit. Missing either one results in control not met.

### Criteria for Passing

- "Security" trust center: MUST be present in audit
- "Availability" trust center: MUST be present in audit
- Missing either one = control not met

### Why is this important

The requirement for both Security and Availability trust centers ensures comprehensive coverage of critical operational concerns for cloud-hosted solutions. Security validates that data protection and access controls are operating effectively. Availability validates that uptime, reliability, and performance controls meet defined commitments. Together they provide assurance that the partner's solution is both secure and reliably accessible.

### Edge Cases

- Both must be present - having only one is insufficient
- Other trust centers (Processing Integrity, Confidentiality, Privacy) are not required but may be present
- Look for trust center coverage in the auditor's report and scope sections

### Examples

Acceptable:
- Trust Centers audited: Security, Availability
- Trust Centers audited: Security, Availability, Confidentiality (extra is fine)

Unacceptable:
- Security OR Availability trust center missing from audit
- Only Security present without Availability
- Only Availability present without Security
- Only Processing Integrity and Confidentiality (neither required one present)
