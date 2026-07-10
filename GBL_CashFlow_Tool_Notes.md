# GBL Cash Flow Consolidation Tool — Master Reference Notes

## Purpose
Single HTML dashboard that consolidates monthly cash flow data from 21 brands into Sangeetha's standard 3-tier CF report format. Built July 2026.

---

## Data Architecture

### Historical Data (pre-loaded, immutable)
- **Source:** `1783575000576_2_FY27_Cash.xlsb` → `Cash Data` sheet
- **Period:** Jun-2021 → May-2026 (60 months, 21 brands, ~325K rows)
- **Stored as:** Aggregated JSON embedded in the HTML (`HIST.data` and `HIST.closing`)
- **NEVER regenerate this from scratch** — it is baked in and tested
- Closing balances sourced from `Activity = 'Closing Balance'` rows, col `Bank Bal (INR)` (col 11)

### New Monthly Data (uploaded each month)
- **Source:** Brand-submitted xlsx files, one file per brand
- **Period:** Current consolidation month only (e.g. Jun-2026)
- **Controlled by:** `CONSOLIDATION_MONTH = 'M-YYYY'` constant at top of JS — update this each month
- Brand data is filtered to this month only before consolidation

---

## Brand File Naming Convention
Brands send files named: `{CODE} - Cashflow {Mon} {YY} V{n}.xlsx`

| Code | Brand Name |
|------|-----------|
| AB | Abhishti |
| BB | Break Bounce |
| CH | Chumbak |
| DE | **Dormant entities** (4 companies, one file — exclude manually, do not upload) |
| FP | Frangipani |
| GG | GBL Garden |
| GI | GBL India |
| GS | GBL Singapore |
| IM | Imara |
| LT | Leafy Tales |
| NG | Nutriglow |
| NN | Neemli |
| PE | Pet Edge |
| PJ | Pepe |
| tB | trueBrowns |
| TLL | TLL (The Label Life) |
| VO | Voylla |
| YU | Yuris |
| GA | GBL Antares |
| GM | GBL Mimosa |
| GP | GBL Pollux |
| GSI | GBL Sirius |

**Important:** DE file covers 4 dormant entities in one file. Do NOT upload to the tool. Handle separately.

---

## Brand File Structure (what the parser expects)
Each brand xlsx must have:

### Data sheet (any name)
- Every brand file has exactly **one data sheet** and **one report sheet**
- Parser scans all sheets and uses the first one with both `Grouping` and `Month` columns
- **`Month` column** — period of transaction. Format: `M-YYYY` (e.g. `6-2026`). Leading zeros stripped automatically.
- **`Grouping` column** — ONLY field used for CF line mapping to 3-tier line items. Never `Particulars`, never `GL`.
- **`Inflow` / `Outflow` columns** — transaction values

