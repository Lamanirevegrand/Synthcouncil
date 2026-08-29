import { generate } from '@genkit-ai/ai';
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

    const response = await generate({
        model: gemini15Flash,
        system: TECH_SYSTEM_PROMPT,
        prompt: promptContent,
        config: {
            temperature: 0.2, // Faible température pour maximiser la rigueur technique
        },
    });

    const rawText = response.text();

    // Tente d'extraire le bloc JSON même si le LLM l'englobe dans des balises markdown
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Tech Agent failed to produce a structured JSON response.');
    }

    const parsedJson = JSON.parse(jsonMatch[0]);

    // Validation stricte contre le contrat Zod du monorepo
    return AgentResponseSchema.parse({
        agentId: 'tech',
        confidenceScore: parsedJson.confidenceScore,
        verdict: parsedJson.verdict,
        sources: parsedJson.sources ?? [],
    });
};