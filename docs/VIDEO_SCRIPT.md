# Demo video script — SynthCouncil (target: 2 min 40 s, hard cap 3 min)

Record with screen capture (Chrome 149+, WebMCP flag enabled if available) + microphone. Cut any
section if you run long — never exceed 3 minutes.

---

## 0:00–0:25 — Hook: the problem

> "A single AI will always agree with you. That's not a feature — it's a bug. Meet SynthCouncil:
> a council of adversarial AI experts — Tech, Finance, Risk and Strategy — that debates your
> problem using live, cited web evidence, under your supervision. Built on WebMCP for the OpenAI
> hackathon."

*Screen: landing page, scroll over the four expert cards.*

## 0:25–0:55 — Convene + investigate

> "Let's give it a real problem: a WhatsApp bot to run informal football tournaments — signups,
> round-robin scheduling, fee collection — without tripping over gambling law. One click loads the
> demo topic. I convene the council… and start the investigation."

*Click "Fill demo topic", "Convene the council", "Start the investigation". Show findings streaming
in — each agent's claims with source links.*

## 0:55–1:20 — The debate + the pause

> "Round one: each agent attacks the others. Notice the objections — Tech challenges the cost
> model, Risk warns about requalification as illegal betting. Then the council stops and waits for
> me. That's the human-in-the-loop, built into the architecture: no arbitration, no verdict."

*Show the positions grid and the "Your arbitration is required" panel.*

## 1:20–1:50 — The arbitration that changes the outcome

> "Here's the part I love: I can reorient the whole debate in plain language. I direct Tech to check
> whether we can integrate direct payment to the venue organizer — so the platform never touches
> the pot. Round two runs with my directive in context."

*Type the directive, send, show round two positions appear.*

## 1:50–2:20 — The verdict

> "The council delivers a structured verdict: phased recommendations, each with an owner, top risks
> with severities, and every source consulted — clickable. This is a decision document, not a chat
> log."

*Scroll the verdict; click one source link.*

## 2:20–2:40 — WebMCP: the model drives the council

> "And because this is WebMCP, the browser's model can do what I just did. Four tools are registered
> via document.modelContext.registerTool — convene, start, status, direct. In a WebMCP-enabled
> browser, the model convenes its own council, runs the investigation and reads the blackboard —
> humans and agents collaborating on the open web, grounded in evidence."

*Show the WebMCP bridge panel with the registered tools. (Optional: if time permits, ask the model
in the ChatGPT browser to run one step.)*

## 2:40–2:50 — Outro

> "SynthCouncil: adversarial AI, live web evidence, human arbitration. Open source, MIT — link
> below. Thank you!"

*Screen: repository page, license visible.*

---

## Recording checklist

- [ ] Audio narration recorded (required by the rules) and clearly audible
- [ ] No third-party trademarks, logos or copyrighted music in the video
- [ ] Live API configured (not mock) so sources are real web pages — or explicitly say "offline mock"
- [ ] Video < 3:00, uploaded to YouTube **public**, link pasted on the Devpost form
- [ ] English narration (or English subtitles/translation provided)
