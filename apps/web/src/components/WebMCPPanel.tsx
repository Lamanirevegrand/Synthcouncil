import { useMemo, useState } from 'react';
import { getRegisteredTools, isWebMCPAvailable, registerWebMCPTools } from '../lib/webmcp';

/**
 * WebMCP status panel: is the browser's model context available, which council
 * tools are registered, and the exact registerTool call this repo ships.
 */
export default function WebMCPPanel() {
  const [available, setAvailable] = useState(() => isWebMCPAvailable());
  const [tools, setTools] = useState(() => getRegisteredTools());

  const handleRegister = () => {
    const result = registerWebMCPTools();
    setAvailable(result.available);
    setTools(getRegisteredTools());
  };

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
    const response = await fetch("https://synthcouncil-api.onrender.com/api/sessions", {
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
        <span className={`pill ${available ? 'pill-ok' : 'pill-off'}`}>
          {available ? 'Model context detected' : 'Browser not WebMCP-enabled'}
        </span>
      </div>

      <p className="muted" style={{ fontSize: '0.9rem' }}>
        The council is exposed to the browser's model via <code>document.modelContext.registerTool</code>.
        In the ChatGPT desktop browser or Chrome 149+ (flag <code>chrome://flags/#enable-webmcp-testing</code>),
        the model can convene, run, read and arbitrate councils — exactly like a human in the UI.
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
