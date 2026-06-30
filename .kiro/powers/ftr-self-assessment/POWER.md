---
name: FTR Self-Assessment
description: Evaluates AWS Foundational Technical Review (FTR) partner submissions — SOC 2 Type II reports and Well-Architected Framework Reviews — against defined controls, producing automated PASS/FAIL decisions with detailed reasoning.
---

# FTR Partner Self-Assessment Power

## Overview

This power provides the calibration guides, control definitions, and prompt template used to evaluate AWS Foundational Technical Review (FTR) partner self-assessment submissions. It enables automated PASS/FAIL decisions on partner-submitted SOC 2 Type II reports and WAFR reports against defined controls.

## Keywords

ftr, foundational technical review, soc2, wafr, well-architected, partner assessment, compliance, audit, security pillar, reliability pillar, operational excellence, hri, high-risk issues

## How to Use

When evaluating a partner's FTR submission:

1. Identify the submission type (SOC 2 or WAFR)
2. Use the appropriate calibration guide as context
3. Apply the prompt template with the partner's document details
4. Evaluate each control individually before making a final decision

### Evaluation Tracks

| Track | Document Required | Controls |
|---|---|---|
| **SOC 2** | SOC 2 Type II Report | SOC-001 through SOC-005 |
| **WAFR** | AWS Well-Architected Framework Review Report | WAFR-FTR-001 through WAFR-FTR-006 |

### Response Format

Every evaluation must produce output in this exact format:

```
Reason: <explanation and improvement suggestions>
Decision: PASS or FAIL
```

### Key Rules

- Expired reports (SOC 2 or WAFR older than 12 months) always FAIL — no exceptions
- SOC 2 Type I does not qualify; must be Type II
- Submitting a WAFR report for a SOC 2 control (or vice versa) FAILS immediately
- For WAFR HRI checks, any active (open/unresolved) HRI causes failure — resolved HRIs are ignored
- Medium-Risk Issues (MRIs) never cause failure regardless of count or status
- Unanswered questions = SKIP unless notes contain explicit negative answers like "No"

## Steering Files

- `ftr-prompt-template.md` — The LLM prompt template used at inference time
- `soc2-controls.md` — SOC 2 check definitions (5 checks)
- `wafr-controls.md` — WAFR check definitions (6 checks)
- `soc2-calibration-guide.md` — Full SOC 2 calibration guide with examples and edge cases
- `wafr-calibration-guide.md` — Full WAFR calibration guide with examples and edge cases

## Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Well-Architected Tool](https://aws.amazon.com/well-architected-tool/)
- [AWS Well-Architected Partner Program (WAPP)](https://aws.amazon.com/partners/programs/well-architected/)
- [SOC 2 Trust Services Criteria (AICPA)](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustservices.html)
- [AWS SOC Reports FAQ](https://aws.amazon.com/compliance/soc-faqs/)

## License and support

This power is part of [sample-ftr-self-assessment-mcp](https://github.com/aws-samples/sample-ftr-self-assessment-mcp) (MIT-0).

- [Privacy Policy](https://aws.amazon.com/privacy/)
- [Support](https://github.com/aws-samples/sample-ftr-self-assessment-mcp/issues)
