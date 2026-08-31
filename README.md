# ⚖️ SynthCouncil — The Council of Agents

> An adversarial committee of AI experts — **Tech, Finance, Risk, Strategy** — that debates your
> hardest problem using **live, cited web evidence** (WebMCP), under the supervision of a human
> arbiter. Built for the [OpenAI WebMCP Hackathon](https://openai.devpost.com).

A single AI tends to agree with you. SynthCouncil **forces disagreement**: each agent is an
isolated persona with a single responsibility, every claim must be backed by a fetched web source,
and the architecture makes the models attack each other's positions. The human holds the gavel —
the debate literally pauses until you arbitrate.

---

## ✨ Highlights

- **Adversarial AI by construction** — agents never talk directly; they read/write a shared
  *blackboard* and the orchestrator distributes the floor (DAG), so disagreement is structural,
  not incidental.
- **Live evidence, not vibes** — agents design their own search queries, fetch pages, and write
  Zod-validated findings with real URLs. No invented citations survive the contracts.
- **Human-in-the-loop** — after every debate round (1 to 4, your choice) the council pauses: inject
  a directive (e.g. *"Tech, verify transcription pricing at our projected volume"*), continue
  silently, or **stop now** and receive the verdict from the rounds completed so far.
- **WebMCP native** — the web client registers `document.modelContext.registerTool`, so the
  browser's model itself can convene, run, read and arbitrate councils.
- **Vendor-neutral LLM** — OpenAI-compatible chat completions against **OpenRouter** (Groq model
  by default; Claude/GPT/anything via one env var), direct **Groq**, any custom endpoint, or a
  deterministic offline **mock** for demos and tests.
- **Surgical Zod contracts** shared across the workspace — a hallucinated JSON shape can never
  crash the debate; it gets rejected and the model retries with the validation error.

## 🏗️ Repository layout

```
synthcouncil/
├── apps/
│   ├── api/                  # Express + TypeScript engine (Render)
│   │   └── src/
│   │       ├── agents/       # one single-responsibility module per expert
│   │       ├── evidence/     # Tavily / DuckDuckGo / Jina Reader / mock
│   │       ├── llm/          # OpenRouter / Groq / custom / mock client
│   │       ├── orchestrator/ # blackboard, DAG, engine, SSE bus
│   │       ├── storage/      # memory (dev) + Supabase (prod)
│   │       └── routes/       # REST + Server-Sent Events
│   └── web/                  # Astro + React client (Netlify, static)
│       └── src/
│           ├── lib/webmcp.ts # document.modelContext.registerTool (the hackathon requirement)
│           ├── components/   # council board, arbitration panel, WebMCP panel, …
│           └── pages/        # index (convene) + council (?id=…) — static
├── packages/
│   └── schemas/              # shared Zod contracts (blackboard, agents, events, inputs)
├── docs/                     # architecture, submission answers, video script, demo
├── supabase… (migration in apps/api/supabase/migrations)
├── netlify.toml
└── render.yaml
```

## 🚀 Quick start

**Prerequisites:** Node.js ≥ 20 and pnpm (`corepack enable`).

```bash
pnpm install
```

**Run the whole stack offline (no API keys needed):** the API falls back to a deterministic mock
LLM + mock search, so the full debate runs in a sandbox.

```bash
# terminal 1 — engine
pnpm --filter @synthcouncil/api dev        # http://localhost:4000

# terminal 2 — web client
pnpm --filter @synthcouncil/web dev        # http://localhost:4321
```

Open http://localhost:4321, click **Fill demo topic (AI meeting notes)** — a business scenario:
*launch an AI meeting-notes SaaS with a freemium model and EU data residency* — convene the council,
and watch the four agents investigate → debate → pause for **your** arbitration → deliver a verdict.
Mock outputs are clearly labeled `[mock]`.

**Run with a real LLM (recommended for demos):**

```bash
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env → set OPENROUTER_API_KEY (https://openrouter.ai/keys)
```

OpenRouter defaults to `groq/llama-3.3-70b-versatile` (fast, cheap). Any model can be selected per
session or globally via `LLM_MODEL`. Alternatives: `GROQ_API_KEY` for direct Groq,
`LLM_PROVIDER=custom` for any OpenAI-compatible endpoint, `LLM_PROVIDER=mock` to force offline mode.

## 🔑 Configuration (`apps/api/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Engine port |
| `FRONTEND_URL` | `http://localhost:4321` | Comma-separated CORS allow-list |
| `OPENROUTER_API_KEY` | — | OpenRouter key (recommended) |
| `LLM_MODEL` | `groq/llama-3.3-70b-versatile` | Model id (OpenRouter or Groq) |
| `GROQ_API_KEY` | — | Direct Groq alternative |
| `LLM_PROVIDER` | auto | `openrouter` \| `groq` \| `custom` \| `mock` |
| `CUSTOM_LLM_BASE_URL` / `LLM_API_KEY` | — | Any OpenAI-compatible endpoint |
| `TAVILY_API_KEY` | — | Structured search (falls back to DuckDuckGo Lite) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | — | PostgreSQL persistence (falls back to memory) |
| `SEARCH_MOCK=true` | `false` | Fully offline evidence |
| `LLM_TIMEOUT_MS` / `SEARCH_TIMEOUT_MS` / `FETCH_TIMEOUT_MS` | 90s/15s/12s | Outbound timeouts so a slow source never blocks the debate |

## 🛰️ Deployment

- **Web (Netlify):** import the repo, build command comes from `netlify.toml` (`corepack enable &&
  pnpm install --frozen-lockfile && pnpm --filter @synthcouncil/web build`). Set
  `PUBLIC_API_URL` to your Render API. Static output — **zero API keys in the browser**.
- **Engine (Render):** use the **Blueprint** (`render.yaml`). Set `OPENROUTER_API_KEY`,
  `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as secret env vars in the dashboard. Note: free Render
  web services sleep after ~15 min of inactivity; the first request after sleep takes ~30-60 s.
- **Database (Supabase):** run `apps/api/supabase/migrations/20260829_init_blackboard.sql` in the
  SQL editor. Optional — without it, sessions live in memory.

## 🌐 WebMCP — what the browser's model can do

The static site registers four tools through `document.modelContext.registerTool`
(`apps/web/src/lib/webmcp.ts`):

| Tool | Purpose |
| --- | --- |
| `council_create` | Convene a session (topic, experts, rounds, arbitration flag) |
| `council_start` | Launch the investigation |
| `council_status` | Read the full blackboard (findings, positions, verdict) |
| `council_direct` | Act as arbiter: inject a directive or proceed |

In the **ChatGPT desktop browser** or **Chrome 149+** (enable
`chrome://flags/#enable-webmcp-testing`), the model driving the browser can run the entire council
itself — the same actions a human takes in the UI.

## 🧪 Tests

```bash
pnpm --filter @synthcouncil/api test       # 17 tests: JSON contracts, blackboard reducers, full DAG with mock LLM
pnpm -r typecheck                          # strict TS across all workspaces
pnpm -r build                              # contracts + API bundle + static web
```

## 📄 License

[MIT](LICENSE) — visible in the repository's About section as required by the hackathon rules.
