# ⚖️ SynthCouncil — The Council of Agents

> **What if an AI could challenge itself before giving you an answer?**

SynthCouncil is an adversarial AI council for difficult decisions. Instead of asking a single model for an answer, it convenes several isolated expert agents — **Tech, Finance, Risk, and Strategy** — who independently investigate a problem, gather live web evidence, challenge opposing positions, and build a shared verdict.

A **human arbiter remains in control**: after each debate round, the council pauses so the user can inject a directive, continue, or stop and accept the verdict reached so far.

Built for the **OpenAI WebMCP Hackathon**.

---

## 🎯 The problem

For complex decisions, a single AI assistant can be too agreeable.

It may:

* accept the assumptions contained in the question;
* converge too quickly on one answer;
* overlook important risks;
* provide plausible but weakly supported claims;
* hide uncertainty behind a confident response.

SynthCouncil takes a different approach:

> **Don't ask one AI to be right. Make several AIs disagree, investigate, and defend their positions.**

The goal is not to create more AI-generated text.
The goal is to create a **structured decision process**.

---

## 🧠 How SynthCouncil works

A user starts with a difficult question or decision.

For example:

> *"Should we launch an AI meeting-notes SaaS with a freemium model and EU data residency?"*

The council then follows a controlled workflow:

```text
                    USER
                     │
                     ▼
              ┌─────────────┐
              │   CONVENE   │
              │   COUNCIL   │
              └──────┬──────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       TECH       FINANCE      RISK      STRATEGY
          │          │          │          │
          └──────────┼──────────┼──────────┘
                     │
                     ▼
              LIVE WEB EVIDENCE
                     │
                     ▼
              SHARED BLACKBOARD
                     │
                     ▼
               DEBATE ROUND
                     │
                     ▼
             HUMAN ARBITRATION
                /     |      \
          DIRECTIVE  CONTINUE  STOP
                \     |      /
                     ▼
              NEXT DEBATE ROUND
                     │
                     ▼
                  VERDICT
```

Every expert has a **single responsibility** and works independently.

Agents do not simply chat with each other. They read and write to a shared blackboard, while the orchestrator controls who acts and when.

This makes disagreement **structural rather than accidental**.

---

## ✨ Why SynthCouncil is different

### ⚔️ Adversarial by construction

The experts are isolated personas with different responsibilities.

They do not directly converse with one another. Instead, they:

1. investigate independently;
2. publish findings to the shared blackboard;
3. inspect other positions;
4. challenge weaknesses;
5. refine their own position.

The orchestrator controls the debate as a directed workflow (DAG).

---

### 🌐 Live evidence instead of "AI vibes"

Experts do not rely only on their pretrained knowledge.

They can:

* formulate their own search queries;
* retrieve current web sources;
* inspect pages;
* extract relevant evidence;
* attach URLs to their findings.

Evidence is validated through shared **Zod contracts**, so malformed or hallucinated structures are rejected and retried.

The objective is not to guarantee that every source is correct, but to make the council's reasoning **traceable and inspectable**.

---

### 👤 Human-in-the-loop

The council does not silently make the final decision.

After every debate round, the process pauses.

The human can:

* **inject a directive**;
* ask an expert to verify something;
* **continue** the investigation;
* or **stop** and receive the verdict from the completed rounds.

For example:

> *"Tech, verify transcription pricing at our projected volume."*

The council incorporates the directive and continues from the resulting state.

The human therefore remains the **arbiter**, not merely a spectator.

---

# 🌐 Why WebMCP matters

WebMCP is not just an additional API in SynthCouncil.

It provides a second interaction layer for the same decision-making system.

A human can use SynthCouncil directly through its interface.

A compatible browser agent can instead discover the site's capabilities and operate the council through structured WebMCP tools.

### Without WebMCP

An agent would have to interact with SynthCouncil like a human:

```text
Understand the UI
      ↓
Find the right control
      ↓
Fill the form
      ↓
Click a button
      ↓
Wait for the state to change
      ↓
Read the interface
      ↓
Repeat
```

### With WebMCP

The capabilities of the application become directly available to the agent:

```text
User's problem
      ↓
Browser agent
      ↓
council_create
      ↓
council_start
      ↓
council_status
      ↓
Human directive
      ↓
council_direct
      ↓
Verdict
```

This creates a cooperative workflow:

> **The human provides the problem and retains authority.
> The agent orchestrates the council.
> SynthCouncil provides the decision-making environment.**

---

## 🧩 The four WebMCP tools

SynthCouncil registers four tools through:

```ts
document.modelContext.registerTool(...)
```

implemented in:

```text
apps/web/src/lib/webmcp.ts
```

| Tool             | Purpose                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `council_create` | Create a council with a topic, selected experts, number of rounds, and arbitration settings |
| `council_start`  | Start the council's investigation                                                           |
| `council_status` | Read the current blackboard, findings, positions, debate state, and verdict                 |
| `council_direct` | Act as the human arbiter by injecting a directive, continuing, or stopping the council      |

