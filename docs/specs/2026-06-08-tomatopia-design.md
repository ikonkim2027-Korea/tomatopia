# Tomatopia — Design Spec

*Date: 2026-06-08 · Status: approved (user authorized autonomous build-to-deploy)*

## 1. Summary

**Tomatopia** is a browser-based tomato-growing simulation that teaches elementary
students (US grades 3–5) how a plant's environment determines whether it survives and
thrives. The student adjusts **light, water, temperature, and nutrients** and watches a
tomato plant respond in real time — sprouting, growing, flowering, fruiting, or wilting
and yellowing when conditions are wrong. Inspired by Concord Consortium's *Virtual
Greenhouse*.

- **Audience:** grades 3–5 (ages ~8–11). English only.
- **Pedagogy:** NGSS-aligned (see §3). Semi-quantitative: real units + accurate optimal
  ranges, communicated through sliders and *visual* plant feedback.
- **Modes:** guided **Missions** (scaffolded learning) + free **Sandbox**.
- **Art:** polished vector cartoon, hand-authored **SVG** (cel-shaded rounded leaves,
  thick outlines, glossy tomatoes, warm palette). Sprout uses chubby rounded baby leaves.
- **Stack:** React + TypeScript + Vite (frontend), pure-TS simulation module,
  Fastify + Prisma + SQLite (backend). Deploy: GitHub Pages (frontend, live) + backend
  deploy docs. No child PII — nickname / class-code only.

## 2. Goals & non-goals

**Goals**
- Scientifically accurate model of how light/water/temperature/nutrients affect a tomato.
- Joyful, age-appropriate, responsive (desktop → tablet → mobile) experience.
- Teach the **limiting factor** idea (a plant grows only as well as its scarcest need)
  and **dose-response** (too much is also harmful), not just "more = better".
- Save & resume a garden without collecting personal data.

**Non-goals (YAGNI)**
- No realistic 3D, no genetics/breeding, no pests/disease (kept out of v1 scope).
- No student accounts with passwords/email. No social features.
- No photosynthesis chemistry depth (light→sugar) — survival conditions only.

## 3. Science model (the heart of the app)

All tuning values reflect standard horticultural guidance for *Solanum lycopersicum*.
The model is implemented as a pure, deterministic, **unit-tested** TS module.

### 3.1 Controlled variables, units, and ranges

| Variable | Unit (shown to child) | Survivable range | Optimal band | Notes |
|---|---|---|---|---|
| **Light** | hours of sun / day | 0–16 h | 6–12 h (best ~8) | Tomatoes are full-sun; <6 h → leggy/weak; 0 h → death; >14 h continuous can stress. |
| **Water** | soil moisture % | 0–100 % | 50–75 % | <~20 % → wilting; 0 % → death; >90 % → waterlogged/root-rot damage. |
| **Temperature** | °C | ~2–43 °C | 18–27 °C (best ~24) | <10 °C growth stalls, frost <2 °C → death; >35 °C flower drop, >43 °C → death. |
| **Nutrients** | fertilizer % | 0–100 % | 35–70 % | Low → nitrogen-deficiency yellowing; high → fertilizer burn + leaf-only growth. |

### 3.2 Response curves & growth

Each variable maps to a **suitability factor** `f ∈ [0,1]` via a trapezoid:
`f = 1` inside the optimal band, ramping linearly to `0` at the survivable edges.

- **Growth rate** uses **Liebig's Law of the Minimum**:
  `growthRate = BASE * min(f_light, f_water, f_temp, f_nutrient)`.
  This is real ecology and teaches the limiting-factor concept.
- **Health (0–100)**: decreases while any variable sits in a *damaging* zone (outside the
  survivable range, or in the harmful tails), recovers slowly when all factors are good.
  Health 0 → the plant dies (recoverable by restarting the plant).
- **Growth progress (0–100)** advances by `growthRate` each tick while alive; it maps to
  discrete life-cycle stages.

### 3.3 Life-cycle stages (visual backbone)

`seed → sprout → seedling → vegetative (leafy) → flowering → fruiting (green) → ripe 🍅`

### 3.4 Visual feedback states (overlay on any stage)

