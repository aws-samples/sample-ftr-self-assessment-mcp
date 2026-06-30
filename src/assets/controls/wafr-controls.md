# WAFR Control Calibration Guide

## WAFR-FTR-001: WAFR Completed Within 12 Months

WAFR completion date must fall within the 12 months preceding today. Older than 12 months = FAIL.
A SOC 2 report submitted instead of a WAFR = FAIL. No exceptions for expired reviews.

---

## WAFR-FTR-002: Zero Active High-Risk Issues (HRIs) in the Security Pillar

Any active HRI in the Security pillar = FAIL, regardless of whether an improvement plan or recommendation is attached.
Resolved or closed HRIs do not count toward failure.
Medium-Risk Issues (MRIs) do not cause failure regardless of status.
Look for HRI counts in the pillar summary section of the WAFR report.

---

## WAFR-FTR-003: Zero Active High-Risk Issues (HRIs) in the Operational Excellence Pillar

Any active HRI in the Operational Excellence pillar = FAIL, regardless of whether an improvement plan or recommendation is attached.
Resolved or closed HRIs do not count toward failure.
MRIs do not cause failure regardless of status.
Look for HRI counts in the pillar summary section of the WAFR report.

---

## WAFR-FTR-004: Zero Active High-Risk Issues (HRIs) in the Reliability Pillar

Any active HRI in the Reliability pillar = FAIL, regardless of whether an improvement plan or recommendation is attached.
Resolved or closed HRIs do not count toward failure.
MRIs do not cause failure regardless of status.
Common HRI sources: single-AZ deployments, missing backups, insufficient auto-scaling, no DR plan.
Look for HRI counts in the pillar summary section of the WAFR report.

---

## WAFR-FTR-005: Partner Solution is in WAFR Workload Scope

The solution being validated must be identifiable in the WAFR workload name OR workload description.
Partial or similar name matches are acceptable (abbreviations, product line names, parent product names).
Either field is sufficient on its own; both is preferred but not required.
Neither field references the solution = FAIL.

---

## WAFR-FTR-006: Report Contains All Required Sections

The WAFR report must contain all four required sections: Workload properties, Lens overview, Improvement plan, and Lens details.
Any required section missing = FAIL (invalid report).
Section headings may vary slightly in wording; accept close/equivalent headings that clearly map to a required section.
A SOC 2 Type II report submitted instead of a WAFR report = FAIL.
