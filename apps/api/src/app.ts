import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';

export const buildApp = (): Express => {
    const app = express();

    app.use(cors({
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    app.use(express.json({ limit: '1mb' }));

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    return app;
};