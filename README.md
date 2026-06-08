# 🍅 Tomatopia

**Grow a tomato and learn the science of what plants need.** Tomatopia is a friendly,
scientifically-accurate greenhouse simulation for elementary students (US grades 3–5).
Students adjust **sunlight, water, temperature, and nutrients** and watch a tomato plant
sprout, grow, flower, and fruit — or wilt and yellow when conditions are wrong.

> Inspired by the Concord Consortium's *Virtual Greenhouse*.

🔗 **Live demo:** https://ikonkim2027-korea.github.io/tomatopia/

## What it teaches (NGSS-aligned)

- **A plant's needs** — light, water, warmth, and nutrients, with realistic amounts.
- **Dose-response** — too little *and* too much of anything is harmful (over-watering
  drowns roots; over-fertilizing burns them; too hot drops the flowers).
- **The Limiting Factor (Liebig's Law of the Minimum)** — a plant grows only as well as
  its *scarcest* need allows.
- **Fair testing** — guided missions isolate one variable at a time so students can see
  cause and effect.

The science model uses real horticultural ranges for *Solanum lycopersicum* (e.g. ideal
temperature ~18–27 °C, 6–8 h of sun, steady moisture, balanced fertility). See
[`src/sim/model.ts`](src/sim/model.ts) and its tests.

## How to play

1. Pick a gardener nickname (no real names needed).
2. Work through the **Missions** — each teaches one idea — or open the **Free Greenhouse**
   sandbox to experiment.
3. Move the sliders, press **Play**, and watch your tomato react. Read the speech bubble
   and the *Scientist's Note* to learn why.

## Tech

- **Frontend:** React + TypeScript + Vite. Hand-authored **SVG** art (no image assets).
- **Simulation:** a pure, deterministic, unit-tested TypeScript module (`src/sim`).
- **State:** Zustand, with localStorage save (works fully offline, no account needed).
- **Backend (optional):** Fastify + Prisma + SQLite for cross-device saves and a simple
  teacher class view — **no child PII** (nickname + class code only). See [`server/`](server/).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the science unit tests
npm run build    # production build to dist/
npm run lint
```

### Optional backend

```bash
cd server
cp .env.example .env
npm install
npm run db:push        # create the SQLite schema
npm start              # API on http://localhost:8787
```

Point the frontend at it by setting `VITE_API_URL` (e.g. in a `.env` file at the repo
root): `VITE_API_URL=http://localhost:8787`. Without it, the app saves to localStorage.

## Deploy

- **Frontend → GitHub Pages:** the live site is published to the `gh-pages` branch (built
  with Vite `base` `/tomatopia/`). To rebuild and redeploy: `npm run build` then publish
  `dist/` to `gh-pages` (e.g. `npx gh-pages -d dist`).
  A ready-made CI workflow lives at [`docs/ci/github-pages.yml`](docs/ci/github-pages.yml) —
  move it to `.github/workflows/` to deploy automatically on every push (requires the repo's
  token to have the `workflow` scope).
- **Backend → Render/Fly/Railway:** see [`server/README.md`](server/README.md). A
  `render.yaml` is included for one-click Render deploys. The live frontend works without
  it (localStorage), so the backend is optional.

## Privacy

Designed for children: no accounts, no emails, no real names, no tracking. Saves use a
self-chosen nickname and an optional teacher-provided class code.

## License

MIT
