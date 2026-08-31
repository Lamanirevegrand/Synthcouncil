# SynthCouncil — 5-minute demo checklist

Use this to prepare a live walkthrough (video or judge session).

## Setup (once)

1. Deploy the engine on Render (Blueprint from `render.yaml`) with `OPENROUTER_API_KEY` set.
2. Deploy the web client on Netlify (build from `netlify.toml`) with
   `PUBLIC_API_URL=https://<your-render-service>/api`.
3. Optional: Supabase — run the migration in
   `apps/api/supabase/migrations/20260829_init_blackboard.sql` and set the two keys.
4. Open the live URL in **Chrome 149+** (`chrome://flags/#enable-webmcp-testing`) or the ChatGPT
   desktop browser.

## Walkthrough (≈ 4 min)

1. **Landing (15 s)** — explain the concept in one sentence: four adversarial AI experts debating
   your problem with live, cited evidence, arbitrated by you.
2. **Convene (30 s)** — "Fill demo topic (AI meeting notes)" → Convene. Show the expert
   checkboxes and debate-rounds option.
3. **Investigate (60 s)** — "Start the investigation". Point out findings streaming in with
   clickable source URLs. If a source fails, note that agents degrade gracefully.
4. **Debate + arbitration (60 s)** — show positions with objections; when the panel appears, type
   *"Tech, verify server-side transcription pricing at our projected volume before we lock the
   freemium tier."* → Send.
5. **Verdict (45 s)** — recommendations with owners, risks with severities, sources, confidence.
6. **WebMCP bridge (30 s)** — the panel listing the four registered tools; in a WebMCP browser,
   ask the model to convene its own council via `council_create`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Cannot reach the SynthCouncil engine" | Is the Render service awake? Free tier sleeps after ~15 min idle; first request takes ~30-60 s. Check `PUBLIC_API_URL` (no trailing slash) and CORS (`FRONTEND_URL`). |
| Council stuck in "investigating" | Search/fetch timeouts may be long; wait, or shorten `SEARCH_TIMEOUT_MS`/`FETCH_TIMEOUT_MS`. |
| Model output rejected | The engine retries once with validation feedback; transient. Check API logs for `StructuredOutputError`. |
| Sessions disappear on restart | Memory storage (no Supabase) — expected. |
| WebMCP panel says "not detected" | Browser lacks WebMCP; open Chrome 149+ with the flag, or the ChatGPT desktop browser. The product still works via the UI. |
