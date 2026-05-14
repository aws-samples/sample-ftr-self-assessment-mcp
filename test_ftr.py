#!/usr/bin/env python3
"""
FTR Partner Self-Assessment tester.
Usage:
  python test_ftr.py --file report.pdf --type soc2
  python test_ftr.py --file report.pdf --type wafr
  python test_ftr.py --file report.pdf --type soc2 --region us-east-1 --model anthropic.claude-3-sonnet-20240229-v1:0
"""

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

import boto3
import pypdf


# ── paths relative to this script ───────────────────────────────────────────
ROOT = Path(__file__).parent
FTR_PROMPT     = ROOT / "ftr_prompt.md"
SOC2_CONTROLS  = ROOT / "soc2_controls.md"
WAFR_CONTROLS  = ROOT / "wafr_controls.md"

SOC2_CONTROL_IDS = ["SOC-001", "SOC-002", "SOC-003", "SOC-004", "SOC-005"]
WAFR_CONTROL_IDS = ["WAFR-FTR-001", "WAFR-FTR-002", "WAFR-FTR-003", "WAFR-FTR-004"]

DEFAULT_MODEL  = "global.anthropic.claude-opus-4-6-v1"
DEFAULT_REGION = "us-east-1"


def extract_pdf_text(pdf_path: str) -> str:
    reader = pypdf.PdfReader(pdf_path)
    if reader.is_encrypted:
        reader.decrypt("")
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def load_ftr_prompt() -> tuple[str, str]:
    """Return (system_prompt, template) parsed from ftr_prompt.md."""
    text = FTR_PROMPT.read_text()
    # System prompt: paragraph text under ## System Definition, before the example code block
    sys_match = re.search(r'## System Definition\s*\n+(.*?)```', text, re.DOTALL)
    system_prompt = sys_match.group(1).strip() if sys_match else ""
    # Prompt template: contents of the ``` block under ## Prompt Template
    template_match = re.search(r'## Prompt Template\s*\n+```\w*\n(.*?)```', text, re.DOTALL)
    template = template_match.group(1).strip() if template_match else ""
    return system_prompt, template


def load_guide_section(guide_path: Path, control_id: str) -> str:
    """Pull the section for a single control out of the controls markdown file."""
    text = guide_path.read_text()
    lines = text.splitlines()
    capturing = False
    section = []
    for line in lines:
        if line.startswith("##") and control_id in line:
            capturing = True
        elif capturing:
            if line.strip() == "---":
                break
            section.append(line)
    return "\n".join(section).strip() if section else text


def build_prompt(template: str, context: str, question: str) -> str:
    today = date.today().strftime("%B %d, %Y")
    context_with_date = f"Today's date is {today}.\n\n{context}"
    return template.replace("{context}", context_with_date).replace("{question}", question)


def call_bedrock(client, model_id: str, prompt: str, system_prompt: str = "") -> str:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system_prompt:
        body["system"] = system_prompt
    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


def parse_decision(response_text: str) -> str:
    for line in reversed(response_text.splitlines()):
        line = line.strip()
        if line.startswith("Decision:"):
            return "PASS" if "PASS" in line.upper() else "FAIL"
    return "UNKNOWN"


def run_evaluation(pdf_path: str, report_type: str, model_id: str, region: str):
    print(f"\nLoading report: {pdf_path}")
    doc_text = extract_pdf_text(pdf_path)
    print(f"Extracted {len(doc_text):,} characters from PDF.\n")

    system_prompt, template = load_ftr_prompt()

    if report_type == "soc2":
        guide_path  = SOC2_CONTROLS
        control_ids = SOC2_CONTROL_IDS
    else:
        guide_path  = WAFR_CONTROLS
        control_ids = WAFR_CONTROL_IDS

    client = boto3.client("bedrock-runtime", region_name=region)

    results = []
    for control_id in control_ids:
        print(f"Evaluating {control_id} ...", end=" ", flush=True)
        context = load_guide_section(guide_path, control_id)
        prompt  = build_prompt(template, context, doc_text)
        try:
            response = call_bedrock(client, model_id, prompt, system_prompt)
            decision = parse_decision(response)
        except Exception as exc:
            response = f"ERROR: {exc}"
            decision = "ERROR"

        results.append({"control": control_id, "decision": decision, "response": response})
        marker = "✓" if decision == "PASS" else "✗" if decision == "FAIL" else "?"
        print(f"[{marker}] {decision}")

    # ── summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"REPORT: {Path(pdf_path).name}  |  TYPE: {report_type.upper()}")
    print("=" * 60)
    passed  = sum(1 for r in results if r["decision"] == "PASS")
    failed  = sum(1 for r in results if r["decision"] == "FAIL")
    errored = sum(1 for r in results if r["decision"] == "ERROR")
    print(f"PASS: {passed}  FAIL: {failed}  ERROR: {errored}  TOTAL: {len(results)}\n")

    for r in results:
        status_line = f"[{r['decision']:>7}]  {r['control']}"
        print(status_line)
        print("-" * 60)
        print(r["response"].strip())
        print()

    overall = "PASS" if failed == 0 and errored == 0 else "FAIL"
    print("=" * 60)
    print(f"OVERALL RESULT: {overall}")
    print("=" * 60)
    return overall


def main():
    parser = argparse.ArgumentParser(description="FTR Partner Self-Assessment evaluator")
    parser.add_argument("--file",   required=True, help="Path to the PDF report")
    parser.add_argument("--type",   required=True, choices=["soc2", "wafr"],
                        help="Report type: soc2 or wafr")
    parser.add_argument("--model",  default=DEFAULT_MODEL,
                        help=f"Bedrock model ID (default: {DEFAULT_MODEL})")
    parser.add_argument("--region", default=DEFAULT_REGION,
                        help=f"AWS region (default: {DEFAULT_REGION})")
    args = parser.parse_args()

    if not os.path.isfile(args.file):
        print(f"Error: file not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    overall = run_evaluation(args.file, args.type, args.model, args.region)
    sys.exit(0 if overall == "PASS" else 1)


if __name__ == "__main__":
    main()
