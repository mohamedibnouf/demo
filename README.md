# SAMCO Integrated IMS/QMS Platform

Interactive enterprise demo for Saudi Airconditioning Manufacturing Co. Ltd. (SAMCO) | Carrier.

Seeded records are **DEMO DATA**, not actual SAMCO production data.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Password for all demo accounts:** `SamcoDemo@2026`  
Suggested login: `quality.manager@samco.demo`

See `docs/DEMO_ACCOUNTS.md` and `docs/DEMO_SCRIPT.md`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint |
| `npm test` | Vitest business-rule tests |
| `npm run build` | Production build |

## Environment

Copy `.env.example` to `.env.local`. With `DEMO_MODE=true` the app uses the local persisted store (`data/demo-store.json`) and does not require a live Supabase project.

## Documentation

- `docs/DEMO_SCOPE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/DEMO_ACCOUNTS.md`
- `docs/DEMO_SCRIPT.md`
- `docs/IMPLEMENTATION_STATUS.md`
