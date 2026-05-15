---
inclusion: auto
---

# Well-Architected Framework Review (WAFR) Controls Calibration Guide V1.0

## Introduction

This guide covers the four core AWS Well-Architected Framework Review (WAFR) validation controls used in the FTR process. The WAFR must be led by an AWS employee, a confirmed AWS Well-Architected Program Partner (WAPP) listed in the AWS Partner Solution Finder, or conducted as a fully self-service review by the partner using the AWS Well-Architected Tool. The review must have been completed within the last 12 months. The WAFR report validates that the partner's solution is designed and operated according to AWS architectural best practices across the Security, Operational Excellence, and Reliability pillars.

IMPORTANT: Do not determine the final decision until ALL criteria have been analyzed individually.

Partners must provide:
- WAFR report (generated from the AWS Well-Architected Tool)

---

## WAFR-FTR-001: WAFR is Led by an Authorized Reviewer and Completed Within 12 Months

### Control Description

The AWS Well-Architected Framework Review must meet BOTH conditions to pass this control: (1) the WAFR is led by an AWS employee, a confirmed AWS Well-Architected Program Partner (WAPP) listed in the AWS Partner Solution Finder, or conducted as a fully self-service review by the partner using the AWS Well-Architected Tool, AND (2) the WAFR was completed within the last 12 months from the current date.

### Criteria for Passing

Reviewer criteria:
- The WAFR report must identify the reviewing party
- Acceptable reviewers:
  - AWS employee (Solutions Architect or equivalent AWS role)
  - AWS Well-Architected Program Partner (WAPP) verified in the AWS Partner Solution Finder
  - Partner-led self-service review via the AWS Well-Architected Tool
- Unacceptable reviewers:
  - Third parties who are neither AWS employees nor WAPP-listed partners (unless the review is conducted as a self-service review by the partner themselves)

Completion date criteria:
- Extract the WAFR completion date from the report
- Add 12 months to the completion date to determine expiration
- Current date on or before expiration date = control is met
- Current date after expiration date = control is not met
- Example: WAFR completed Nov 30, 2024 -> Active until Nov 30, 2025
  - Oct 27, 2025 -> still active (met)
  - Dec 1, 2025 -> expired (not met)

Both conditions must be met. If either fails, the control is not met.

### Why is this important

An authorized reviewer ensures the WAFR is conducted by someone with the technical expertise to correctly interpret AWS best practices across the Security, Operational Excellence, and Reliability pillars. AWS employees and WAPP-listed partners bring verified AWS architectural expertise, while the self-service option removes friction for partners with internal AWS competency. The 12-month validity window ensures the assessment reflects the current state of the architecture and current AWS best practices, as AWS services and recommendations evolve rapidly.

### Edge Cases

- The WAFR report will be analyzed to confirm BOTH the reviewing party and the completion date
- For WAPP-led reviews, verify the partner is listed in the AWS Partner Solution Finder
- Self-service reviews conducted by the partner's own team are fully acceptable under the AWS Well-Architected Tool
- If the report shows only a start date but no completion date, use the completion/finalization date from the AWS Well-Architected Tool export
- If partner provides a SOC 2 report instead of a WAFR report, control FAILS
- NO EXCEPTIONS for expired reviews

### Examples

Acceptable:
- WAFR led by: AWS Solutions Architect; completed March 15, 2025 (active until March 15, 2026)
- WAFR led by: [WAPP-listed Partner Name] confirmed in Partner Solution Finder; completed January 10, 2025 (active until January 10, 2026)
- WAFR led by: [Partner] via self-service AWS Well-Architected Tool; completed June 1, 2025 (active until June 1, 2026)

Unacceptable:
- WAFR led by a third party that is neither an AWS employee nor a WAPP-listed partner (and not conducted as a self-service partner review)
- No reviewing party identified in the report
- WAFR completed more than 12 months ago (expired)

---

## WAFR-FTR-002: Zero Unmitigated High-Risk Issues in Security Pillar

### Control Description

The WAFR report must show zero (0) unmitigated High-Risk Issues (HRIs) in the Security pillar. An HRI is considered mitigated if it has an improvement plan, remediation recommendation, or "Ask an expert" guidance attached. Only HRIs with absolutely no plan and no recommendation of any kind cause failure. Resolved or previously remediated HRIs do not count against this control.

### Criteria for Passing

- Security pillar unmitigated HRI count: 0
- HRIs with an improvement plan, remediation steps, or ANY recommendation (including "Ask an expert") = PASS for that HRI
- Only HRIs with NO plan and NO recommendation of any kind = control not met
- Resolved or closed HRIs do not count toward failure
- Medium-Risk Issues (MRIs) do not cause failure regardless of status
- Look for HRI counts and their associated plans in the pillar summary section of the WAFR report

### Why is this important

The Security pillar validates that the solution protects data, systems, and assets using AWS security best practices. Unmitigated High-Risk Issues in Security indicate vulnerabilities with no path to resolution, which could lead to data breaches, unauthorized access, or compliance violations. HRIs with improvement plans demonstrate responsible risk management and a commitment to remediation.

