-- Run this in the Supabase SQL Editor.
-- This is a shared class-project demo list, not per-user bookmarks.
create table if not exists public.saved_companies (
  symbol text primary key,
  created_at timestamptz not null default now(),
  constraint valid_symbol check (symbol ~ '^[A-Z0-9.-]{1,12}$')
);
alter table public.saved_companies enable row level security;
-- Do not create public access policies. The server uses its private service-role key.
