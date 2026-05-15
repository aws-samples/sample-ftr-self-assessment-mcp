---
inclusion: auto
---

# WAFR Control Calibration Guide

## WAFR-FTR-001: WAFR Must Be Led by an Authorized Reviewer AND Completed Within 12 Months

Authorized reviewers: AWS employee, WAPP listed in the AWS Partner Solution Finder, or self-service via the AWS Well-Architected Tool.
Unauthorized third parties = FAIL unless the review was self-service.
WAFR completion date must fall within the 12 months preceding today. Older than 12 months = FAIL.
A SOC 2 report submitted instead of a WAFR = FAIL. Both conditions must pass for an overall PASS.

---

## WAFR-FTR-002: Zero Unmitigated High-Risk Issues (HRIs) in the Security Pillar

HRIs with an improvement plan, remediation recommendation, or "Ask an expert" guidance = PASS.
Only HRIs with NO plan and NO recommendation of any kind cause failure.
Resolved or closed HRIs do not count toward failure.
Medium-Risk Issues (MRIs) do not cause failure regardless of status.
Unanswered questions = skip if: notes are empty, or notes contain only blank/unanswered question templates (e.g. "Does X (Yes/No)?:" with no answer after the colon).
EXCEPTION — FAIL if: notes contain explicit negative answers such as "No", "False", or "Not configured" to security questions (e.g. "Does the default security group restrict all traffic?: No"). Explicit "No" answers prove the partner assessed the question, found a gap, and disclosed it without selecting any best practices or providing a remediation plan. That is an unmitigated risk = FAIL.
Do NOT fail on blank answer fields — a blank answer means the partner did not fill in the template, which is equivalent to not applicable.

---

## WAFR-FTR-003: Zero Unmitigated High-Risk Issues (HRIs) in the Operational Excellence Pillar

HRIs with an improvement plan, remediation recommendation, or "Ask an expert" guidance = PASS.
Only HRIs with NO plan and NO recommendation of any kind cause failure.
Resolved or closed HRIs do not count toward failure.
MRIs do not cause failure regardless of status.
Unanswered questions (marked N/A or not applicable) = skip, do not count as failures.

---

## WAFR-FTR-004: Zero Unmitigated High-Risk Issues (HRIs) in the Reliability Pillar

HRIs with an improvement plan, remediation recommendation, or "Ask an expert" guidance = PASS.
Only HRIs with NO plan and NO recommendation of any kind cause failure.
Resolved or closed HRIs do not count toward failure.
MRIs do not cause failure regardless of status.
Common HRI sources: single-AZ deployments, missing backups, insufficient auto-scaling, no DR plan.
Unanswered questions (marked N/A or not applicable) = skip, do not count as failures.
