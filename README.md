
````markdown
# ⚖️ SynthCouncil — The WebMCP-Native AI Council

> **A WebMCP-native adversarial AI council that AI-enabled browsers can discover and operate directly.**

SynthCouncil is an adversarial multi-agent decision-making system built to **challenge assumptions instead of simply agreeing with them**.

Instead of asking a single AI for an answer, SynthCouncil convenes four specialized expert agents — **Tech, Finance, Risk, and Strategy** — who independently investigate a problem, gather live web evidence, challenge opposing positions, and progressively build a shared verdict.

But SynthCouncil is not just another multi-agent AI application.

**Its core capabilities are exposed through WebMCP**, allowing compatible AI-enabled browsers to discover, understand, invoke, monitor, and steer the council directly from the web.

A human remains the final authority throughout the process.

Built for the **OpenAI WebMCP Hackathon**.

---

## 🌐 WebMCP First

WebMCP is a core part of SynthCouncil's architecture, not an afterthought.

A human can operate SynthCouncil through its normal web interface.

At the same time, a compatible AI-enabled browser can discover and operate the same decision-making capabilities through structured WebMCP tools.

This creates a new interaction model:

```text
                    AI-ENABLED BROWSER
                            │
                            │ Discover
                            ▼
                    ┌───────────────┐
                    │    WebMCP     │
                    │     Tools     │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       council_create council_start council_status
                            │
                            ▼
                     council_direct
                            │
                            ▼
                      SYNTHCOUNCIL
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          Experts        Evidence       Arbitration
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                         VERDICT
````

Instead of forcing an AI agent to visually navigate a website, find controls, fill forms, click buttons, and repeatedly inspect the UI, SynthCouncil exposes its capabilities directly as tools.

The browser agent can therefore interact with the application at the **capability level**.

This makes SynthCouncil not only an application that an AI can read, but an application that an AI can **discover and operate**.

---

## 🧩 The WebMCP Tools

SynthCouncil exposes four core capabilities through WebMCP.

The tools are registered directly in the web client using:

```javascript
document.modelContext.registerTool(...)
```

Implementation:

```text
apps/web/src/lib/webmcp.ts
```

### `council_create`

Creates a new council and defines the parameters of the investigation.

The tool can configure:

* the decision or problem to investigate;
* the selected expert personas;
* the number of debate rounds;
* arbitration settings.

---

### `council_start`

Starts the council's investigation.

Once started, the expert agents independently analyze the problem, gather evidence, publish their findings, and prepare for the debate process.

---

### `council_status`

Retrieves the current state of the council.

The browser agent can inspect:

* the shared blackboard;
* expert findings;
* expert positions;
* collected evidence;
* debate state;
* current round;
* arbitration state;
* verdict information.

---

### `council_direct`

Allows the human-controlled arbitration layer to influence the council.

A directive can:

* redirect an investigation;
* request additional verification;
* challenge an assumption;
* continue the debate;
* or stop the process and retrieve the current verdict.

These tools expose the same core operations available through the human-facing application.

**WebMCP does not create a separate version of SynthCouncil.**

It makes the existing decision-making system **agent-accessible**.

---

# 🎯 The Problem

For complex decisions, a single AI assistant can be too agreeable.

It may:

* accept the assumptions contained in the question;
* converge too quickly on one answer;
* overlook important risks;
* provide plausible but weakly supported claims;
* hide uncertainty behind confident language;
* reinforce the user's existing bias.

For serious decisions, simply getting an answer is not enough.

You need a process that actively tries to **break the answer**.

SynthCouncil takes a different approach:

> **Don't ask one AI to be right. Make several AIs disagree, investigate, challenge, and defend their positions.**

The goal is not to generate more AI text.

The goal is to create a **structured decision process**.

---

# 🧠 How SynthCouncil Works

A user starts with a difficult question or decision.

For example:

> "Should we launch an AI meeting-notes SaaS with a freemium model and EU data residency?"

SynthCouncil then follows a controlled workflow:

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │   CONVENE   │
                    │   COUNCIL   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           TECH         FINANCE       RISK       STRATEGY
              │            │            │            │
              └────────────┼────────────┼────────────┘
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
                DIRECTIVE CONTINUE  STOP
                      \     |      /
                           ▼
                    NEXT DEBATE ROUND
                           │
                           ▼
                         VERDICT
```

Every expert has a specific responsibility.

Experts do not simply participate in an unconstrained group chat.

Instead, they:

1. investigate independently;
2. gather relevant evidence;
3. publish findings to the shared blackboard;
4. inspect opposing positions;
5. challenge weaknesses;
6. refine their own position;
7. participate in structured debate;
8. contribute to the final verdict.

