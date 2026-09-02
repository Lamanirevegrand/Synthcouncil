import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../env';
import { getRegisteredTools, isWebMCPAvailable, registerWebMCPTools } from '../lib/webmcp';

const POLL_INTERVAL_MS = 700;
const POLL_LIMIT = 15; // ~10 s, then stop and let the manual button take over.

/**
 * WebMCP status panel. Registration itself is automatic (see WebMCPRegistrar
 * in the layout); this panel only observes and displays the real state:
 * context missing, context present but tools not yet registered, or tools
 * registered and ready for the browser's model.
 */
export default function WebMCPPanel() {
  const [available, setAvailable] = useState(() => isWebMCPAvailable());
  const [tools, setTools] = useState(() => getRegisteredTools());

  useEffect(() => {
    let stopped = false;
    let ticks = 0;

    const refresh = () => {
      if (stopped) return;
      setAvailable(isWebMCPAvailable());
      setTools(getRegisteredTools());
      ticks += 1;
      if (ticks < POLL_LIMIT) {
        window.setTimeout(refresh, POLL_INTERVAL_MS);
      }
    };

    refresh();
    return () => {
      stopped = true;
    };
  }, []);

  const handleRegister = () => {
    const result = registerWebMCPTools();
    setAvailable(result.available);
    setTools(getRegisteredTools());
  };

  const status =
    !available ? 'off' : tools.length === 0 ? 'pending' : 'ready';

  const snippet = useMemo(
    () => `document.modelContext.registerTool({
  name: "council_create",
  description: "Convene a SynthCouncil session — an adversarial committee of AI experts that debates a problem with live web evidence.",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "The problem to debate" }
    },
    required: ["topic"]
  },
  execute: async (input) => {
    // Relay to the SynthCouncil engine (no API keys in the browser)
    const response = await fetch(${JSON.stringify(API_ENDPOINTS.sessions)}, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: input.topic })
    });
    return response.json();
  }
});`,
    []
  );

  return (
    <section className="card webmcp-panel" id="webmcp">
      <div className="card-head">
        <h3>
          <span className="dot" aria-hidden /> WebMCP bridge
        </h3>
        <span
          className={`pill ${
            status === 'ready' ? 'pill-ok' : status === 'pending' ? 'pill-wait' : 'pill-off'
          }`}
        >
          {status === 'ready'
            ? `Model context detected · ${tools.length} tool(s) registered`
            : status === 'pending'
              ? 'Model context present — tools registering…'
              : 'Browser not WebMCP-enabled'}
        </span>
      </div>

      <p className="muted" style={{ fontSize: '0.9rem' }}>
        The council tools register <strong>automatically on every page</strong> via{' '}
        <code>document.modelContext.registerTool</code>. In the ChatGPT desktop browser or Chrome
        149+ (flag <code>chrome://flags/#enable-webmcp-testing</code>), ask the model to use the
        SynthCouncil tools <em>on the current page</em> — it can convene, run, read and arbitrate
        councils, exactly like a human in the UI.
      </p>

      <div className="tool-grid">
        {tools.length === 0 && <p className="muted">No tools registered yet.</p>}
        {tools.map((tool) => (
          <div className="tool-card" key={tool.name}>
            <code className="tool-name">{tool.name}</code>
            <p>{tool.description}</p>
            <details>
              <summary>inputSchema</summary>
              <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>

      <details className="snippet-details">
        <summary>The registerTool call this repository ships (per hackathon rules)</summary>
        <pre className="snippet">{snippet}</pre>
      </details>

      <button type="button" className="btn btn-ghost btn-small" onClick={handleRegister}>
        Re-register tools
      </button>
    </section>
  );
}
