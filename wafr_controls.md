# WAFR Control Calibration Guide

## WAFR-FTR-001: WAFR Must Be Led by an Authorized Reviewer AND Completed Within 12 Months

Authorized reviewers: AWS employee, WAPP listed in the AWS Partner Solution Finder, or self-service via the AWS Well-Architected Tool.
Unauthorized third parties = FAIL unless the review was self-service.
WAFR completion date must fall within the 12 months preceding today. Older than 12 months = FAIL.
A SOC 2 report submitted instead of a WAFR = FAIL. Both conditions must pass for an overall PASS.

---

## WAFR-FTR-002: Zero Active High-Risk Issues (HRIs) in the Security Pillar

Only ACTIVE (open/unresolved) HRIs cause failure. Resolved or closed HRIs do not count.
Medium-Risk Issues (MRIs) do not cause failure regardless of status.
HRIs marked "in progress" are still active = FAIL.

---

## WAFR-FTR-003: Zero Active High-Risk Issues (HRIs) in the Operational Excellence Pillar

Only ACTIVE (open/unresolved) HRIs cause failure. Resolved or closed HRIs do not count.
MRIs do not cause failure regardless of status.
HRIs marked "in progress" or "planned for remediation" are still active = FAIL.

---

## WAFR-FTR-004: Zero Active High-Risk Issues (HRIs) in the Reliability Pillar

Only ACTIVE (open/unresolved) HRIs cause failure. Resolved or closed HRIs do not count.
MRIs do not cause failure regardless of status.
Common HRI sources: single-AZ deployments, missing backups, insufficient auto-scaling, no DR plan.
HRIs marked "in progress" or "planned" are still active = FAIL.