- **wilting** — low water (droop + slight desaturation)
- **yellowing (chlorosis)** — low nutrients (leaf hue shifts yellow)
- **cold / stalled** — low temperature (bluish tint, growth halts)
- **scorched** — high temp/light with low water (brown edges)
- **leggy** — chronic low light (thin, stretched stem)
- **lush-but-fruitless** — excess nutrients (extra leaves, fewer fruit) [flavor cue]

## 4. Architecture

```
tomatopia/
  src/
    sim/            # pure TS — no React. The science engine.
      model.ts      # constants, response curves, growth/health step
      stages.ts     # progress → stage + visual-state derivation
      model.test.ts # vitest unit tests for the science
    art/            # SVG plant + scene components (presentational)
      Plant.tsx, Leaf.tsx, Tomato.tsx, Flower.tsx, Greenhouse.tsx, Sky.tsx
    components/     # UI
      ControlPanel.tsx (sliders), StatusPanel.tsx, MissionPanel.tsx,
      ScientistNote.tsx, Toolbar.tsx, ...
    state/          # game state (Zustand store) + save/load adapter
      store.ts, persistence.ts (localStorage | API)
    content/        # mission definitions + scientist notes (data, not code)
      missions.ts
    api/            # thin client to backend (optional)
    App.tsx, main.tsx, theme.css
  server/           # Fastify + Prisma + SQLite (full-stack; optional at runtime)
    src/index.ts, prisma/schema.prisma, routes/
  docs/specs/
```

- **Simulation isolation:** `sim/` knows nothing about React or the DOM; the UI calls
  `step(env, plant) → plant`. This makes the science independently testable.
- **Tick loop:** a fixed-timestep loop (e.g. 4 ticks/sec) in the store advances the sim;
  one in-game "day" = a few seconds. Speed controls (pause / play / fast).
- **Persistence adapter:** `persistence.ts` exposes `save()/load()`; default impl is
  localStorage. When `VITE_API_URL` is set, it uses the backend (class-code keyed).

### 4.1 Backend (full-stack, privacy-safe)

- Fastify REST API + Prisma + SQLite.
- Entities: `Garden { id, nickname, classCode?, state(json), updatedAt }`,
  optional `Class { code, name }`. **No emails, no real names, no passwords.**
- Routes: `POST /gardens`, `GET /gardens/:id`, `PUT /gardens/:id`,
  `GET /classes/:code/gardens` (teacher view, read-only summaries).
- Frontend works fully without it (localStorage); backend enables cross-device save and a
  simple teacher overview.

## 5. UI / UX

- **Desktop:** center = greenhouse scene with the plant; left = control panel (4 labeled
  sliders with icons + current value + accurate optimal-range markers); right =
  status panel (stage, health, age in days, current feedback message) + mission panel.
- **Tablet/mobile:** vertical stack — scene on top, controls below, status/mission collapsible.
- **Feedback first:** every change shows an immediate, friendly, scientific message
  ("Brrr! It's too cold for the tomato to grow.") plus the plant's visual reaction.
- **Accessibility:** keyboard-operable sliders, ARIA labels, color-blind-safe status icons
  (shape + color), large hit targets, readable font sizes, reduced-motion support.

## 6. Missions (guided learning)

1. **Wake Up the Seed** — provide light + water to germinate. (needs)
2. **Just Right Temperature** — find the optimal temperature band. (dose-response)
3. **The Goldilocks Watering** — not too little, not too much water. (dose-response)
4. **Feed Me!** — fix yellow leaves with nutrients; learn over-feeding harms too.
5. **Grow a Ripe Tomato** — balance all four to reach harvest. (limiting factor)
6. **Free Sandbox** — open exploration with all controls.

Each mission has: title, kid-friendly goal, hint, success condition, and a
**Scientist's Note** with the accurate science explained simply.

## 7. Testing & verification

- `sim/model.test.ts` — vitest: optimal env grows, each extreme stalls/kills, limiting
  factor behaves, dose-response (both tails harmful), curves monotonic where expected.
- Playwright smoke check of the running app (renders, sliders work, plant reacts).
- Manual responsive checks at desktop/tablet/mobile widths.

## 8. Deployment

- GitHub repo under `ikonkim2027`.
- Frontend → **GitHub Pages** via GitHub Actions (live URL). Vite `base` set to repo path.
- Backend → documented deploy (Render/Fly) for when cloud credentials are available;
  not required for the live frontend (localStorage save works).