The orchestrator controls who acts and when.

This makes disagreement **structural rather than accidental**.

---

# ⚔️ Four Specialized Experts

SynthCouncil currently uses four expert personas.

| Expert          | Responsibility                                                     |
| --------------- | ------------------------------------------------------------------ |
| 🧑‍💻 **Tech**  | Technical feasibility, architecture, implementation constraints    |
| 💰 **Finance**  | Costs, economics, pricing, revenue, financial viability            |
| 🛡️ **Risk**    | Risks, failure modes, security, compliance, uncertainty            |
| 📈 **Strategy** | Market positioning, competition, opportunities, long-term strategy |

Each expert approaches the same problem from a different perspective.

This prevents the council from relying on a single reasoning path.

For example, a startup idea might look technically feasible to the Tech expert while the Finance expert identifies an unsustainable cost structure and the Risk expert identifies regulatory concerns.

The Strategy expert may then challenge all three by comparing the proposal with existing competitors and market conditions.

The resulting discussion is more useful than a single confident answer.

---

# ⚔️ Adversarial by Construction

The council is designed around productive disagreement.

The agents are not rewarded for immediately reaching consensus.

They are expected to inspect each other's reasoning.

```text
Independent analysis
        ↓
Evidence gathering
        ↓
Position formation
        ↓
Cross-examination
        ↓
Challenge
        ↓
Revision
        ↓
Human arbitration
        ↓
Next round
        ↓
Verdict
```

Experts do not directly need to maintain a conversational relationship with each other.

Instead, they communicate through a structured shared state.

This allows the orchestrator to control:

* execution order;
* available state;
* debate rounds;
* evidence;
* human intervention;
* termination.

The architecture therefore treats disagreement as a **first-class feature**.

---

# 🧠 The Shared Blackboard

The shared blackboard is the central state of the council.

Experts independently contribute their findings and positions.

Other experts can then inspect those findings and challenge them.

```text
                 ┌──────────────────────────┐
                 │      SHARED BLACKBOARD   │
                 │                          │
                 │  Evidence                │
                 │  Findings                │
                 │  Positions               │
                 │  Challenges              │
                 │  Revisions               │
                 │  Debate state            │
                 └────────────┬─────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
          TECH              FINANCE             RISK
                              │
                              ▼
                           STRATEGY
```

The blackboard provides a structured memory for the debate.

Instead of passing long conversational messages between agents, the system maintains explicit state that can be inspected by the orchestrator, the human user, and WebMCP tools.

---

# 🌐 Live Web Evidence

SynthCouncil does not rely exclusively on pretrained model knowledge.

Experts can investigate current information from the web.

The evidence layer can:

1. formulate search queries;
2. retrieve current sources;
3. inspect relevant pages;
4. extract useful evidence;
5. associate URLs with findings;
6. expose those sources to the council.

The project supports multiple evidence providers:

* Tavily;
* DuckDuckGo;
* Jina Reader;
* deterministic mock evidence for offline development.

The objective is not to claim that web search makes an AI automatically correct.

Instead, the goal is to make the reasoning process **more traceable, inspectable, and grounded in external evidence**.

---

# 🔎 Evidence and Validation

Evidence is handled as structured data rather than unrestricted model output.

Shared Zod contracts validate the expected structures used throughout the application.

This helps prevent malformed outputs from propagating through the multi-agent pipeline.

Validation is used for areas including:

* agent outputs;
* evidence structures;
* council state;
* debate state;
* verdicts;
* shared application contracts.

When an output does not satisfy the expected structure, the application can reject it and use its error-handling and retry mechanisms.

This is especially important in a multi-agent architecture, where one malformed response could otherwise affect downstream agents.

---

# 👤 Human-in-the-Loop

SynthCouncil is deliberately designed so that AI agents do not silently make the final decision.

**The human remains the final arbiter.**

After each debate round, the process pauses.

The user can:

* inspect expert findings;
* review evidence;
* challenge an assumption;
* ask an expert to verify something;
* inject a directive;
* continue the investigation;
* stop the process;
* accept the verdict reached so far.

For example:

> "Tech, verify transcription pricing at our projected volume."

The council incorporates this directive into the next stage of the investigation.

The human is therefore not merely watching the AI.

**The human is part of the reasoning loop.**

---

# 🌐 WebMCP + Human Arbitration

WebMCP does not remove human control.

Instead, it gives an AI-enabled browser access to the same controlled workflow.