### Edge Cases

- Only unmitigated HRIs (no plan, no recommendation) count against the control
- HRIs with remediation in progress or planned = PASS (they have a plan)
- Medium-Risk Issues (MRIs) and low-priority items do not cause failure
- If the report shows "High" severity findings, confirm whether they are classified as HRIs by the Well-Architected Tool
- Look for the pillar summary section that shows HRI counts by pillar

### Examples

Acceptable:
- Security pillar HRIs: 0 active
- Security pillar HRIs: 0 active (2 previously resolved)
- Security pillar HRIs: 2 active, both with improvement plans attached
- Security pillar HRIs: 1 active with "Ask an expert" recommendation

Unacceptable:
- Security pillar HRIs: 1 active, no improvement plan or recommendation
- Security pillar HRIs: 3 active with no plans and no recommendations of any kind

---

## WAFR-FTR-003: Zero Unmitigated High-Risk Issues in Operational Excellence Pillar

### Control Description

The WAFR report must show zero (0) unmitigated High-Risk Issues (HRIs) in the Operational Excellence pillar. An HRI is considered mitigated if it has an improvement plan, remediation recommendation, or "Ask an expert" guidance attached. Only HRIs with absolutely no plan and no recommendation of any kind cause failure. Resolved or previously remediated HRIs do not count against this control.

### Criteria for Passing

- Operational Excellence pillar unmitigated HRI count: 0
- HRIs with an improvement plan, remediation steps, or ANY recommendation (including "Ask an expert") = PASS for that HRI
- Only HRIs with NO plan and NO recommendation of any kind = control not met
- Resolved or closed HRIs do not count toward failure
- Medium-Risk Issues (MRIs) do not cause failure regardless of status
- Look for HRI counts and their associated plans in the pillar summary section of the WAFR report

### Why is this important

The Operational Excellence pillar validates that the partner can run and monitor systems to deliver business value and continually improve supporting processes. Unmitigated High-Risk Issues here indicate gaps in deployment, observability, incident response, or change management with no path to resolution.

### Edge Cases

- Only unmitigated HRIs (no plan, no recommendation) count against the control
- HRIs with remediation in progress or planned = PASS (they have a plan)
- Medium-Risk Issues (MRIs) and low-priority items do not cause failure
- Gaps in runbooks, monitoring, or incident response are common sources of HRIs in this pillar
- Look for the pillar summary section that shows HRI counts by pillar

### Examples

Acceptable:
- Operational Excellence pillar HRIs: 0 active
- Operational Excellence pillar HRIs: 0 active (1 previously resolved)
- Operational Excellence pillar HRIs: 2 active, both with remediation plans in progress
- Operational Excellence pillar HRIs: 1 active with "Ask an expert" recommendation

Unacceptable:
- Operational Excellence pillar HRIs: 1 active, no improvement plan or recommendation
- Operational Excellence pillar HRIs: 2 active with no plans and no recommendations of any kind

---

## WAFR-FTR-004: Zero Unmitigated High-Risk Issues in Reliability Pillar

### Control Description

The WAFR report must show zero (0) unmitigated High-Risk Issues (HRIs) in the Reliability pillar. An HRI is considered mitigated if it has an improvement plan, remediation recommendation, or "Ask an expert" guidance attached. Only HRIs with absolutely no plan and no recommendation of any kind cause failure. Resolved or previously remediated HRIs do not count against this control.

### Criteria for Passing

- Reliability pillar unmitigated HRI count: 0
- HRIs with an improvement plan, remediation steps, or ANY recommendation (including "Ask an expert") = PASS for that HRI
- Only HRIs with NO plan and NO recommendation of any kind = control not met
- Resolved or closed HRIs do not count toward failure
- Medium-Risk Issues (MRIs) do not cause failure regardless of status
- Look for HRI counts and their associated plans in the pillar summary section of the WAFR report

### Why is this important

The Reliability pillar validates that the solution performs its intended function correctly and consistently, and can recover from disruptions, acquire resources to meet demand, and mitigate failures. Unmitigated High-Risk Issues here indicate weaknesses in fault tolerance, disaster recovery, scaling, or backup strategy with no path to resolution.

### Edge Cases

- Only unmitigated HRIs (no plan, no recommendation) count against the control
- HRIs with remediation in progress or planned = PASS (they have a plan)
- Medium-Risk Issues (MRIs) and low-priority items do not cause failure
- Common HRI sources in this pillar include single-AZ deployments, missing backups, insufficient auto-scaling, and lack of disaster recovery plans
- Look for the pillar summary section that shows HRI counts by pillar

### Examples

Acceptable:
- Reliability pillar HRIs: 0 active
- Reliability pillar HRIs: 0 active (3 previously resolved)
- Reliability pillar HRIs: 3 active, all with improvement plans attached
- Reliability pillar HRIs: 1 active with remediation in progress

Unacceptable:
- Reliability pillar HRIs: 1 active, no improvement plan or recommendation
- Reliability pillar HRIs: 4 active with no plans and no recommendations of any kind
