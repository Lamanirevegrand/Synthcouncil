# SynthCouncil — Architecture

## 1. Vision

SynthCouncil is a **council of specialized AI agents** (Tech, Finance, Risk, Strategy) that
debates a complex problem under a human arbiter, grounded in **live web evidence**. It exists to
kill the *compliance bias* of a single AI: one model will agree with you and produce consensus
text; a committee of isolated, adversarial personas that must **prove claims with sources** cannot.

The reference use case — designed into the demo — is a **WhatsApp sports-tournament platform**
(Maracana, 3×3): automating signups, round-robin scheduling and fee collection while staying clear
of gambling legislation. The council investigates Twilio-style stateless webhooks (Tech), mobile
money fees and escrow patterns (Finance), amateur-pool / betting requalification risk (Risk) and
sequencing (Strategy); the arbiter reorients the debate mid-way; the verdict lands with
recommendations, risks and documentation links.

## 2. Core pattern: Blackboard + DAG orchestration

```
                    ┌────────────────────────────────────────────────┐
                    │                 BLACKBOARD                     │
                    │  findings · positions · arbitrations · verdict │
                    │  log · status (created → … → complete)          │
                    └───────▲───────────────▲───────────────▲────────┘
                            │               │               │
              ┌─────────────┴─────┐  ┌──────┴───────┐  ┌────┴────────┐
              │  Tech Architect   │  │ Finance CFO  │  │ Risk Counsel│   Strategy Chair
              └─────────────┬─────┘  └──────┬───────┘  └────┬────────┘
                            │               │               │
                            └───────────────┴───────────────┘
                                    ORCHESTRATOR (DAG)
                          reads state → distributes the floor
                                    │
                            Human arbiter (SSE + REST)
```

**Agents never talk to each other.** The orchestrator reads the shared blackboard and schedules
each step; agents only read prior state and write their contribution. This guarantees stable,
replayable, auditable debates (no chat chaos) and makes every intermediate state persistable.

### The DAG

```
created → investigating → debating → arbitrating → debating → synthesizing → complete
                                    │                                    │
                                    ▼                                    ▼
                            (human directive)                        (any step can fail → error)
```

1. **investigating** — for each convened agent: (a) the agent designs its own search queries,
   (b) the evidence provider searches and fetches the best pages, (c) the agent writes
   Zod-validated **findings** citing only the fetched pack.
2. **debating (round 1)** — each agent publishes a **position**: stance, argument, explicit
   *objections against other agents*, supporting finding ids, sources.
3. **arbitrating** — hard pause. The engine waits; SSE announces `arbitration_request`. The human
   injects a directive (optionally aimed at one agent) or proceeds.
4. **debating (round 2)** — positions are written again with the directives in context.
5. **synthesizing → complete** — the Strategy Chair merges everything into a **verdict**:
   summary, recommendations (each with an owner), risks (with severity), sources, confidence.

## 3. LLM provider abstraction (`apps/api/src/llm`)

Every step goes through `LlmClient.completeJson({ system, user, schema })`:

- One OpenAI-compatible chat-completions call (fetch — no vendor SDK).
- The response is parsed leniently (`jsonFromText`: bare JSON → fences → balanced-object scan),
  sources normalized, then validated against the **exact Zod schema** for that step.
- On failure, the model gets **one retry with the validation error as feedback**; a second failure
  becomes a structured error the engine records — the debate state machine never crashes.

Provider resolution (priority): `LLM_PROVIDER` → `LLM_MOCK` → `OPENROUTER_API_KEY` →
`GROQ_API_KEY` → mock (non-production). Default model `groq/llama-3.3-70b-versatile` on OpenRouter.

A deterministic **mock provider** mirrors the same schemas (keyed by schema identity), so the whole
DAG runs offline; mock outputs are labeled `[mock]`.

## 4. Evidence pipeline (`apps/api/src/evidence`)

- **Search:** Tavily (structured JSON) when `TAVILY_API_KEY` is set; otherwise a key-free
  DuckDuckGo Lite scrape; mock when `SEARCH_MOCK=true`.
- **Fetch:** direct HTTP with a browser-like UA; on failure, Jina Reader (`r.jina.ai`) as a
  rendering fallback; HTML reduced to readable text (no heavy parser).
- **Hard timeouts** (`SEARCH_TIMEOUT_MS`, `FETCH_TIMEOUT_MS`) so a slow source can never stall the
  debate; per-query failures degrade gracefully (the agent proceeds with what it has and says so).
- **Anti-hallucination:** prompts forbid inventing URLs; findings are validated by Zod; the UI
  renders sources as links judges can click.

## 5. WebMCP bridge (`apps/web/src/lib/webmcp.ts`)

The static client registers four tools:

```js
document.modelContext.registerTool({
  name: "council_create",
  description: "Convene a SynthCouncil session …",
  inputSchema: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] },
  execute: async (input) => { /* relay to the engine API */ }
});
```

`council_create`, `council_start`, `council_status`, `council_direct` let the browser's model drive
the full product. Registration is guarded (`isWebMCPAvailable()`), idempotent, and the UI shows
the live registry in the **WebMCP bridge** panel.

## 6. API surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/sessions` | Convene a council (`topic`, `context?`, `agents?`, `debateRounds?`, `requireArbitration?`) |
| `GET` | `/api/sessions/:id` | Snapshot: session header + full blackboard |
| `POST` | `/api/sessions/:id/start` | Launch the DAG (202; progress streams via SSE) |
| `POST` | `/api/sessions/:id/arbitrate` | `{ directive?, targetAgent? }` or `{ proceed: true }` |
| `GET` | `/api/sessions/:id/events` | SSE stream of council events |
| `GET` | `/health` | Liveness for Render |

SSE events: `phase`, `finding`, `position`, `arbitration_request`, `arbitration`, `log`, `verdict`,
`error` — all validated by a Zod discriminated union and published **after** persistence, so a
reconnecting client re-fetches the snapshot and loses nothing.

## 7. Persistence (`apps/api/src/storage`)

`CouncilStore` interface — the engine never touches SQL. Two implementations:

- **memory** — default (dev, tests, no credentials): sessions lost on restart, clearly warned.
- **supabase** — PostgreSQL tables `sessions` + `blackboards` (JSONB), migration in
  `apps/api/supabase/migrations/20260829_init_blackboard.sql`. Backend-only service-key access,
  RLS off by design (the engine is the only client).

## 8. Security & ops

- **CORS allow-list** (`FRONTEND_URL`, comma-separated) — only declared origins may call the API.
- **No secrets in the client**: the web bundle only knows `PUBLIC_API_URL`.
- **Strict Zod contracts** at every boundary (route inputs, LLM outputs, SSE events, DB rows).
- **Timeout + retry** management at every outbound boundary (LLM, search, fetch).
- **Graceful shutdown**, structured error middleware (Zod → 400, ApiError → status, LLM → 502,
  generic → 500, with dev-only detail).

## 9. Extending the council

Adding an expert (Legal, Marketing, …) is **file injection only**:

1. create `apps/api/src/agents/legal.agent.ts` (persona + investigation/debate rules),
2. register it in `agents/registry.ts` + `packages/schemas/src/agent.schema.ts`,
3. add its meta to `apps/web/src/lib/agents.ts`.

The engine, contracts, storage and UI all adapt — the doc's "add an agent by injection" promise.
