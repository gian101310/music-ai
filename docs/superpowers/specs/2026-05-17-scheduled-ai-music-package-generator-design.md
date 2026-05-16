# Scheduled AI Music Package Generator Design

## Goal

Build an isolated, importable n8n workflow that runs on a schedule and generates a complete AI music content package: music prompt package, lyrics, SRT, album cover prompt, album cover image, MusicGPT songs, local files, metadata, and logging.

## Isolation

The Telegram Personal Assistant on `localhost:5678` must remain untouched. The existing music instance on `localhost:5680` must also remain untouched. This package is designed for a new n8n user folder and port:

- n8n user folder: `C:\Users\Admin\.n8n-scheduled-ai-music`
- n8n port: `5682`
- output folder: `D:\AI_Music_Output`
- repo export folder: `workflows/scheduled-ai-music-package-generator`

## Workflow Architecture

The main workflow is named `Scheduled AI Music Package Generator`. It uses a Schedule Trigger, a `Config` Set node, Code nodes for validation and filesystem safety, HTTP Request nodes for OpenAI, MusicGPT, Google Sheets, and optional Supabase, and local disk writes through self-hosted n8n.

OpenAI text generation uses the Chat Completions API through HTTP Request nodes so the model is configurable and the `OPENAI_API_KEY` can come from the environment. OpenAI image generation uses the Images API and saves base64 image output as `cover.png`. MusicGPT generation starts with `POST https://api.musicgpt.com/api/public/v1/MusicAI`, then the workflow polls `GET https://api.musicgpt.com/api/public/v1/byId` by conversion ID.

## Data Flow

1. Schedule Trigger starts the run using the n8n instance timezone.
2. `Config` defines genre, singer gender, main character, model names, sheet ID, output path, duplicate behavior, and retry count.
3. `Initialize Run Metadata` creates a timestamp-safe `run_id`.
4. OpenAI generates one code block containing `TRACK NAME`, `MUSIC PROMPT`, and `LYRICS`.
5. `Parse Music Package` strips markdown fences, extracts fields, validates required content, validates MusicGPT prompt length under 1500 characters, and builds a slug.
6. `Build Safe Folder Path` checks for duplicate folders and appends `_v2`, `_v3`, etc. It creates the final package folder without overwriting existing output.
7. The workflow logs status to Google Sheets and writes `music_package.txt` and `lyrics.txt`.
8. `Generate SRT` creates a clean estimated SRT using a 180 second default duration before MusicGPT returns actual audio duration.
9. OpenAI generates a high-end album cover prompt using the provided Cover Art Director prompt and a rotated environment.
10. The workflow validates and saves `cover_prompt.txt`.
11. OpenAI generates a square album cover image and the workflow saves it as `cover.png`.
12. MusicGPT creates two song versions, if available.
13. The workflow polls both conversion IDs up to three times, downloads ready MP3 files, and writes `song_v1.mp3` and `song_v2.mp3` without overwriting existing files.
14. The workflow writes `metadata.json`.
15. The workflow appends a final Google Sheets log row.

## Google Sheets Schema

The `MusicJobs` tab should contain these columns:

`run_id`, `created_at`, `status`, `genre`, `singer_gender`, `main_character`, `track_name`, `track_slug`, `music_prompt`, `lyrics`, `srt_text`, `cover_prompt`, `musicgpt_task_id`, `conversion_id_1`, `conversion_id_2`, `cover_file_path`, `song_v1_file_path`, `song_v2_file_path`, `package_folder_path`, `error_message`

The workflow appends status rows by default. This avoids needing to discover and maintain a row number in the first version. A future version can replace the append status nodes with append-or-update behavior keyed by `run_id`.

## Optional Supabase Schema

The optional `music_assets` table stores text assets such as SRT and prompt metadata. It is only used when `use_supabase` is true and `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` exist.

## Credentials And Environment

Required:

- `OPENAI_API_KEY`
- `MUSICGPT_API_KEY`
- Google Sheets OAuth credential in n8n named `Google Sheets account`

Optional:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for local file writes from Code nodes in the isolated n8n instance:

- `NODE_FUNCTION_ALLOW_BUILTIN=fs,path,crypto`

## Error Handling

Major validation failures throw clear n8n errors. File writes never overwrite existing files; safe suffixes are added when needed. MusicGPT polling is capped by `max_retry_count`, default `3`. Partial files are not deleted. The metadata structure includes `errors`, `duplicate_status`, and final status fields.

## Publishing

Because Schedule Trigger workflows only run automatically when active, the user must import the workflow into the isolated n8n instance, configure credentials and sheet ID, save it, and activate/publish it in n8n.
