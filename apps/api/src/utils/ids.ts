import { randomUUID } from 'node:crypto';

export const createId = (prefix: string): string => `${prefix}_${randomUUID()}`;

export const newUuid = (): string => randomUUID();

export const nowIso = (): string => new Date().toISOString();