These tools expose the **same core capabilities available through the human interface**.

WebMCP therefore does not create a separate "agent version" of SynthCouncil.

It makes the existing application **agent-accessible**.

---

## 🧪 WebMCP testing

The project can be tested in WebMCP-capable environments.

### ChatGPT Desktop

The SynthCouncil page registers its four tools with the browser's model context.

When Site Tools/WebMCP execution is available in the ChatGPT Desktop built-in browser, an agent can discover and invoke the tools directly from the page.

### Chrome

For experimental WebMCP testing:

**Chrome 149+**

Enable:

```text
chrome://flags/#enable-webmcp-testing
```

Then open the deployed SynthCouncil application.

The important point is that **SynthCouncil itself does not depend on ChatGPT**.

WebMCP is implemented at the web-client level through:

```ts
document.modelContext.registerTool
```

The LLM backend is completely independent from this browser-agent layer.

---

## 🎥 Demo

The demo video focuses on the **human-facing SynthCouncil experience**: convening the council, watching experts investigate and debate, reviewing evidence, and exercising human arbitration.

The WebMCP layer exposes these same capabilities to compatible browser agents.

This separation is intentional:

* **the UI demonstrates the product and human workflow;**
* **WebMCP demonstrates agent interoperability with that workflow.**

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     USER / AGENT                         │
│                                                          │
│        Human UI                  WebMCP Agent             │
│           │                           │                   │
└───────────┼───────────────────────────┼───────────────────┘
            │                           │
            ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│                  ASTRO + REACT WEB CLIENT                 │
│                                                          │
│  Council Board │ Arbitration │ WebMCP │ Session Pages    │
│                                                          │
│                 document.modelContext                    │
│                     .registerTool()                      │
└──────────────────────────┬───────────────────────────────┘
                           │ REST + SSE
                           ▼
┌──────────────────────────────────────────────────────────┐
│                EXPRESS + TYPESCRIPT ENGINE                │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ Orchestrator│  │ Blackboard │  │ SSE Event Bus    │   │
│  └──────┬─────┘  └────────────┘  └──────────────────┘   │
│         │                                                │
│         ▼                                                │
│  ┌───────────────────────────────────────────────────┐   │
│  │                Expert Agents                      │   │
│  │   Tech │ Finance │ Risk │ Strategy                │   │
│  └───────────────────────────────────────────────────┘   │
│         │                                                │
│         ├──────────────► LLM Provider                    │
│         │                                                │
│         └──────────────► Evidence / Web Search           │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │ PostgreSQL  │
                    └─────────────┘
```

---

## 📁 Repository layout

```text
synthcouncil/
├── apps/
│   ├── api/                         # Express + TypeScript engine
│   │   └── src/
│   │       ├── agents/              # Single-responsibility experts
│   │       ├── evidence/            # Tavily / DuckDuckGo / Jina / mock
│   │       ├── llm/                 # OpenRouter / Groq / custom / mock
│   │       ├── orchestrator/        # Blackboard, DAG, engine, SSE
│   │       ├── storage/             # Memory + Supabase
│   │       └── routes/              # REST + Server-Sent Events
│   │
│   └── web/                         # Astro + React client
│       └── src/
│           ├── lib/
│           │   └── webmcp.ts        # WebMCP tool registration
│           ├── components/          # Council UI + arbitration + WebMCP
│           └── pages/               # Convene + council pages
│
├── packages/
│   └── schemas/                     # Shared Zod contracts
│
├── docs/                            # Architecture, demo & submission docs
├── supabase/                        # Database migrations
├── netlify.toml
├── render.yaml
├── package.json
└── pnpm-workspace.yaml
```

---

# 🚀 Quick start

## Requirements

* Node.js ≥ 20
* pnpm

Enable Corepack if necessary:

```bash
corepack enable
```

Install dependencies:

```bash
pnpm install
```

---

## Run completely offline

SynthCouncil includes deterministic mock implementations for both the LLM and evidence layers.

No API keys are required.

### Terminal 1 — API

```bash
pnpm --filter @synthcouncil/api dev
```

API:

```text
http://localhost:4000
```

### Terminal 2 — Web client

```bash
pnpm --filter @synthcouncil/web dev
```

Web application:

```text
http://localhost:4321
```

Open the application and use **Fill demo topic** to load the example scenario.

The complete council can then run using mock data.

Mock outputs are clearly marked:

```text
[mock]
```

---

# 🤖 Run with a real LLM

Copy the environment template:

```bash
cp apps/api/.env.example apps/api/.env
```

Then configure your provider.

### OpenRouter

```env
OPENROUTER_API_KEY=your_key
```

The default model is:

```text
groq/llama-3.3-70b-versatile
```

You can select another compatible model with:

```env
LLM_MODEL=your_model
```

### Direct Groq

```env
GROQ_API_KEY=your_key
```

### Custom OpenAI-compatible endpoint

```env
LLM_PROVIDER=custom
CUSTOM_LLM_BASE_URL=...
LLM_API_KEY=...
```

### Offline mode

```env
LLM_PROVIDER=mock
```

---

# 🔑 Configuration

Configuration lives in:

```text
apps/api/.env
```

| Variable               | Default                        | Purpose                                   |
| ---------------------- | ------------------------------ | ----------------------------------------- |
| `PORT`                 | `4000`                         | API port                                  |
| `FRONTEND_URL`         | `http://localhost:4321`        | CORS allow-list                           |
| `OPENROUTER_API_KEY`   | —                              | OpenRouter API key                        |
| `LLM_MODEL`            | `groq/llama-3.3-70b-versatile` | Model identifier                          |
| `GROQ_API_KEY`         | —                              | Direct Groq alternative                   |
| `LLM_PROVIDER`         | `auto`                         | `openrouter`, `groq`, `custom`, or `mock` |
| `CUSTOM_LLM_BASE_URL`  | —                              | OpenAI-compatible endpoint                |
| `LLM_API_KEY`          | —                              | Custom endpoint key                       |
| `TAVILY_API_KEY`       | —                              | Structured web search                     |
| `SUPABASE_URL`         | —                              | Supabase project URL                      |
| `SUPABASE_SERVICE_KEY` | —                              | Supabase service key                      |
| `SEARCH_MOCK`          | `false`                        | Force offline evidence                    |
| `LLM_TIMEOUT_MS`       | `90000`                        | LLM timeout                               |
| `SEARCH_TIMEOUT_MS`    | `15000`                        | Search timeout                            |
| `FETCH_TIMEOUT_MS`     | `12000`                        | Page fetch timeout                        |

