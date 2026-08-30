-- SynthCouncil schema (backend-only access via the service key; RLS stays off).
-- Run this against your Supabase project: Supabase Dashboard > SQL Editor.

create table if not exists public.sessions (
    id         uuid primary key default gen_random_uuid(),
    topic      text not null,
    context    text not null default '',
    status     text not null default 'created',
    config     jsonb not null default '{}'::jsonb,
    error      text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.blackboards (
    session_id uuid primary key references public.sessions (id) on delete cascade,
    data       jsonb not null,
    updated_at timestamptz not null default now()
);

create index if not exists sessions_updated_at_idx on public.sessions (updated_at desc);
