# AI CAPITAL COMMAND

The Studio flagship: the capital-allocation layer for enterprise AI.
Two zero-dependency, single-file products. No build step. No server. No data leaves the browser.

| Route | Product | Purpose |
|---|---|---|
| `/` | Landing | Routes to both products |
| `/canva-shock/` | THE CANVA SHOCK (CS-01) | Dual-seat (CFO/CAIO) margin-crisis simulator. Brier calibration, SHA-256 hash-chained decision ledger, evidence-pack export. Demo + training SKU. |
| `/xray/` | AI SPEND X-RAY (XR-01) | The 30-Day AI Economics Audit instrument. CSV intake, capital ledger, cost-per-outcome verdicts, Margin Sentinel forecast, board report, sealed evidence chain. |

## Deploy — Cursor → GitHub → Vercel

Open this folder in Cursor, then in the terminal:

```bash
git init
git add .
git commit -m "AI Capital Command v1.0 — CS-01 + XR-01"
```

**GitHub** (using gh CLI):
```bash
gh repo create ai-capital-command --public --source=. --push
```
Or manually: create the repo at github.com/new, then
```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-capital-command.git
git branch -M main
git push -u origin main
```

**Vercel** (CLI):
```bash
npx vercel --prod
```
Or via dashboard: vercel.com → Add New Project → import the GitHub repo → Framework preset: **Other** → no build command, no output directory (root is served as-is) → Deploy.

Custom domain: Project → Settings → Domains → add e.g. `command.richardleclezio.com`.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Architecture notes

- Fonts load from Google Fonts (the only external request; both products degrade to system fonts offline).
- All hashing uses the Web Crypto API (`crypto.subtle`) — SHA-256 in the browser, no libraries.
- X-Ray CSV schema: `date,provider,model,workload,team,calls,input_tokens,output_tokens,cost_usd,status`
  (`status` ∈ ok/retry/failed; empty `workload` = unallocated spend). Column-mapping from raw provider
  exports is deliberately part of the audit engagement, not the tool.
- Evidence packs export as JSON; chains re-verify in-browser via the Verify button.

— Leclezio Consulting Corporation · The Studio
