# Scheduled AI Music Package Generator

This package contains an importable n8n workflow named `Scheduled AI Music Package Generator`. It runs on a schedule and creates a complete AI music content package: music prompt, lyrics, SRT subtitles, album cover prompt, cover image, MusicGPT MP3 files, local metadata, and Google Sheets logging.

## Isolation

Use this workflow in a separate n8n instance so it does not touch your Telegram Personal Assistant.

- Assistant instance: `http://localhost:5678`
- Existing music instance: `http://localhost:5680`
- Recommended new instance: `http://localhost:5682`
- Recommended task broker port: `5683`
- Recommended folder: `C:\Users\Admin\.n8n-scheduled-ai-music`

Start it with:

```bat
scripts\start-scheduled-ai-music-package-generator.bat
```

## Required Setup

Set these environment variables before running the isolated n8n instance:

```bat
set OPENAI_API_KEY=your_openai_key
set MUSICGPT_API_KEY=your_musicgpt_key
```

Optional Supabase:

```bat
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The launcher already sets:

```bat
set N8N_PORT=5682
set N8N_USER_FOLDER=C:\Users\Admin\.n8n-scheduled-ai-music
set N8N_RUNNERS_BROKER_PORT=5683
set NODE_FUNCTION_ALLOW_BUILTIN=fs,path,crypto
```

The `NODE_FUNCTION_ALLOW_BUILTIN` setting is required because this self-hosted workflow uses Code nodes for duplicate-safe local disk writes.

## Google Sheet

Create a Google Sheet tab named `MusicJobs` with this header row:

```text
run_id, created_at, status, genre, singer_gender, main_character, track_name, track_slug, music_prompt, lyrics, srt_text, cover_prompt, musicgpt_task_id, conversion_id_1, conversion_id_2, cover_file_path, song_v1_file_path, song_v2_file_path, package_folder_path, error_message
```

In n8n, create or connect a Google Sheets OAuth credential named `Google Sheets account`. Then edit the `Config` node and replace `google_sheet_id` with your real spreadsheet ID.

## Config Node

The `Config` Set node controls the run:

- `genre`: `brazilian dark phonk alt r&B`
- `singer_gender`: `male`
- `main_character`: `mysterious young male artist`
- `output_base_path`: `D:\AI_Music_Output`
- `google_sheet_id`: placeholder until you replace it
- `google_sheet_tab`: `MusicJobs`
- `use_supabase`: `false`
- `musicgpt_output_length`: `180`
- `openai_text_model`: `gpt-4.1-mini`
- `openai_image_model`: `gpt-image-1`
- `duplicate_strategy`: `append_version_suffix`
- `max_retry_count`: `3`

## What Each Stage Does

1. **Schedule Trigger** starts the workflow. It respects the isolated n8n instance timezone.
2. **Config** stores editable workflow settings.
3. **Initialize Run Metadata** creates a timestamp-safe `run_id`.
4. **OpenAI - Generate Music Package** sends your full professional music producer prompt to OpenAI.
5. **Parse Music Package** extracts `TRACK NAME`, `MUSIC PROMPT`, and `LYRICS`, validates them, and creates a safe track slug.
6. **Build Safe Folder Path** creates a unique package folder such as `D:\AI_Music_Output\2026-05-17_runid_track-slug`.
7. **Google Sheets - Append Initial Row** logs the first status.
8. **Save Music Package and Lyrics** writes `music_package.txt` and `lyrics.txt`.
9. **Generate SRT** creates clean subtitle timing from lyrics.
10. **Save Lyrics SRT** writes `lyrics.srt`.
11. **Optional Supabase - Insert SRT Asset** inserts SRT metadata only when enabled.
12. **OpenAI - Generate Cover Prompt** creates a high-end album cover prompt using your art director prompt and a rotated environment.
13. **Parse Cover Prompt** validates the prompt and blocks visible-text instructions.
14. **OpenAI Image - Generate Cover Image** creates square cover art.
15. **Save Cover Image** writes `cover.png`.
16. **MusicGPT - Start Music Generation** creates one or two song conversions.
17. **Poll MusicGPT and Download MP3s** polls each conversion up to three times and saves `song_v1.mp3` and `song_v2.mp3` when ready.
18. **Create metadata.json** prepares final metadata.
19. **Save metadata.json** writes final package metadata.
20. **Google Sheets - Final Update** appends the completed log row.

## Duplicate Protection

The workflow never overwrites an existing package folder or file. If the desired folder already exists, it appends `_v2`, `_v3`, and so on. If an individual file exists, it adds a safe suffix before writing.

## Publishing

After importing:

1. Open `http://localhost:5682`.
2. Import `workflow.json`.
3. Open the `Config` node and set `google_sheet_id`.
4. Check OpenAI and MusicGPT environment variables.
5. Connect Google Sheets OAuth.
6. Save the workflow.
7. Activate/publish it so the Schedule Trigger can run.

## Verification

Run the workflow manually once before activating the schedule. Confirm:

- A new folder appears under `D:\AI_Music_Output`.
- `music_package.txt`, `lyrics.txt`, `lyrics.srt`, `cover_prompt.txt`, `cover.png`, MP3 files, and `metadata.json` are present.
- Google Sheets receives at least the initial and final rows.
- No files are overwritten on a second run.

## Deploy To Render

The repo also includes a Render-ready deployment:

- [Dockerfile](</C:/Users/Admin/Documents/New project/Dockerfile>)
- [render.yaml](</C:/Users/Admin/Documents/New project/render.yaml>)
- [render/start.sh](</C:/Users/Admin/Documents/New project/render/start.sh>)
- [workflow.render.json](</C:/Users/Admin/Documents/New project/workflows/scheduled-ai-music-package-generator/workflow.render.json>)

The Render workflow uses the free-tier-compatible path:

```text
output_base_path=/tmp/ai-music-output
N8N_USER_FOLDER=/tmp/n8n-user
```

This is required because Render runs Linux containers, not Windows, so `D:\AI_Music_Output` is not available.

Recommended Render setup:

1. Push this repo to GitHub.
2. In Render, choose **New -> Blueprint**.
3. Connect the repo containing `render.yaml`.
4. Deploy the Blueprint.
5. The Blueprint creates:

```text
scheduled-ai-music-n8n      free web service
scheduled-ai-music-n8n-db   free Render Postgres database
```

6. In the Render service **Environment** tab, add secret values for:

```text
OPENAI_API_KEY
MUSICGPT_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

7. After Render gives you a URL like `https://scheduled-ai-music-n8n.onrender.com`, set:

```text
WEBHOOK_URL=https://scheduled-ai-music-n8n.onrender.com/
```

8. Redeploy after setting `WEBHOOK_URL`.
9. Open the Render URL, finish n8n owner setup, open the imported workflow, set `google_sheet_id`, connect Google Sheets OAuth, save, and run manually once.

Important Render notes:

- This free-tier setup uses Render Postgres for n8n workflow data.
- Render free web services spin down when idle, so scheduled workflows may not run reliably unless the service is awake.
- Generated cover/MP3/SRT files are written to `/tmp/ai-music-output`, which is temporary and can disappear when the service restarts.
- For production, use a paid persistent disk or add cloud storage for generated files.
- Keep local testing on `localhost:5682`; use Render as the cloud production copy.
- Do not commit `.env` files or real API keys.
