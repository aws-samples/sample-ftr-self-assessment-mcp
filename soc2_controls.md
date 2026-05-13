# SOC 2 Control Calibration Guide

## SOC-001: SOC 2 Type II Report Must Be Active

Extract the audit period end date, add 12 months to get the expiry date, and compare to today's date.
Active (on or before expiry) = PASS. Expired = FAIL.
A WAFR report submitted instead of SOC 2 = FAIL. No exceptions for expired reports.
SOC 2 Type I does not qualify.

---

## SOC-002: Auditor Opinion Must Be Unqualified

The independent auditor's opinion must be exactly "Unqualified" (a clean opinion).
Qualified, Adverse, Disclaimer of opinion, or any Modified opinion = FAIL.
Opinion absent or unclear = FAIL.

---

## SOC-003: AWS Must Be Listed as an In-Scope Cloud Provider

Amazon Web Services (AWS) must be explicitly named in the audit scope section.
Other providers (Azure, GCP, etc.) alongside AWS are acceptable — note them but do not fail for their presence.
AWS entirely absent from scope = FAIL. General "cloud infrastructure" without naming AWS = FAIL.

---

## SOC-004: Partner Solution Must Be Included in the SOC 2 Audit Scope

The partner's solution name must appear in the audit scope, or a close match must exist (abbreviations and partial names are acceptable).
A clearly unrelated product in scope with no connection to the submitted solution = FAIL.
When uncertain, lean toward PASS and explain the match rationale.

---

## SOC-005: Both Security and Availability Trust Service Categories Must Be Present

The SOC 2 report must include BOTH "Security" AND "Availability".
Either one missing = FAIL. Neither present = FAIL.
Additional categories (Confidentiality, Processing Integrity, Privacy) are acceptable — note them, do not penalize.