```text
                       HUMAN
                         │
                  Problem / Authority
                         │
                         ▼
                  AI-ENABLED BROWSER
                         │
                    WebMCP Tools
                         │
                         ▼
                    SYNTHCOUNCIL
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
     TECH              FINANCE            RISK       STRATEGY
       │                 │                 │            │
       └─────────────────┼─────────────────┼────────────┘
                         ▼
                   WEB EVIDENCE
                         │
                         ▼
                     DEBATE
                         │
                         ▼
                  HUMAN ARBITRATION
                         │
                         ▼
                      VERDICT
```

The browser agent can operate the council.

The human still controls the decision-making boundary.

---

# 🔄 From Traditional Web Interaction to AI-Operable Applications

Without WebMCP, an AI agent would have to interact with a website similarly to a human:

```text
Understand the UI
       ↓
Find the correct control
       ↓
Fill the form
       ↓
Click a button
       ↓
Wait for state changes
       ↓
Read the interface
       ↓
Repeat
```

With WebMCP:

```text
User's problem
       ↓
AI-enabled browser
       ↓
Discover WebMCP tools
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

The difference is fundamental.

The AI no longer needs to simulate a human operating the interface.

**The application exposes its capabilities directly to the AI.**

This is the core idea behind SynthCouncil's WebMCP integration.

---

# 🧩 WebMCP Architecture

The WebMCP layer lives in the web client.

The backend does not depend on a specific AI browser.

```text
                WEBMCP-CAPABLE AGENT
                         │
                         ▼
                ┌─────────────────┐
                │   Web Client    │
                │                 │
                │ WebMCP Tools    │
                └────────┬────────┘
                         │
                    REST + SSE
                         │
                         ▼
                ┌─────────────────┐
                │ SynthCouncil    │
                │ Engine           │
                └────────┬────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
            Agents    Blackboard  Evidence
              │
              ▼
             LLM
```

The browser-facing layer is intentionally small.

The agent does not need to understand the internal orchestration architecture.

It only needs to understand the capabilities exposed through the tools.

This separation keeps the system modular and allows the backend and WebMCP layer to evolve independently.

---

# 🧪 WebMCP Testing

SynthCouncil is designed to be tested in WebMCP-capable environments.

The web client registers the tools through:

```javascript
document.modelContext.registerTool(...)
```

The implementation can be found at:

```text
apps/web/src/lib/webmcp.ts
```

The application does not depend on ChatGPT as its LLM backend.

The LLM provider and the browser-agent layer are independent components.

This means the architecture is conceptually:

```text
Browser Agent
      │
      ▼
    WebMCP
      │
      ▼
SynthCouncil Web Client
      │
      ▼
SynthCouncil API
      │
      ▼
Multi-Agent Engine
      │
      ├── Tech
      ├── Finance
      ├── Risk
      └── Strategy
```

---

# 🎥 Demo

The SynthCouncil demo demonstrates two complementary experiences.

## Human-facing experience

The user can:

* create a council;
* select expert personas;
* launch the investigation;
* observe the experts investigate;
* review live evidence;
* inspect the debate;
* inject directives;
* continue or stop the process;
* receive the final verdict.

## Agent-facing experience

A compatible AI-enabled browser can:

* discover SynthCouncil's WebMCP tools;
* understand their capabilities;
* create a council;
* start an investigation;
* inspect the current state;
* interact with the arbitration workflow;
* retrieve the resulting state and verdict.

Both experiences operate on the same underlying system.

The UI demonstrates the product.

**WebMCP demonstrates that the product itself can become an AI-operable capability.**

---

# 🏗️ Architecture

SynthCouncil is implemented as a modern TypeScript monorepo.

```text
┌────────────────────────────────────────────────────────────┐
│                       USER / AGENT                         │
│                                                            │
│       Human UI                     WebMCP Agent             │
│          │                              │                   │
└──────────┼──────────────────────────────┼───────────────────┘
           │                              │
           ▼                              ▼
┌────────────────────────────────────────────────────────────┐
│                    ASTRO + REACT WEB CLIENT                │
│                                                            │
│  Council Board │ Arbitration │ WebMCP │ Session Pages     │
│                                                            │
│              document.modelContext                       │
│                  .registerTool()                          │
└────────────────────────────┬───────────────────────────────┘
                             │
                         REST + SSE
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  EXPRESS + TYPESCRIPT ENGINE               │
│                                                            │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ Orchestrator │  │ Blackboard │  │ SSE Event Bus    │   │
│  └───────┬──────┘  └────────────┘  └──────────────────┘   │
│          │                                                 │
│          ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 EXPERT AGENTS                      │   │
│  │     Tech │ Finance │ Risk │ Strategy               │   │
│  └─────────────────────────────────────────────────────┘   │
│          │                                                 │
│          ├──────────────► LLM Provider                      │
│          │                                                 │
│          └──────────────► Evidence / Web Search             │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
                       ┌─────────────┐
                       │  Supabase   │
                       │  PostgreSQL │
                       └─────────────┘
