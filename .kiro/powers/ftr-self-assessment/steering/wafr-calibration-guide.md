# Well-Architected Framework Review (WAFR) Controls Calibration Guide V1.0

## Introduction

This guide covers the six core AWS Well-Architected Framework Review (WAFR)
validation controls used in the FTR process. The WAFR must be led by an AWS
employee, a confirmed AWS Well-Architected Program Partner (WAPP) listed in
the AWS Partner Solution Finder, or conducted as a fully self-service review
by the partner using the AWS Well-Architected Tool. The review must have been
completed within the last 12 months. The WAFR report validates that the
partner's solution is designed and operated according to AWS architectural
best practices across the Security, Operational Excellence, and Reliability
pillars.

IMPORTANT: Do not determine the final decision until ALL criteria have been
analyzed individually.

Partners must provide:

- WAFR report (generated from the AWS Well-Architected Tool)

---

## WAFR-FTR-001: WAFR is Completed Within 12 Months

### Control Description

The AWS Well-Architected Framework Review (WAFR) was completed within the last
12 months from the current date.

### Criteria for Passing

- Extract the WAFR completion date from the report
- Add 12 months to the completion date to determine expiration
- Current date on or before expiration date = control is met
- Current date after expiration date = control is not met
- Example: WAFR completed Nov 30, 2024 -> Active until Nov 30, 2025
  - Oct 27, 2025 -> still active (met)
  - Dec 1, 2025 -> expired (not met)

The condition must be met. If it fails, the control is not met.

### Why is this important

The 12-month validity window ensures the assessment reflects the current state
of the architecture and current AWS best practices, as AWS services and
recommendations evolve rapidly.

### Edge Cases

- The WAFR report will be analyzed to confirm the completion date
- If the report shows only a start date but no completion date, use the
  completion/finalization date from the AWS Well-Architected Tool export
- If partner provides a SOC 2 Type II report instead of an AWS
  Well-Architected Framework Review (WAFR) report, control FAILS
- NO EXCEPTIONS for expired reviews

### Technical Enablement Resources

