import type { AgentId } from '@synthcouncil/schemas';
import { api } from './api';

/**
 * WebMCP integration (the OpenAI WebMCP hackathon requirement).
 *
 * WebMCP lets the model driving the browser — the ChatGPT desktop browser or
 * Google Chrome 149+ with `chrome://flags/#enable-webmcp-testing` — call tools
 * that run right here in the page. SynthCouncil exposes its council as four
 * tools, so the model can convene a debate, launch the investigation, read the
 * blackboard and inject an arbitration directive, exactly like a human can in
 * the UI below.
 *
 * The canonical call required by the rules:
 *
 *   document.modelContext.registerTool({
 *     name: "...",
 *     description: "...",
 *     inputSchema: { /* ... *\/ },
 *     execute: async (input) => { /* ... *\/ }
 *   });
 *
 * It is exercised in `registerWebMCPTools()` at the bottom of this file.
 */

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface ModelContext {
  registerTool?: (tool: WebMCPTool) => void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

const toolRegistry: WebMCPTool[] = [];

export function isWebMCPAvailable(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.modelContext?.registerTool === 'function'
  );
}

export function getRegisteredTools(): ReadonlyArray<Pick<WebMCPTool, 'name' | 'description' | 'inputSchema'>> {
  return toolRegistry.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const councilCreateTool: WebMCPTool = {
  name: 'council_create',
  description:
    'Convene a new SynthCouncil session: an adversarial committee of AI experts (Tech, Finance, Risk, Strategy) that will debate a problem and gather live web evidence. Returns the session id and a URL to follow the debate.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The problem the council should debate (required).',
      },
      context: {
        type: 'string',
        description: 'Optional background constraints, audience or success criteria.',
      },
      agents: {
        type: 'array',
        items: { type: 'string', enum: ['tech', 'finance', 'risk', 'strategy'] },
        description: 'Which experts to convene (default: all four).',
      },
      debateRounds: {
        type: 'number',
        minimum: 1,
        maximum: 4,
        description: 'Number of debate rounds (default 2).',
      },
      requireArbitration: {
        type: 'boolean',
        description: 'Pause for a human arbitration directive between rounds (default true).',
      },
    },
    required: ['topic'],
  },
  async execute(input) {
    const payload = {
      topic: String(input.topic ?? ''),
      context: input.context ? String(input.context) : undefined,
      agents: Array.isArray(input.agents) ? (input.agents as AgentId[]) : undefined,
      debateRounds: typeof input.debateRounds === 'number' ? input.debateRounds : undefined,
      requireArbitration: typeof input.requireArbitration === 'boolean' ? input.requireArbitration : undefined,
    };
    const { session } = await api.createSession(payload);
    return {
      sessionId: session.id,
      topic: session.topic,
      status: session.status,
      url: `${window.location.origin}/council/?id=${session.id}`,
    };
  },
};

const councilStartTool: WebMCPTool = {
  name: 'council_start',
  description:
    'Launch the investigation for an existing SynthCouncil session. Agents start searching the live web for evidence immediately.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'The session id returned by council_create.' },
    },
    required: ['sessionId'],
  },
  async execute(input) {
    const sessionId = String(input.sessionId ?? '');
    if (!sessionId) throw new Error('sessionId is required.');
    return api.startSession(sessionId);
  },
};

const councilStatusTool: WebMCPTool = {
  name: 'council_status',
  description:
    'Read the full state of a SynthCouncil session: phase, findings from the web investigation, debate positions, human directives and the final verdict with sources.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'The session id.' },
    },
    required: ['sessionId'],
  },
  async execute(input) {
    const sessionId = String(input.sessionId ?? '');
    if (!sessionId) throw new Error('sessionId is required.');
    return api.getSession(sessionId);
  },
};

const councilDirectTool: WebMCPTool = {
  name: 'council_direct',
  description:
    'Act as the human arbiter: inject a directive into a paused SynthCouncil debate (phase "arbitrating"), optionally aimed at one agent, and resume the council. Set proceed=true to continue without a directive, or stop=true to end the debate now and deliver the verdict from the rounds completed so far (max 4 rounds).',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'The session id.' },
      directive: {
        type: 'string',
        description: 'Your instruction to the council, e.g. "Tech, verify transcription pricing at our projected volume".',
      },
      targetAgent: {
        type: 'string',
        enum: ['tech', 'finance', 'risk', 'strategy'],
        description: 'Optionally aim the directive at one agent.',
      },
      proceed: {
        type: 'boolean',
        description: 'Set true to resume without a directive.',
      },
      stop: {
        type: 'boolean',
        description: 'Set true to end the debate now and deliver the verdict (up to 4 rounds total).',
      },
    },
    required: ['sessionId'],
  },
  async execute(input) {
    const sessionId = String(input.sessionId ?? '');
    if (!sessionId) throw new Error('sessionId is required.');
    const directive = input.directive ? String(input.directive) : undefined;
    const targetAgent = input.targetAgent ? (String(input.targetAgent) as AgentId) : undefined;
    const proceed = input.proceed === true;
    const stop = input.stop === true;
    if (!directive && !proceed && !stop) {
      throw new Error('Provide a directive, or set proceed=true, or set stop=true.');
    }
    return api.arbitrate(sessionId, { directive, targetAgent, proceed, stop });
  },
};

const ALL_TOOLS: WebMCPTool[] = [councilCreateTool, councilStartTool, councilStatusTool, councilDirectTool];

/**
 * Register the council tools on the page's WebMCP context.
 * Safe to call in any browser: no-op when WebMCP is unavailable.
 */
export function registerWebMCPTools(): { available: boolean; registered: string[] } {
  const names = toolRegistry.map((tool) => tool.name);
  const fresh = ALL_TOOLS.filter((tool) => !names.includes(tool.name));

  if (!isWebMCPAvailable()) {
    return { available: false, registered: toolRegistry.map((tool) => tool.name) };
  }

  for (const tool of fresh) {
    try {
      document.modelContext?.registerTool?.(tool);
      toolRegistry.push(tool);
    } catch (error) {
      console.warn(`[webmcp] failed to register tool "${tool.name}":`, error);
    }
  }

  return { available: true, registered: toolRegistry.map((tool) => tool.name) };
}