```

The architecture separates:

* browser-agent interaction;
* web application;
* API;
* orchestration;
* expert agents;
* evidence retrieval;
* persistence.

This allows each layer to evolve independently.

---

# 📁 Repository Structure

```text
synthcouncil/
│
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── agents/              # Specialized expert agents
│   │       ├── evidence/            # Web evidence providers
│   │       ├── llm/                 # LLM providers
│   │       ├── orchestrator/        # Council engine, DAG, blackboard
│   │       ├── storage/             # Memory + Supabase
│   │       └── routes/              # REST + SSE
│   │
│   └── web/
│       └── src/
│           ├── lib/
│           │   └── webmcp.ts        # WebMCP tool registration
│           ├── components/          # Council UI + arbitration
│           └── pages/               # Application pages
│
├── packages/
│   └── schemas/                     # Shared Zod contracts
│
├── docs/                            # Architecture and demo docs
├── supabase/                        # Database migrations
├── netlify.toml
├── render.yaml
├── package.json
└── pnpm-workspace.yaml
```

---

# 🛠️ Technology Stack

## Frontend

* Astro
* React
* TypeScript

## Backend

* Node.js
* Express
* TypeScript
* Genkit

## AI

* OpenRouter
* Groq
* OpenAI-compatible endpoints
* Deterministic mock provider

## Agent Interaction

* **WebMCP**
* `document.modelContext.registerTool(...)`

## Validation

* Zod

## Real-Time Communication

* Server-Sent Events (SSE)

## Evidence

* Tavily
* DuckDuckGo
* Jina Reader
* Mock evidence provider

## Persistence

* Supabase
* PostgreSQL
* In-memory storage for local/offline operation

## Deployment

* Netlify
* Render

---

# 🚀 Quick Start

## Requirements

* Node.js >= 20
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

# 🧪 Run Completely Offline

SynthCouncil includes deterministic mock implementations for both the LLM and evidence layers.

This allows the complete application to run without external API keys.

## Start the API

```bash
pnpm --filter @synthcouncil/api dev
```

API:

```text
http://localhost:4000
```

## Start the Web Client

In another terminal:

```bash
pnpm --filter @synthcouncil/web dev
```

Web application:

```text
http://localhost:4321
```

Open the application and use the demo topic to load the example scenario.

The complete council can then run using deterministic mock data.

Mock outputs are explicitly marked:

```text
[mock]
```

---

# 🤖 Run With a Real LLM

Copy the environment template:

```bash
cp apps/api/.env.example apps/api/.env
```

Then configure your preferred provider.

## OpenRouter

```env
OPENROUTER_API_KEY=your_key
```

The default model is:

```text
groq/llama-3.3-70b-versatile
```

A different compatible model can be selected with:

```env
LLM_MODEL=your_model
```

## Direct Groq

```env
GROQ_API_KEY=your_key
```

## Custom OpenAI-Compatible Endpoint

```env
LLM_PROVIDER=custom
CUSTOM_LLM_BASE_URL=...
LLM_API_KEY=...
```

## Offline Mode

```env
LLM_PROVIDER=mock
```

---

# 🔑 Configuration

Main configuration lives in:

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

SynthCouncil uses a split deployment architecture.

```text
                    NETLIFY
                       │
                       │ Static web client
                       ▼
                SYNTHCOUNCIL WEB
                       │
                    REST + SSE
                       │
                       ▼
                     RENDER
                       │
                       │ API / orchestration
                       ▼
                   SUPABASE
                       │
                       ▼
                   POSTGRESQL
