import { useEffect } from 'react';
import { registerWebMCPTools } from '../lib/webmcp';

const RETRY_DELAY_MS = 400;
// ~10 s of bounded retries: covers browsers that inject document.modelContext
// a moment after the page starts, and never loops forever on non-WebMCP pages.
const MAX_ATTEMPTS = 25;

/**
 * Invisible island mounted on every page (layout). Registers the council's
 * WebMCP tools automatically as soon as the model context is available —
 * no user click required. Registration is idempotent (tools are deduped by
 * name), so retries and the panel's manual "Re-register" button are safe.
 */
export default function WebMCPRegistrar() {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const attempt = () => {
      if (cancelled) return;
      const result = registerWebMCPTools();
      if (!result.available && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        window.setTimeout(attempt, RETRY_DELAY_MS);
      }
    };

    attempt();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