### Sheet: `3 tier CF - Direct method`
- Used for reconciliation only (brand's own computed summary)
- Row 0: date headers (Excel serial numbers)
- Row 2: Opening Cash & Cash Equivalents
- Row 3: Closing Cash & Cash Equivalents
- Net CF totals read from: Net Cash Flow from Operations / Investments / Financing
- Only months > May-2026 are read from this sheet (history already in HIST)

---

## CF Line Item Structure (LOCKED — do not add new lines without Sangeetha's confirmation)

### Operation Activities
Sales Collections, Other Operations, COGS Related, Fulfilment and Other Running costs,
Customer Acquisition Costs, Brand Marketing, Royalty, Salaries, Overheads,
Management Fees, Interest, Processing Fee, Income Tax

### Investing Activities
Sales of Assets, Deposits Recovered, Exchange Rate Fluctuation, Purchase of Assets,
CWIP, Investment in Subsidiary, Purchase of shares from Founders,
BTA consideration - Debt, BTA consideration - Equity

### Financing Activities
Equity Funding, Equity Investment - BTA, Equity Investment - Internal,
Debt Investment - External, Debt Investment - Internal,
Debt Repayment Receipts - Internal, Director Loans Receipts,
Repurchase of Stock, Debt Repayments - External, Loan - Internal,
Debt Repayments - Internal, Director Loans Repayment

### Structural (excluded from CF report — bank balance rows)
Contra, Fixed Deposit, Deposits, Bank Accounts, Cash, OD, Mutual Fund,
Deposits - Sing, Security Deposit, FD-Investment, FEDERAL BANK CC, etc.

---

## IC Loans Check Logic
- **Group-level check only** — only meaningful after ALL 21 brands uploaded
- `Debt Investment - Internal` = Loan given (inflow to receiving brand)
- `Debt Repayments - Internal` = Loan repaid (outflow from receiving brand)
- Net of given + repaid must = ₹0 at portfolio level
- Individual brand mismatches are expected (one gives, another receives)

---

## Opening / Closing Cash
- **NOT from Inflow/Outflow transaction rows**
- Historical: from `HIST.closing` (pre-computed from `Bank Bal (INR)` col in Cash Data)
- New months: from brand's `3 tier CF - Direct method` sheet, rows 2 (Opening) and 3 (Closing)
- Closing = sum of Bank Accounts + Cash + Deposits + OD + Mutual Fund per brand per month

---

## Checks & Validations

### Step 1 (Upload)
- Accept ALL files, no month filtering
- Show original filename on every card (blue, prominent)
- Show resolved brand name below (→ Brand Name)
- Flag duplicates (same brand code twice) in red — both accepted, user removes wrong one
- Duplicate blocks "Review Mapping" button until resolved

### Step 2 (Mapping)
- Key off `Grouping` column ONLY
- Show which brands have / don't have the consolidation month data
- Missing month = shows as zero in report, NOT a blocker
- User can discuss and decide before proceeding
- No new CF lines added without Sangeetha's explicit confirmation

### Step 3 (Recon)
- Compare Data-sheet totals vs brand's own 3-tier CF summary
- Mismatch = error in brand's file (wrong grouping, duplicate row, missing entry)
- Brand's own `Check` value (should be ~0) also shown

### Step 4 (Checks)
- IC Loans net at group level
- Recon pass/fail count
- Brand count vs 21 target

---

## Authorisation
- Brand stakeholders: can upload files and review mapping only
- Consolidation (Step 2 → Step 3): requires CFO PIN
- Default PIN: **2602**
- PIN stored in browser localStorage (`gbl_cfo_pin`)
- Change PIN via ⚙ CFO Settings in sidebar

---

## Strict Editing Rules (never violate)
1. **Surgical edits only** — change the minimum possible. Fixing a font = touch only CSS. Never rewrite a whole function unless that specific function is the problem.
2. **Never use `html.find()` as a slice index without checking result ≠ -1** — a -1 result silently truncates the entire file.
3. **After every edit, explicitly verify functions not touched are still present** — check for `readBrandSummary`, `consolidate`, `renderReport`, `renderGrid`, `parseFile`, `runChecks` at minimum.
4. **If the user asks a question or makes a comment that doesn't require a code change — answer in text only. Do not open or touch the file.**
5. **Never do a full function rewrite unless that function is the direct cause of the bug** — partial rewrites that append to a broken file cause more damage than they fix.
6. **Each edit session: load file → make one targeted change → node syntax check → node runtime check → verify key functions present → copy to outputs → deliver.** No shortcuts.

## Mandatory Pre-Delivery Check (never skip)
Before delivering any updated dashboard HTML:
1. Run `node --check /tmp/test_script.js` — zero syntax errors required
2. Run `node /tmp/test_runtime.js` with DOM stubs — `init()` must execute and `upload-grid innerHTML length > 0`
3. Only then copy to `/mnt/user-data/outputs/` and present to user
Common failure modes found so far:
- `let`/`const` declared twice at top level (e.g. `currentFY` declared in two places)
- `const` calling a function before that function is defined (e.g. `FY_RANGES` calling `month2key`)
- Complex string escaping inside template literals breaking JS parse (e.g. Replace button `onchange`)
- Rewrite of one function accidentally truncating rest of file when `find()` returns -1
- `readBrandSummary` dropped when suffix block was reconstructed — must always be present before `parseFile`

---

## Parser Robustness Principle (critical)
The tool must handle whatever format the brand sends. If a file is not being read correctly, **it is always a parser bug — not a brand error.** Brands send the same files they always send. The fix is always in the code, never "ask the brand to change their file."

Known format variations across 21 brands:
- Data sheet name: `Data`, `data`, `Cash Data`, `INR  data ` (double space), etc.
- Header row: can be at row index 0, 1, or 2 (row 1 sometimes has aggregate totals)
- Month column: `M-YYYY` string, Excel date serial, bare integer (1-12 without year)
- Inflow/Outflow: present, or only Net column, or different capitalisation
- Any new format issue found during testing → fix the parser, not the brand

---

## Key Rules (never violate)
1. **Surgical data principle** — historical data (Jun-21 to May-26) is pre-loaded and immutable. Never regenerate it.
2. **One file per brand** — tool enforces this via duplicate detection
3. **Grouping field only** for CF line mapping — never Particulars or GL
4. **No new CF lines** added to report without Sangeetha confirming
5. **DE file excluded** — dormant entities, handle outside tool
6. **CONSOLIDATION_MONTH** must be updated at top of JS each month before use
7. **IC loans check** is group-level only — run after all 21 brands uploaded
8. **Font:** Times New Roman throughout (Courier New for numbers only)
9. **Deltas in report** always shown as % change, never pp

---

## Monthly Workflow
1. Update `CONSOLIDATION_MONTH = 'M-YYYY'` in JS
2. Brand stakeholders upload their files (Step 1)
3. Review mapping per brand, note which brands missing current month (Step 2)
4. Discuss missing brands, sort, proceed
5. CFO enters PIN → Consolidate
6. Review recon (Step 3) — any mismatch = brand error, send back
7. Review IC loans check (Step 4)
8. Generate report (Step 5)

---

## File Location
- Tool: `cashflow_consolidation_dashboard.html` (single self-contained HTML)
- These notes: `GBL_CashFlow_Tool_Notes.md`
- Historical JSON (embedded in HTML, also backed up): `historical_data.json`

---

## PENDING — Post GitHub Setup

### Transaction-Level Export (FY22–Jun26)

**Requirement:** Full export of consolidated data at transaction level (not aggregated) covering FY22 to current month.

**Columns:** Brand, Month, Grouping, BANK, GL, Date, Particulars, Inflow, Outflow, Net, Bank Bal (INR), Investment Brand, Activity, Type

**Source for history (FY22–May26):** `Cash Data` sheet in `FY27_Cash.xlsb` — 3,27,480 rows already extracted and verified.

**Source for new months (Jun-26 onwards):** Brand uploads via the consolidation tool.

**Approach agreed:** Option B — host transaction data as a separate JSON file on GitHub alongside the HTML. Dashboard fetches it on load. Keeps HTML small.

**Why deferred:** 327K rows × ~500 bytes = ~160MB — too large to embed in HTML. Needs GitHub hosting first.

**Action when ready:**
1. Extract FY22–May26 rows from xlsb into `hist_transactions.json`
2. Host on GitHub alongside `index.html`
3. Dashboard fetches `hist_transactions.json` on load
4. Jun-26+ rows appended monthly via bake-in
5. Export button on Full Report tab downloads full FY22–current Excel at transaction level


---

## CONFIRMED MONTHLY WORKFLOW (as of 10-Jul-2026)

### Monthly Steps
1. FY22–May26 pre-loaded (done once)
2. Each new month:
   - 2.1 Upload brand files (brand users)
   - 2.2 Map by brand
   - 2.3 Recon vs summary → Confirm to consolidate
   - 2.4 IC Check
   - 2.5 Other Line Items Check (new tab — per-transaction remap by Brand + Grouping)
   - 2.6 Add late files if any → repeat 2.2–2.5
   - 2.7 IC Check (re-verify after late additions)
   - 2.8 Other Line Items Check (re-verify)
   - 2.9 Download current month (line item level, all columns, current month only)
   - 2.10 Offline review → return with corrections → apply in Other Line Items Check
   - 2.11 Confirm & Bake In (surgically appends new month to HIST, advances CONSOLIDATION_MONTH)
   - 2.12 Full download available (FY22 to current — pending GitHub hosting)

### Filters for Other Line Items Check
- Primary: Brand + Grouping label (raw name from brand file)
- Secondary: CF Line, Particulars keyword

### Step 8 Download
- Scope: Current month only
- Format: Line item level, all columns (Brand, Grouping, BANK, GL, Date, Particulars, Inflow, Outflow, Net, CF Line)

### Bake In Storage
- TBD — to be decided when GitHub hosting is set up

### PENDING
- Other Line Items Check tab (Step 5/7) — to be built
- Step 8 current month export — to be built
- Step 12 full FY22-to-date export — pending GitHub
- Bake In storage format — TBD