```

## Web — Netlify

The Astro/React web client can be deployed to Netlify.

Build configuration:

```text
netlify.toml
```

The web client contains no server-side API secrets.

Configure:

```env
PUBLIC_API_URL=https://your-render-api
```

## Engine — Render

The backend can be deployed using:

```text
render.yaml
```

Required secrets can be configured through the Render dashboard.

Free Render web services may sleep after inactivity, so the first request after a cold start can take longer.

## Database — Supabase

Database migrations are located in:

```text
apps/api/supabase/migrations/
```

Supabase persistence is optional.

Without Supabase, SynthCouncil can operate using in-memory session storage.

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

The test suite covers areas including:

* Zod contracts;
* blackboard reducers;
* orchestration;
* debate DAG execution;
* deterministic mock execution.

---

# 🔒 Design Principles

SynthCouncil follows several deliberate principles.

## 1. The model is not the application

The LLM is replaceable.

SynthCouncil can work with:

* OpenRouter;
* Groq;
* OpenAI-compatible providers;
* custom endpoints;
* deterministic mocks.

The application architecture does not depend on a single model provider.

---

## 2. The agent is not the authority

An AI agent can orchestrate the investigation.

The human retains the ability to:

* inspect evidence;
* challenge assumptions;
* redirect the investigation;
* continue;
* stop.

The system is designed around **human authority rather than blind automation**.

---

## 3. Disagreement is a feature

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

## 4. Evidence should be inspectable

Claims should be connected to external evidence whenever possible.

The objective is not to eliminate uncertainty.

The objective is to make uncertainty, sources, and reasoning easier to inspect.

---

## 5. WebMCP exposes capabilities, not a second application

SynthCouncil does not maintain a separate "AI version" of the product.

The WebMCP tools map to the same core operations available through the human-facing application.

This keeps the agent interaction layer:

* small;
* explicit;
* understandable;
* testable.

---

# 💡 What Makes SynthCouncil Different?

SynthCouncil combines several ideas into one system.

### ⚔️ Adversarial reasoning

Multiple specialized agents are deliberately encouraged to challenge assumptions and opposing positions.

### 🌐 Live web evidence

Experts can investigate current information instead of relying exclusively on pretrained knowledge.

### 👤 Human arbitration

The user remains inside the decision loop.

### 🧩 Structured orchestration

The council is controlled through an explicit workflow rather than an unconstrained group chat.

### 🔒 Structured outputs

Zod contracts enforce predictable structures throughout the system.

### 🌐 WebMCP-native interaction

A compatible AI-enabled browser can discover and operate the application's capabilities directly.

---

# 🔬 Why WebMCP Changes the Application Model

Traditional websites are primarily designed for humans.

A human understands the interface, identifies the correct controls, enters information, and observes the result.

AI agents interacting with such applications have traditionally had to imitate that process.

WebMCP enables another model.

A web application can explicitly describe the actions it makes available to an AI agent.

SynthCouncil uses this capability to expose decision-making operations such as:

```text
Create a council
      ↓
Start an investigation
      ↓
Inspect the council
      ↓
Direct the investigation
      ↓
Continue or stop
      ↓
Retrieve the verdict
```

This is more than an API endpoint.

It creates an interaction layer where the **browser itself becomes an agent interface to the application**.

SynthCouncil is therefore designed around two complementary users:

```text
Human
  │
  └──► Web Interface

AI Agent
  │
  └──► WebMCP

             ↓

       Same Application
             ↓
       Same Council
             ↓
       Same Evidence
             ↓
       Same Arbitration
             ↓
          Verdict
```

---

# 🔮 What's Next?

SynthCouncil is designed as a foundation that can grow beyond the initial four expert personas.

Future directions include:

* additional expert personas;
* customizable expert configurations;
* deeper tool-calling capabilities;
* richer evidence pipelines;
* more sophisticated debate strategies;
* persistent decision histories;
* reusable councils for specific domains;
* improved browser-agent workflows;
* more autonomous WebMCP interactions;
* richer integrations with external tools.

The long-term goal is not simply to create another AI chat application.

The goal is to create a **reusable decision-making capability that AI agents can discover and invoke from the web**.

---

# 🏆 Built for the WebMCP Hackathon

SynthCouncil was built for the **OpenAI WebMCP Hackathon**.

The project explores a simple but powerful question:

> **What happens when a web application stops being something an AI can only read and becomes something an AI can discover and operate?**

SynthCouncil's answer is an adversarial decision-making council combining:

```text
Human judgment
      +
AI orchestration
      +
Multi-agent disagreement
      +
Live web evidence
      +
Structured validation
      +
WebMCP
      =
AI-operable decision making
```

The result is a system where humans and AI agents can interact with the same decision-making infrastructure while preserving a clear human control boundary.

---

# 📌 The Idea in One Sentence

> **SynthCouncil turns AI decision-making into an adversarial, evidence-backed council where specialized agents investigate and challenge each other, humans retain the final word, and WebMCP makes the council directly discoverable and operable by AI-enabled browsers.**

---

# 📄 License

SynthCouncil is licensed under the GNU General Public License v3.0.

See `LICENSE` for details.

---

# 👤 Author

Built by **Lamanirevegrand** for the **OpenAI WebMCP Hackathon**.

```
```
