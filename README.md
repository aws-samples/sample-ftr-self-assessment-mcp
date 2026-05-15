# FTR Partner Self-Assessment

This project provides a **Kiro Power Tool** that automates the AWS Foundational Technical Review (FTR) partner self-assessment process. It evaluates partner-submitted compliance documents (SOC 2 Type II reports and WAFR reports) against defined controls and returns a structured PASS/FAIL decision with reasoning.

---

## Overview

Partners seeking AWS validation must submit evidence for two distinct review tracks:

| Track | Document Required | Controls Evaluated |
|---|---|---|
| **SOC 2** | SOC 2 Type II Report | SOC-001 through SOC-005 |
| **WAFR** | AWS Well-Architected Framework Review Report | WAFR-FTR-001 through WAFR-FTR-004 |

---

## Kiro Power Tool

The core of this project is a Kiro power located at `.kiro/powers/ftr-self-assessment/`. When active, it gives Kiro the full calibration criteria to evaluate FTR submissions.

### Structure

```
.kiro/powers/ftr-self-assessment/
├── POWER.md                              # Power overview, keywords, and usage guide
└── steering/
    ├── ftr-prompt-template.md            # LLM prompt template (format + rules)
    ├── soc2-controls.md                  # SOC 2 control definitions (5 controls)
    ├── wafr-controls.md                  # WAFR control definitions (4 controls)
    ├── soc2-calibration-guide.md         # Full SOC 2 guide with examples and edge cases
    └── wafr-calibration-guide.md         # Full WAFR guide with examples and edge cases
```

### How to Use

1. Open this workspace in Kiro
2. The steering files are set to `inclusion: auto`, so all calibration criteria load automatically
3. Upload a SOC 2 Type II report or WAFR report (PDF) into chat
4. Ask Kiro to evaluate the submission
5. Kiro applies the calibration guide criteria and returns a Reason + Decision per control

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

## Key Rules Summary

- Expired reports (SOC 2 or WAFR older than 12 months) always **FAIL** — no exceptions
- SOC 2 Type I does **not** qualify; must be Type II
- Submitting a WAFR report for a SOC 2 control (or vice versa) **FAILS** immediately
- For WAFR HRI controls, only **active** (open/unresolved) HRIs cause failure — resolved HRIs are ignored
- HRIs with an improvement plan or "Ask an expert" recommendation = **PASS**
- Medium-Risk Issues (MRIs) **never** cause failure regardless of count or status
- Unanswered questions = **SKIP** unless notes contain explicit "No" answers

---

## Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Well-Architected Tool](https://aws.amazon.com/well-architected-tool/)
- [AWS Well-Architected Partner Program (WAPP)](https://aws.amazon.com/partners/programs/well-architected/)
- [SOC 2 Trust Services Criteria (AICPA)](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustservices.html)
- [AWS SOC Reports FAQ](https://aws.amazon.com/compliance/soc-faqs/)
