import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { StructuredOutputError } from '../llm/json.js';
import { ApiError } from '../utils/errors.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Zod contract violations (malformed request bodies)
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  // Explicit API errors (404 / 409 / ...)
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Malformed JSON body (raised by express.json)
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: unknown }).status === 400) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (err instanceof StructuredOutputError) {
    console.error('[error] structured output failure:', err.message);
    return res.status(502).json({
      error: 'The model failed to produce a valid structured response',
      message: env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  console.error(`[error] ${err.name}: ${err.message}`);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
