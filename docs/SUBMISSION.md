# SynthCouncil — Hackathon Submission

**Project:** SynthCouncil — The Council of Agents
**Hackathon:** OpenAI WebMCP (openai.devpost.com)
**Live URL:** https://synthcouncil.netlify.app (engine: https://synthcouncil-api.onrender.com)
**Repository:** https://github.com/synthcouncil/synthcouncil (MIT license, visible in About)
**Demo video:** https://youtu.be/<your-video-id> (< 3 minutes, script in VIDEO_SCRIPT.md)

---

## 1. Why this use case is a perfect fit for WebMCP

WebMCP's promise is that **the web becomes the shared workspace of humans and agents**. SynthCouncil
is a product that only makes sense with that premise: an adversarial council of AI experts whose
entire value is *falsifiable, sourced reasoning about the current world*.

- **A debate without evidence is theater.** A single AI happily produces confident consensus text.
  SynthCouncil's agents are *required* to prove claims with live pages — Twilio webhook docs,
  mobile-money fee schedules, gambling-law guidance. WebMCP is what makes "prove it" executable
  inside the browser.
- **The browser's model is a first-class citizen.** The static client registers the council as
  four `document.modelContext.registerTool` tools. The model driving the browser can convene a
  council, launch the investigation, read the blackboard and arbitrate — the exact same workflow a
  human performs in the UI. Humans and agents literally share one interface to the web.
- **It showcases the open web as a substrate for collaboration**: every URL the agents consulted
  stays visible and clickable; nothing is trapped inside a black box.

## 2. How it creates a better user experience

- **You don't read, you arbitrate.** Instead of a wall of chat, the UI shows a structured
  blackboard: findings with citations, debate positions with explicit objections, and a *hard
  pause* where the product asks for your judgment — e.g. *"Tech, verify transcription pricing at
  our projected volume."* Round two then runs with your instruction in context. You decide when the
  debate is done: end it early at any round and the council synthesizes the verdict from the rounds
  already completed (up to 4).
- **Live progress, not waiting.** Server-Sent Events stream every phase, finding and objection onto
  the page in real time; you watch the council work.
- **Trust through provenance.** Every claim links its source; the verdict lists every consulted URL
  and an honest confidence score. No more "trust me".
- **Zero setup friction.** The same pipeline runs fully offline in mock mode (perfect for judging
  environments) or with one API key for live evidence.

## 3. What people and agents can now do together

Previously, getting a *grounded, adversarial, multi-perspective* analysis meant assembling experts,
finding documents, and running a structured debate yourself. With SynthCouncil:

- a human states a problem and supervises; **four specialized agents autonomously search the live
  web, fetch pages and publish cited findings**;
- the human intervenes *mid-debate* with natural-language directives that genuinely change the
  subsequent reasoning (they are injected into the blackboard);
- the output is a **verifiable artifact** — recommendations with owners, risks with severities, and
  the exact sources consulted — not a chat log.

The demo scenario (launching an AI meeting-notes SaaS with a freemium model) is a real problem
where this matters: a purely consensual AI would happily bless the pricing and the architecture;
the Finance agent (unit economics, hidden API fees) and the Risk agent (GDPR, AI-liability) — plus
the arbiter's steering — are what keep the launch honest.

## 4. How WebMCP was implemented

1. **Client (Astro + React, static on Netlify)** — `apps/web/src/lib/webmcp.ts` registers four
   tools via `document.modelContext.registerTool`, each with a JSON-Schema `inputSchema` and an
   `execute` that relays to the engine API. Registration is guarded and idempotent; the UI shows
   the live registry in the "WebMCP bridge" panel. No API keys ever ship to the browser.

   ```js
   document.modelContext.registerTool({
     name: "council_create",
     description: "Convene a SynthCouncil session — an adversarial committee of AI experts that debates a problem with live web evidence.",
     inputSchema: {
       type: "object",
       properties: { topic: { type: "string", description: "The problem to debate" } },
       required: ["topic"]
     },
     execute: async (input) => {
       const response = await fetch("https://synthcouncil-api.onrender.com/api/sessions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ topic: input.topic })
       });
       return response.json();
     }
   });
   ```

2. **Engine (Express + TypeScript ESM on Render)** — `POST /api/sessions` creates a session;
   `POST /api/sessions/:id/start` runs the orchestration DAG (investigate → debate → arbitrate →
   synthesize) over an OpenAI-compatible LLM (OpenRouter, Groq by default); every agent output is
   parsed and validated by **shared Zod contracts** (`packages/schemas`); progress is streamed via
   Server-Sent Events; the human arbitrates through `POST /api/sessions/:id/arbitrate`.

3. **Evidence** — agents design search queries, the engine searches (Tavily or key-free DuckDuckGo)
   and fetches pages (with Jina Reader fallback), and findings may cite **only** the fetched pack —
   enforced by prompts and Zod.

4. **Judging** — in the ChatGPT desktop browser or Chrome 149+ with
   `chrome://flags/#enable-webmcp-testing`, open the live URL: the WebMCP bridge panel shows the
   four registered tools, and the model can drive a council end-to-end. The repository contains the
   `document.modelContext.registerTool` call verbatim, an MIT license, and a public build.

## Test instructions for judges

1. Open https://synthcouncil.netlify.app (Chrome 149+ with WebMCP enabled, or the ChatGPT desktop
   browser).
2. Click **Fill demo topic (AI meeting notes)** — an AI meeting-notes SaaS launch — → **Convene the council**.
3. On the council page, click **Start the investigation** and watch findings stream in.
4. When the debate pauses (**Awaiting arbiter**), type a directive — e.g. *"Tech, verify
   transcription pricing at our projected volume"* — and send it.
5. Read the final **Verdict**: recommendations, risks, and clickable sources.
6. Scroll to the **WebMCP bridge** panel to inspect the registered tools; in a WebMCP-enabled
   browser, ask the model to convene its own council.
