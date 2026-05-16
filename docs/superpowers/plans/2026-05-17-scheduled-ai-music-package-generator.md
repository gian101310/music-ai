# Scheduled AI Music Package Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a repo package containing an importable n8n workflow, isolated launcher, environment example, Supabase schema, and beginner-friendly setup docs for scheduled AI music package generation.

**Architecture:** Generate the workflow JSON from a small Node.js builder script so node IDs, connections, and long prompts remain maintainable. The workflow uses HTTP Request nodes for OpenAI, MusicGPT, Google Sheets, and optional Supabase, plus Code nodes for parsing, duplicate-safe filesystem writes, SRT generation, MusicGPT polling, and metadata creation.

**Tech Stack:** n8n 2.20.7, Windows batch launcher, Node.js for export generation, OpenAI Chat Completions API, OpenAI Images API, MusicGPT public API, Google Sheets API, optional Supabase REST API.

---

### Task 1: Documentation And Setup Files

**Files:**
- Create: `workflows/scheduled-ai-music-package-generator/README.md`
- Create: `workflows/scheduled-ai-music-package-generator/.env.example`
- Create: `workflows/scheduled-ai-music-package-generator/schema.sql`
- Create: `scripts/start-scheduled-ai-music-package-generator.bat`

- [ ] **Step 1: Create README**

Include workflow purpose, node-by-node beginner explanation, credential setup, Google Sheet columns, Supabase optional setup, publishing instructions, and verification steps.

- [ ] **Step 2: Create env example**

Include `N8N_PORT=5682`, `N8N_USER_FOLDER=C:\Users\Admin\.n8n-scheduled-ai-music`, `OPENAI_API_KEY`, `MUSICGPT_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 3: Create launcher**

The launcher must set an isolated n8n folder and port and must allow Code node access to `fs`, `path`, and `crypto`.

### Task 2: Workflow Generator

**Files:**
- Create: `tools/generate-scheduled-ai-music-workflow.mjs`
- Create: `workflows/scheduled-ai-music-package-generator/workflow.json`

- [ ] **Step 1: Build workflow object**

Create nodes for the requested order: Schedule Trigger, Config, metadata initialization, OpenAI music package, parser, duplicate folder builder, Google Sheets logging, local text writes, SRT generation, optional Supabase insert, cover prompt generation, image generation, MusicGPT start, polling/download, metadata, final Sheets append, and End.

- [ ] **Step 2: Generate workflow JSON**

Run `node tools/generate-scheduled-ai-music-workflow.mjs` and confirm `workflow.json` exists.

### Task 3: Verification

**Files:**
- Verify: `workflows/scheduled-ai-music-package-generator/workflow.json`

- [ ] **Step 1: JSON parse check**

Run a JSON parse command against the workflow export.

- [ ] **Step 2: n8n import smoke test**

Import the workflow into a temporary isolated n8n user folder, not the assistant folder, and confirm the import succeeds.

- [ ] **Step 3: Git status review**

Confirm only intended repo files changed.
