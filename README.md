# FTR Partner Self-Assessment

This project contains the LLM prompt templates and calibration guides used to automate the AWS **Foundational Technical Review (FTR)** partner self-assessment process. It evaluates partner-submitted compliance documents (SOC 2 reports and WAFR reports) against a set of defined controls and returns a structured PASS/FAIL decision with reasoning.

---

## Overview

Partners seeking AWS validation must submit evidence for two distinct review tracks:

| Track | Document Required | Controls Evaluated |
|---|---|---|
| **SOC 2** | SOC 2 Type II Report | SOC-001 through SOC-005 |
| **WAFR** | AWS Well-Architected Framework Review Report | WAFR-FTR-001 through WAFR-FTR-004 |

An LLM evaluates each control individually using the calibration guides as context. The prompt instructs the model to act as a supportive QA analyst, approving where possible, and to return a structured response in the format:

```
Reason: <explanation and improvement suggestions>
Decision: PASS or FAIL
```

---

## Repository Structure

```
FTRPartnerSelfAssessment/
├── ftr_prompt.md                    # LLM prompt template used at inference time
├── soc2_controls.md                 # Condensed SOC 2 control definitions (5 controls)
├── wafr_controls.md                 # Condensed WAFR control definitions (4 controls)
└── calibrationguides/
    ├── SOC2FTRGuide.txt             # Full SOC 2 calibration guide with examples and edge cases
    └── WAFRFTRGuide.txt             # Full WAFR calibration guide with examples and edge cases
```

---

## Controls Reference

### SOC 2 Controls

| Control | Description |
|---|---|
| **SOC-001** | SOC 2 Type II report must be active (issued within the last 12 months) |
| **SOC-002** | Auditor opinion must be exactly "Unqualified" |
| **SOC-003** | AWS must be listed as an in-scope cloud provider |
| **SOC-004** | The partner's specific solution must appear in the audit scope |
| **SOC-005** | Both Security AND Availability Trust Service Categories must be present |

### WAFR Controls

| Control | Description |
|---|---|
| **WAFR-FTR-001** | Review must be led by an authorized reviewer (AWS employee, WAPP partner, or self-service) AND completed within 12 months |
| **WAFR-FTR-002** | Zero active High-Risk Issues (HRIs) in the Security pillar |
| **WAFR-FTR-003** | Zero active High-Risk Issues (HRIs) in the Operational Excellence pillar |
| **WAFR-FTR-004** | Zero active High-Risk Issues (HRIs) in the Reliability pillar |

---

## How It Works

1. **Partner submits** a SOC 2 Type II report or WAFR report as part of the FTR self-assessment.
2. **The LLM prompt** ([ftr_prompt.md](ftr_prompt.md)) is invoked with:
   - `{context}` — the relevant control criteria from the calibration guide
   - `{question}` — the partner's submitted proposal/document details
3. **The model evaluates** the submission against each control individually using the calibration guide rules.
4. **Output** is a plain-text response with a `Reason:` explanation and a final `Decision: PASS` or `Decision: FAIL` line.

The model is instructed to be a "supportive QA analyst", it should lean toward PASS when evidence partially meets requirements, providing actionable improvement suggestions when failing.

---

## Key Rules Summary

- Expired reports (SOC 2 or WAFR older than 12 months) always **FAIL** no exceptions.
- SOC 2 Type I does **not** qualify; must be Type II.
- Submitting a WAFR report for a SOC 2 control (or vice versa) **FAILS** immediately.
- For WAFR HRI controls, only **active** (open/unresolved) HRIs cause failure — resolved HRIs are ignored.
- HRIs marked "in progress" or "planned for remediation" are still considered **active**.

---

## Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Well-Architected Tool](https://aws.amazon.com/well-architected-tool/)
- [AWS Well-Architected Partner Program (WAPP)](https://aws.amazon.com/partners/programs/well-architected/)
- [SOC 2 Trust Services Criteria (AICPA)](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustservices.html)
- [AWS SOC Reports FAQ](https://aws.amazon.com/compliance/soc-faqs/)
