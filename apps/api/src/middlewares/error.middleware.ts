import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    // Capture des erreurs de validation (ex: schémas de l'orchestrateur)
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors
        });
    }

    // Capture des erreurs standards
    return res.status(500).json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
};