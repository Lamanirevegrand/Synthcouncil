import { Router, type Request, type Response } from 'express';

export const blackboardRouter = Router();

// Point d'entrée pour initier un débat entre les agents
blackboardRouter.post('/start', (req: Request, res: Response) => {
    // TODO: Implémentation du flux Genkit (Adversarial AI)
    res.status(202).json({
        message: 'Session started, the SynthCouncil is orchestrating.',
        status: 'orchestrating'
    });
});

// Point d'entrée pour le polling du frontend (récupération de l'état)
blackboardRouter.get('/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    // TODO: Récupération de l'état via Supabase
    res.status(200).json({
        sessionId,
        status: 'idle'
    });
});