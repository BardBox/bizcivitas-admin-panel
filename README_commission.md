# BizCivitas — Commission & Payouts (README)

This document describes the commission split rules, payout flow, and implementation guidance for BizCivitas membership purchases (Flagship and Digital) using a Next.js backend and MongoDB.

## Commission rules (from PDF)
- **Flagship (offline)**: total commission = **12%**
  - MF: **12%**
  - AF: **7%**
  - CORE (CGC): **4%**
  - SA (remaining) = total price - distributed shares
- **Digital**: total commission = **40%**
  - MF: **40%**
  - AF: **30%**
  - DCP: **20%**
  - SA (remaining)

> Percentages are relative to the **membership price**, not the commission pool (this matches PDF patterns).

## Example (Flagship)
- Price: ₹350,000
- Commission pool (12%): ₹42,000
  - MF: 12% of price = ₹42,000 (note: PDF shows MF 12% meaning MF portion equals full commission pool in example — confirm business intent)
  - AF: 7% of price = ₹24,500
  - CORE: 4% of price = ₹14,000
  - SA: remaining = price - (MF+AF+CORE) or treat as company retention

**Important:** Clarify whether MF percentage is meant to be of the price or of the commission pool. The PDF shows e.g. `100% -> 12% -> 7% -> 4%`; we implemented the simple rule: percentage of membership price.

## Implementation summary
- Store commission rules in a configurable collection `commissionRules`.
- On purchase, create a `transaction` document, compute share amounts, create `payout` documents per recipient with status (pending/paid).
- Use background worker (e.g., queue) to process payouts and update statuses.
