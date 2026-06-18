# SOC 2 Control Calibration Guide

## SOC-001: SOC 2 Type II Report Must Be Active

Extract the report issue date (the date the auditor signed the report), add 12 months to get the expiry date, and compare to today's date.
Active (on or before expiry) = PASS. Expired = FAIL.
A WAFR report submitted instead of SOC 2 = FAIL. No exceptions for expired reports.
SOC 2 Type I does not qualify.

---

## SOC-002: Auditor Opinion Must Be Unqualified

All three components of the opinion must be unqualified: (1) fair presentation of the system description, (2) suitability of design of controls, (3) operating effectiveness of controls throughout the period.
Any qualified, adverse, or disclaimer of opinion on ANY of the three components = FAIL.
"Unmodified" and "unqualified" are equivalent — both are acceptable.
"Except for" language anywhere in the opinion = FAIL.
Emphasis-of-matter or other-matter paragraphs do NOT constitute a qualification — the opinion is still unqualified if the conclusion is clean.
Individual control exceptions noted in Section IV are acceptable as long as the overall opinion is unqualified.

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
If Availability is confirmed in scope, A1.1, A1.2, and A1.3 are inherently included — they are the only three criteria in the Availability category.
Verify trust centers from any one of: cover page, table of contents, Section 1 auditor's report scope paragraph, Section 3 system description, or Section 4 criteria listing. ANY ONE is sufficient — full Section 4 detail is not required.