- AWS Well-Architected Framework
  (https://aws.amazon.com/architecture/well-architected/)
- AWS Well-Architected Tool
  (https://aws.amazon.com/well-architected-tool/)
- WAFR Best Practices
  (https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)

### Example of Acceptable Response

- Completed March 15, 2025 (active until March 15, 2026)
- Completed January 10, 2025 (active until January 10, 2026)
- Completed November 25, 2025 (active until November 25, 2026)
- Completed June 1, 2025 (active until June 1, 2026)

### Example of Unacceptable Response

- WAFR completed more than 12 months ago (expired)

---

## WAFR-FTR-002: Zero High-Risk Issues in Security Pillar

### Control Description

The WAFR report must show zero (0) active High-Risk Issues (HRIs) in the
Security pillar. Any active HRI in this pillar results in control not met.
Resolved or previously remediated HRIs do not count against this control,
only active ones.

### Criteria for Passing

- Security pillar HRI count: 0 active
- Any active HRI in the Security pillar = control not met
- Resolved HRIs may be listed in the report but do not cause failure
- Look for HRI counts in the pillar summary section of the WAFR report

### Why is this important

The Security pillar validates that the solution protects data, systems, and
assets using AWS security best practices. Active High-Risk Issues in Security
indicate vulnerabilities that could lead to data breaches, unauthorized
access, or compliance violations. Allowing a badge while security HRIs remain
open would expose customers to preventable risks and undermine the purpose
of the validation.

### Edge Cases

- Only active HRIs count against the control
- Medium-Risk Issues (MRIs) and low-priority items do not cause failure
- If the report shows "High" severity findings, confirm whether they are
  classified as HRIs by the Well-Architected Tool
- Look for the pillar summary section that shows HRI counts by pillar

### Technical Enablement Resources

- AWS Well-Architected Security Pillar
  (https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- AWS Well-Architected Tool
  (https://aws.amazon.com/well-architected-tool/)

### Example of Acceptable Response

- Security pillar HRIs: 0 active
- Security pillar HRIs: 0 active (2 previously resolved)
- Security pillar HRIs: 0; Documentation provided: Complete WAFR report in
  PDF format

### Example of Unacceptable Response

- Security pillar HRIs: 1 active
- Security pillar HRIs: 3 active, remediation in progress
- Any open High-Risk Issue in the Security pillar
- Any HRI count > 0 in Security pillar
- Incomplete pillar coverage: Only Operational Excellence and Reliability
  pillars reviewed (Security not included)

---

## WAFR-FTR-003: Zero High-Risk Issues in Operational Excellence Pillar

### Control Description

The WAFR report must show zero (0) active High-Risk Issues (HRIs) in the
Operational Excellence pillar. Any active HRI in this pillar results in
control not met. Resolved or previously remediated HRIs do not count against
this control, only active ones.

### Criteria for Passing

- Operational Excellence pillar HRI count: 0 active
- Any active HRI in the Operational Excellence pillar = control not met
- Resolved HRIs may be listed in the report but do not cause failure
- Look for HRI counts in the pillar summary section of the WAFR report

### Why is this important

The Operational Excellence pillar validates that the partner can run and
monitor systems to deliver business value and continually improve supporting
processes. Active High-Risk Issues here indicate gaps in deployment,
observability, incident response, or change management that could lead to
outages, extended recovery times, or failed customer experiences. This pillar
replaces a subset of the operational controls that were previously validated
by the FTR.

### Edge Cases

- Only active HRIs count against the control
- Medium-Risk Issues (MRIs) and low-priority items do not cause failure
- Gaps in runbooks, monitoring, or incident response are common sources of
  HRIs in this pillar
- Look for the pillar summary section that shows HRI counts by pillar

### Technical Enablement Resources

- AWS Well-Architected Operational Excellence Pillar
  (https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html)
- AWS Well-Architected Tool
  (https://aws.amazon.com/well-architected-tool/)

### Example of Acceptable Response

- Operational Excellence pillar HRIs: 0 active
- Operational Excellence pillar HRIs: 0 active (1 previously resolved)
- Operational Excellence pillar HRIs: 0; Documentation provided: Complete
  WAFR report in PDF format

### Example of Unacceptable Response

- Operational Excellence pillar HRIs: 1 active
- Operational Excellence pillar HRIs: 2 active, remediation in progress
- Any open High-Risk Issue in the Operational Excellence pillar
- Any HRI count > 0 in Operational Excellence pillar
- Incomplete pillar coverage: Only Security and Reliability pillars
  reviewed (Operational Excellence not included)

---

## WAFR-FTR-004: Zero High-Risk Issues in Reliability Pillar

### Control Description

The WAFR report must show zero (0) active High-Risk Issues (HRIs) in the
Reliability pillar. Any active HRI in this pillar results in control not met.
Resolved or previously remediated HRIs do not count against this control,
only active ones.

### Criteria for Passing

- Reliability pillar HRI count: 0 active
- Any active HRI in the Reliability pillar = control not met
- Resolved HRIs may be listed in the report but do not cause failure
- Look for HRI counts in the pillar summary section of the WAFR report

### Why is this important

The Reliability pillar validates that the solution performs its intended
function correctly and consistently, and can recover from disruptions,
acquire resources to meet demand, and mitigate failures. Active High-Risk
Issues here indicate weaknesses in fault tolerance, disaster recovery,
scaling, or backup strategy that could directly impact customer-facing
availability. Badging a solution with open Reliability HRIs would risk
customer outages and data loss scenarios.

### Edge Cases

- Only active HRIs count against the control
- Medium-Risk Issues (MRIs) and low-priority items do not cause failure
- Common HRI sources in this pillar include single-AZ deployments, missing
  backups, insufficient auto-scaling, and lack of disaster recovery plans
- Look for the pillar summary section that shows HRI counts by pillar

### Technical Enablement Resources

- AWS Well-Architected Reliability Pillar
  (https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- AWS Well-Architected Tool
  (https://aws.amazon.com/well-architected-tool/)

### Example of Acceptable Response

- Reliability pillar HRIs: 0 active
- Reliability pillar HRIs: 0 active (3 previously resolved)
- Reliability pillar HRIs: 0; Documentation provided: Complete WAFR report
  in PDF format

### Example of Unacceptable Response

- Reliability pillar HRIs: 1 active
- Reliability pillar HRIs: 4 active, remediation in progress
- Any open High-Risk Issue in the Reliability pillar
- Any HRI count > 0 in Reliability pillar
- Incomplete pillar coverage: Only Security and Operational Excellence
  pillars reviewed (Reliability not included)

---

## WAFR-FTR-005: Partner Solution is in Audit Scope

### Control Description

The partner's solution must be explicitly mentioned in the WAFR. The solution
name must appear in either the workload name or the workload description (or
closely match a product/service named there) so the review is verifiably tied
to the solution being validated.

### Criteria for Passing

- The solution partner is validating against must be identifiable in the
  WAFR by appearing in the workload name OR the workload description
- Accept partial or similar name matches (e.g., abbreviations, product line
  names, parent product names that clearly cover the solution)
- Either field is sufficient on its own; both is preferred but not required
- Control is not met if neither the name nor the description references
  the solution

### Why is this important

The WAFR must specifically cover the solution being validated through FTR.
A generic WAFR that does not call out the solution in its workload name or
description provides no assurance that the Security, Operational Excellence,
and Reliability findings apply to the product being validated. Naming the
solution in the workload prevents partners from substituting a review of an
unrelated workload to satisfy the requirement.

### Edge Cases

- Partial or similar name matches are acceptable
- Abbreviations and product line names count as matches
- Parent-product names (e.g., a platform name that clearly includes the
  solution) are acceptable when the relationship is unambiguous in the
  description
- Look for the solution name in the workload name and the workload
  description fields of the AWS Well-Architected Tool export
- If the workload name is generic (e.g., "Production Workload") but the
  description explicitly identifies the solution, the control is met
- If neither the name nor the description references the solution, the
  control is not met

### Technical Enablement Resources

- AWS Well-Architected Tool — Defining a Workload
  (https://docs.aws.amazon.com/wellarchitected/latest/userguide/define-workload.html)
- AWS Well-Architected Tool
  (https://aws.amazon.com/well-architected-tool/)

### Example of Acceptable Response

- Solution in scope: solution name appears in the workload name
- Solution in scope: solution name appears in the workload description
- Solution in scope: abbreviated or product line name closely matches the
  workload name or description

### Example of Unacceptable Response

- Solution name does not appear in either the workload name or description
- Generic WAFR (e.g., "Production Environment Review") with no reference
  to the specific solution in name or description

---

## WAFR-FTR-006: Report Contains All Required Sections

### Control Description

The WAFR report must be a complete, valid AWS Well-Architected Tool export
containing all required sections. A report is accepted only when every
required section below is present. If any required section is missing, the
report is considered invalid and the control is not met (reject).

Required sections:

- Workload properties
- Lens overview
- Improvement plan
- Lens details

### Criteria for Passing

- All four required sections are present in the report:
  - Workload properties
  - Lens overview
  - Improvement plan
  - Lens details
- All required sections present = control is met (accept)
- Any required section missing = control is not met (reject as invalid report)
- Section headings may vary slightly in wording; accept close/equivalent
  headings that clearly map to a required section

### Why is this important

A complete AWS Well-Architected Tool export is required to reliably evaluate
all other WAFR controls. Missing sections prevent verification of pillar
findings and risk counts, and may indicate a partial export, an edited
document, or a non-standard report. Requiring the full set of sections
ensures the submitted artifact is a genuine, unaltered Well-Architected Tool
report that the remaining controls can be assessed against.

### Edge Cases

- Section headings may differ slightly in wording between exports; accept
  equivalent headings that clearly correspond to a required section
- If the report is a SOC 2 Type II report instead of an AWS Well-Architected
  Framework Review (WAFR) report, control FAILS (invalid report)
- If the document is a partial export missing one or more required sections,
  control FAILS
- If a required section is present but empty, treat the section as present
  for this control; the empty content is evaluated by the relevant pillar/risk
  control, not here

### Technical Enablement Resources

- AWS Well-Architected Tool
  (https://aws.amazon.com/well-architected-tool/)
- AWS Well-Architected Tool — Generating Reports
  (https://docs.aws.amazon.com/wellarchitected/latest/userguide/generate-report.html)
- AWS Well-Architected Framework
  (https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)

### Example of Acceptable Response

- All required sections present: Workload properties, Lens overview,
  Improvement plan, Lens details
- Complete AWS Well-Architected Tool export in PDF format with all four
  required sections

### Example of Unacceptable Response

- Report missing the Workload properties
- Report missing the Improvement plan
- Report missing Lens details
- Partial export containing only Workload properties and Lens overview
- SOC 2 Type II report submitted instead of a WAFR report
