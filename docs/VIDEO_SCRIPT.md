# Demo video script — SynthCouncil (target: 2 min 45 s, hard cap 3 min)

Record with screen capture (Chrome 149+, WebMCP flag enabled if available) + microphone. Cut any
section if you run long — never exceed 3 minutes.

**Demo path shown:** 4 rounds configured → directive at round 2 → deliberate **early exit** after
round 2 → verdict. This demonstrates both the per-round human gates and the architecture's
flexibility (skip rounds 3-4 on purpose).

---

## 0:00–0:25 — Hook: the problem

> "A single AI will always agree with you. That's not a feature — it's a bug. Meet SynthCouncil:
> a council of adversarial AI experts — Tech, Finance, Risk and Strategy — that debates your
> problem using live, cited web evidence, under your supervision. Built on WebMCP for the OpenAI
> hackathon."

*Screen: landing page, scroll over the four expert cards.*

## 0:25–0:50 — Convene + investigate

> "Let's give it a real business problem: launching an AI meeting-notes SaaS for small teams —
> transcription, summaries, action items, a freemium model and EU data residency from day one.
> One click loads the demo, with a full four-round debate budget. I convene the council… and start
> the investigation."

*Click "Fill demo topic (AI meeting notes)" — point out that "Debate rounds" is set to 4 — then
"Convene the council" and "Start the investigation". Show findings streaming in — each agent's
claims with source links.*

## 0:50–1:10 — The debate + the pause

> "Round one: each agent attacks the others. Tech challenges the cost of the pipeline, Finance
> challenges the freemium math, Risk warns about GDPR and AI liability. Then the council stops and
> waits for me. That's the human-in-the-loop, built into the architecture: no arbitration, no
> verdict. Notice the badge: round one of four complete."

*Show the positions grid with objections and the "Your arbitration is required" panel with its
"Round 1 of 4 complete" badge.*

## 1:10–1:35 — The arbitration that changes the outcome

> "I can reorient the whole debate in plain language. I direct Tech to verify server-side
> transcription pricing at our projected volume before we lock the freemium tier. Round two runs
> with my directive in context — and the council pauses again, because the budget was four rounds."

*Type the directive, send, show round two positions appear, then the second pause (round 2 of 4).*

## 1:35–1:55 — The early exit (the flexible architecture)

> "Here's the part I love: I don't have to wait for rounds three and four. The arbiter can end the
> debate at any round. I hit 'Finish now' — the council immediately synthesizes the verdict from
> the two rounds already completed. No wasted compute, no wasted time."

*Point at the "Finish now — deliver the verdict" button and click it; watch the verdict appear.*

## 1:55–2:20 — The verdict

> "The council delivers a structured verdict: phased recommendations, each with an owner, top risks
> with severities, and every source consulted — clickable. This is a decision document, not a chat
> log."

*Scroll the verdict; click one source link.*

## 2:20–2:40 — WebMCP: the model drives the council

> "And because this is WebMCP, the browser's model can do what I just did. Four tools are registered
> via document.modelContext.registerTool — convene, start, status, direct — including stopping the
> debate early. In a WebMCP-enabled browser, the model convenes its own council, runs the
> investigation and reads the blackboard — humans and agents collaborating on the open web,
> grounded in evidence."

*Show the WebMCP bridge panel with the registered tools. (Optional: if time permits, ask the model
in the ChatGPT browser to run one step.)*

## 2:40–2:50 — Outro

> "SynthCouncil: adversarial AI, live web evidence, human arbitration — and you decide when the
> debate is done. Open source, MIT — link below. Thank you!"

*Screen: repository page, license visible.*

---

## Recording checklist

- [ ] Audio narration recorded (required by the rules) and clearly audible
- [ ] No third-party trademarks, logos or copyrighted music in the video
- [ ] Live API configured (not mock) so sources are real web pages — or explicitly say "offline mock"
- [ ] Video < 3:00, uploaded to YouTube **public**, link pasted on the Devpost form
- [ ] English narration (or English subtitles/translation provided)