---

# 🛰️ Deployment

SynthCouncil is designed as a split deployment:

```text
Netlify
  │
  │ static web client
  ▼
SynthCouncil Web
  │
  │ REST + SSE
  ▼
Render
  │
  │ API / orchestration
  ▼
Supabase
  │
  ▼
PostgreSQL
```

### Web — Netlify

Import the repository into Netlify.

The build command is defined in:

```text
netlify.toml
```

The web client is static and contains no server-side API secrets.

Set:

```env
PUBLIC_API_URL=https://your-render-api
```

### Engine — Render

Use the included:

```text
render.yaml
```

Configure the required secrets in the Render dashboard.

> **Note:** Free Render web services may sleep after inactivity, so the first request after a cold start can take longer.

### Database — Supabase

Run the migration located in:

```text
apps/api/supabase/migrations/
```

Supabase persistence is optional.

Without it, SynthCouncil can operate with in-memory session storage.

---

# 🧪 Tests

Run the API test suite:

```bash
pnpm --filter @synthcouncil/api test
```

Run TypeScript checks:

```bash
pnpm -r typecheck
```

Build all workspaces:

```bash
pnpm -r build
```

The test suite covers:

* Zod contracts;
* blackboard reducers;
* orchestration;
* the complete debate DAG;
* deterministic mock execution.

---

# 🔒 Design principles

SynthCouncil follows a few deliberate principles.

### 1. The model is not the application

The LLM is replaceable.

SynthCouncil can work with:

* OpenRouter;
* Groq;
* another OpenAI-compatible provider;
* a custom endpoint;
* deterministic mocks.

---

### 2. The agent is not the authority

The agent can orchestrate the investigation.

The human retains the ability to:

* inspect the evidence;
* challenge assumptions;
* redirect the investigation;
* continue;
* stop.

---

### 3. Disagreement is a feature

Experts are intentionally separated by responsibility.

The system does not optimize for immediate agreement.

It optimizes for:

```text
Independent analysis
        ↓
Evidence
        ↓
Conflict
        ↓
Revision
        ↓
Human arbitration
        ↓
Decision
```

---

### 4. WebMCP exposes capabilities, not a second application

The WebMCP tools map to the same operations available in the human-facing application.

This keeps the agent interaction layer small, explicit, and testable.

---

# 🛠️ Technology

* **Astro + React** — web client
* **TypeScript** — application and engine
* **Express** — API
* **WebMCP** — agent-facing web capabilities
* **Zod** — runtime contracts and validation
* **Server-Sent Events** — live council updates
* **OpenRouter / Groq / custom OpenAI-compatible endpoints** — LLM providers
* **Tavily / DuckDuckGo / Jina Reader** — evidence retrieval
* **Supabase / PostgreSQL** — persistence
* **Netlify** — web deployment
* **Render** — API deployment

---

# 💡 The idea in one sentence

> **SynthCouncil turns AI decision-making into an adversarial, evidence-backed council where agents investigate and challenge each other, while a human keeps the final word — and WebMCP makes that council directly operable by browser agents.**

---

# 📄 License

SynthCouncil is licensed under the **GNU General Public License v3.0 (GPL-3.0-only)**.

See `LICENSE` for details.

---

## 👤 Author

Built by **Lamanirevegrand** for the **OpenAI WebMCP Hackathon**.
