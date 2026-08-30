import type { z } from 'zod';
import { env } from '../config/env.js';
import { withTimeout } from '../utils/timeout.js';
import { jsonFromText, normalizeSource, StructuredOutputError } from './json.js';

export interface JsonCompletionOptions<T extends z.ZodTypeAny> {
  system: string;
  user: string;
  schema: T;
  temperature?: number;
}

export interface LlmClient {
  readonly provider: string;
  readonly model: string;
  completeJson<T extends z.ZodTypeAny>(options: JsonCompletionOptions<T>): Promise<z.infer<T>>;
}

export interface ResolvedLlmConfig {
  provider: 'openrouter' | 'groq' | 'custom' | 'mock';
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

const DEFAULT_MODELS: Record<'openrouter' | 'groq', string> = {
  openrouter: 'groq/llama-3.3-70b-versatile',
  groq: 'llama-3.3-70b-versatile',
};

/**
 * Resolve which LLM backend to use.
 *
 * The hackathon requirement is "replace the default Gemini wiring with Groq /
 * OpenRouter (or anything better)". OpenRouter is the umbrella provider: it
 * serves Groq models as well as Claude, GPT and many others through one API.
 * Direct Groq, a custom OpenAI-compatible endpoint and a deterministic mock
 * (for offline demos/tests) are also supported.
 */
export function resolveLlmConfig(): ResolvedLlmConfig {
  const provider = (env.LLM_PROVIDER ??
    (env.LLM_MOCK
      ? 'mock'
      : env.OPENROUTER_API_KEY
        ? 'openrouter'
        : env.GROQ_API_KEY
          ? 'groq'
          : env.NODE_ENV !== 'production'
            ? 'mock'
            : undefined)) as ResolvedLlmConfig['provider'];

  if (!provider) {
    throw new Error(
      'No LLM provider configured. Set OPENROUTER_API_KEY (or GROQ_API_KEY / LLM_PROVIDER=custom) in the environment.'
    );
  }

  if (provider === 'mock') {
    return {
      provider: 'mock',
      baseUrl: '',
      apiKey: '',
      model: env.LLM_MODEL ?? 'synthcouncil-mock-v1',
      timeoutMs: env.LLM_TIMEOUT_MS,
    };
  }

  if (provider === 'openrouter') {
    return {
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: env.OPENROUTER_API_KEY ?? '',
      model: env.LLM_MODEL ?? DEFAULT_MODELS.openrouter,
      timeoutMs: env.LLM_TIMEOUT_MS,
    };
  }

  if (provider === 'groq') {
    return {
      provider: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: env.GROQ_API_KEY ?? '',
      model: env.LLM_MODEL ?? DEFAULT_MODELS.groq,
      timeoutMs: env.LLM_TIMEOUT_MS,
    };
  }

  // custom — any OpenAI-compatible endpoint (Ollama, vLLM, LM Studio, ...)
  if (!env.CUSTOM_LLM_BASE_URL || !env.LLM_MODEL) {
    throw new Error('LLM_PROVIDER=custom requires CUSTOM_LLM_BASE_URL and LLM_MODEL.');
  }
  return {
    provider: 'custom',
    baseUrl: env.CUSTOM_LLM_BASE_URL.replace(/\/$/, ''),
    apiKey: env.LLM_API_KEY ?? '',
    model: env.LLM_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS,
  };
}

/**
 * OpenAI-compatible chat-completions client with strict Zod output contracts.
 * Every agent step goes through `completeJson`: the response is parsed,
 * normalized and validated; on failure the model gets one chance to fix the
 * format with the validation error as feedback.
 */
export function createLlmClient(config: ResolvedLlmConfig): LlmClient {
  if (config.provider === 'mock') {
    return createMockLlmClient(config);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = env.SITE_URL ?? 'https://synthcouncil.dev';
    headers['X-Title'] = 'SynthCouncil';
  }

  return {
    provider: config.provider,
    model: config.model,

    async completeJson({ system, user, schema, temperature = 0.4 }) {
      let feedback: { original: string; error: string } | undefined;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ];
        if (feedback) {
          messages.push({
            role: 'assistant',
            content: feedback.original,
          });
          messages.push({
            role: 'user',
            content: `Your previous answer failed validation:\n${feedback.error}\nRespond again with ONLY a valid JSON object matching the required schema.`,
          });
        }

        const raw = await withTimeout(
          fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: config.model,
              messages,
              temperature,
              stream: false,
            }),
          }),
          config.timeoutMs,
          `LLM request (${config.provider}/${config.model})`
        );

        if (!raw.ok) {
          const body = await raw.text().catch(() => '');
          throw new Error(`LLM request failed (${raw.status}): ${body.slice(0, 500)}`);
        }

        const payload = (await raw.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = payload.choices?.[0]?.message?.content ?? '';
        if (!content.trim()) {
          throw new Error('LLM returned an empty completion.');
        }

        const parsed = jsonFromText(content);
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;

        feedback = {
          original: content,
          error: JSON.stringify(result.error.flatten(), null, 2).slice(0, 1500),
        };
      }

      throw new StructuredOutputError(
        `Model failed to produce a valid response matching ${schema.description ?? 'the required schema'}.`,
        undefined,
        feedback?.original
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Deterministic mock provider — lets the whole DAG run offline (dev, demos,
// tests) without any API key. Outputs are obviously synthetic.
// ---------------------------------------------------------------------------

import {
  InvestigationOutputSchema,
  PositionOutputSchema,
  QueryPlanSchema,
  VerdictOutputSchema,
} from '@synthcouncil/schemas';

function createMockLlmClient(config: ResolvedLlmConfig): LlmClient {
  return {
    provider: 'mock',
    model: config.model,

    async completeJson({ user, schema }) {
      const topic = extractTopic(user);
      const anySchema = schema as z.ZodTypeAny;

      if (anySchema === QueryPlanSchema) {
        return {
          queries: [
            `${topic} — official documentation and integration guide`,
            `${topic} — pricing, fees and platform limits`,
          ],
        };
      }

      if (anySchema === InvestigationOutputSchema) {
        return {
          summary: `[mock] Reconnaissance complete for "${topic}". Three claims were validated against synthetic evidence sources; open questions remain about jurisdiction-specific enforcement.`,
          claims: [
            {
              claim: `A stateless server architecture with webhook callbacks is the recommended integration pattern for "${topic}".`,
              evidence:
                '[mock] The Twilio-style webhook model allows asynchronous delivery with idempotent retries and no long-lived connections. Synthetic source supports this pattern.',
              sources: [{ url: 'https://docs.example.com/stateless-webhooks', title: 'Webhook best practices (example)' }],
            },
            {
              claim: `Micro-transaction volume makes per-transaction fees the dominant cost driver for "${topic}".`,
              evidence:
                '[mock] Aggregating settlements and moving fees to a per-round model reduces the effective rate. Figures are illustrative.',
              sources: [{ url: 'https://docs.example.com/payment-fees', title: 'Payment rail fee comparison (example)' }],
            },
            {
              claim: `A purely amateur, no-payout structure keeps "${topic}" clear of gambling-law requalification in most jurisdictions.`,
              evidence:
                '[mock] The line between skill-based tournament entry and illegal betting depends on prize pools and randomization; a no-cash-out model is safest.',
              sources: [{ url: 'https://docs.example.com/amateur-pool-law', title: 'Amateur pools and gambling law (example)' }],
            },
          ],
          openQuestions: ['Which payment rails are available in the target country?', 'Does the organizer hold a payment license?'],
        };
      }

      if (anySchema === PositionOutputSchema) {
        const agentLine = user.includes('TECH ARCHITECT') ? 'architecture' : user.includes('FINANCE') ? 'unit economics' : user.includes('RISK') ? 'compliance' : 'strategy';
        return {
          stance: 'concerns',
          headline: `[mock] ${agentLine} raises structured concerns`,
          argument: `[mock] Evidence supports feasibility, but three objections must be resolved before a green light: verification of official docs, fee transparency, and regulatory posture.`,
          objections: [
            { against: 'tech', point: 'Verify webhook security (signatures, replay protection) before trusting the integration.' },
            { against: 'finance', point: 'Publish the exact fee model — hidden per-transaction costs break the unit economics.' },
          ],
          supportingFindingIds: [],
          sources: [{ url: 'https://docs.example.com/verdict', title: 'Council evidence log (example)' }],
        };
      }

      if (anySchema === VerdictOutputSchema) {
        return {
          summary: `[mock] Verdict on "${topic}": proceed with a phased rollout — validate the stateless integration first, then the payment flow, with compliance review before any real-money feature ships.`,
          recommendations: [
            { title: 'Build the stateless MVP first', detail: 'Ship webhook-based orchestration with an in-memory queue before adding billing.', owner: 'tech' },
            { title: 'Route payments through the venue organizer', detail: 'Never let the platform touch the pot; integrate direct-to-organizer transfers.', owner: 'finance' },
            { title: 'Document the amateur-pool exemption', detail: 'Keep prize pools zero and publish the legal rationale per jurisdiction.', owner: 'risk' },
          ],
          risks: [
            { title: 'Payment-provider ToS changes', detail: 'A silent ToS update can block payouts overnight; keep a migration path.', severity: 'high' },
            { title: 'Requalification as betting', detail: 'Any randomized prize distribution may trigger gambling law; avoid random draws.', severity: 'high' },
          ],
          sources: [
            { url: 'https://docs.example.com/verdict', title: 'Council evidence log (example)' },
            { url: 'https://docs.example.com/amateur-pool-law', title: 'Amateur pools and gambling law (example)' },
          ],
          confidence: 62,
        };
      }

      throw new StructuredOutputError(`Mock provider does not know how to satisfy ${schema.description ?? 'this schema'}.`);
    },
  };
}

function extractTopic(user: string): string {
  const match = user.match(/PROBLEM STATEMENT\n([\s\S]*?)(?:\n[A-Z][A-Z ]+\n|$)/);
  if (match) {
    const topic = match[1].trim().split('\n')[0];
    if (topic) return topic;
  }
  const firstLine = user.split('\n').find((line) => line.trim().length > 3);
  return firstLine?.trim() ?? 'the problem';
}
