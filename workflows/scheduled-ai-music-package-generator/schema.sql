create table if not exists public.music_assets (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  track_name text,
  asset_type text not null,
  content_text text,
  file_path text,
  created_at timestamptz not null default now()
);

create index if not exists music_assets_run_id_idx
  on public.music_assets (run_id);

create index if not exists music_assets_asset_type_idx
  on public.music_assets (asset_type);
