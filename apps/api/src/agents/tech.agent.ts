import { ai } from '../config/ai.js';
import { gemini15Flash } from '@genkit-ai/googleai';
import { AgentResponseSchema, type AgentResponse } from '@synthcouncil/schemas';

const TECH_SYSTEM_PROMPT = `
You are the Lead Systems Architect in the SynthCouncil.
Your role:
- Critically evaluate technical viability, performance bottlenecks, architecture patterns, and API integrations.
- Challenge unverified assumptions with fact-grounded reasoning.
- Output MUST be strictly formatted to match the required JSON contract.
- If you rely on external documentation or web tools, include the exact URLs in the sources array.
`;

export const executeTechAgent = async (
    query: string,
    context: string[] = []
): Promise<AgentResponse> => {
    const promptContent = `
Problem Statement: ${query}

Previous Context/Discussions:
${context.length > 0 ? context.join('\n---\n') : 'No previous debate steps.'}

Analyze the technical constraints and deliver your verdict.
`;

    // Utilisation de l'instance 'ai' et intégration native de Zod
    const response = await ai.generate({
        model: gemini15Flash,
        system: TECH_SYSTEM_PROMPT,
        prompt: promptContent,
        config: {
            temperature: 0.2, // Faible température pour la rigueur technique
        },
        // Genkit force le LLM à respecter ce schéma et le parse automatiquement
        output: { schema: AgentResponseSchema }
    });

    if (!response.output) {
        throw new Error('Tech Agent failed to produce a structured response matching the schema.');
    }

    return response.output;
};