import { useState } from 'react';
import type { AgentId } from '@synthcouncil/schemas';
import { AGENT_META, AGENT_ORDER } from '../lib/agents';
import { api, ApiClientError } from '../lib/api';

const DEMO_TOPIC =
  'Launch an AI meeting-notes SaaS for small teams: automatic transcription, summaries and action items — with a freemium model and EU data residency from day one.';

const DEMO_CONTEXT =
  'Bootstrapped team of 3. Target: 10,000 free users in year one, 5% conversion to a €12/month Pro plan. No external funding.';

export default function CreateCouncilForm() {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [agents, setAgents] = useState<AgentId[]>([...AGENT_ORDER]);
  const [debateRounds, setDebateRounds] = useState(2);
  const [requireArbitration, setRequireArbitration] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAgent = (id: AgentId) => {
    setAgents((current) =>
      current.includes(id) ? current.filter((agent) => agent !== id) : [...current, id]
    );
  };

  const loadDemo = () => {
    setTopic(DEMO_TOPIC);
    setContext(DEMO_CONTEXT);
    setAgents([...AGENT_ORDER]);
    setDebateRounds(2);
    setRequireArbitration(true);
  };

  const handleSubmit = async () => {
    setError(null);

    if (topic.trim().length < 3) {
      setError('Please describe the problem the council should debate (at least 3 characters).');
      return;
    }
    if (agents.length < 2) {
      setError('Convene at least two experts.');
      return;
    }

    setBusy(true);
    try {
      const { session } = await api.createSession({
        topic: topic.trim(),
        context: context.trim() || undefined,
        agents,
        debateRounds,
        requireArbitration,
      });
      window.location.href = `/council/?id=${session.id}`;
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : caught instanceof Error ? caught.message : String(caught)
      );
      setBusy(false);
    }
  };

  return (
    <form
      className="card convene-form"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="card-head">
        <h3>⚖️ Convene the council</h3>
        <button type="button" className="btn btn-ghost btn-small" onClick={loadDemo}>
          Fill demo topic (AI meeting notes)
        </button>
      </div>

      <label className="field">
        <span>Problem to debate</span>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. Launch an AI meeting-notes SaaS with a freemium model…"
          rows={4}
          required
        />
      </label>

      <label className="field">
        <span>Additional context (optional)</span>
        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Constraints, audience, success criteria…"
          rows={2}
        />
      </label>

      <fieldset className="field">
        <span>Experts on the bench</span>
        <div className="agent-picker">
          {AGENT_ORDER.map((id) => {
            const meta = AGENT_META[id];
            const checked = agents.includes(id);
            return (
              <label
                key={id}
                className={`agent-option${checked ? ' checked' : ''}`}
                style={{ ['--agent-color' as string]: meta.color }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAgent(id)}
                />
                <span aria-hidden>{meta.emoji}</span> {meta.label}
                <small>{meta.role}</small>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="form-row">
        <label className="field">
          <span>Debate rounds</span>
          <select value={debateRounds} onChange={(event) => setDebateRounds(Number(event.target.value))}>
            <option value={1}>1 — quick pass</option>
            <option value={2}>2 — standard</option>
            <option value={3}>3 — deep</option>
            <option value={4}>4 — exhaustive</option>
          </select>
        </label>

        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={requireArbitration}
            onChange={(event) => setRequireArbitration(event.target.checked)}
          />
          <span>Pause for my arbitration between rounds (human-in-the-loop)</span>
        </label>
      </div>

      {error && <div className="alert">{error}</div>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Convening…' : 'Convene the council'}
      </button>
    </form>
  );
}
