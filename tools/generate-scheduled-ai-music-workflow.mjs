import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('workflows/scheduled-ai-music-package-generator/workflow.json');
const renderOutputPath = resolve('workflows/scheduled-ai-music-package-generator/workflow.render.json');

const musicPrompt = `You are a professional AI music producer, songwriter, and viral YouTube strategist.
Your goal is to create a HIGH-QUALITY AI song package for MusicGPT.
INPUT:
Genre: {{$json.genre}}
Singer Gender: {{$json.singer_gender}}
OUTPUT REQUIREMENTS:
Return EVERYTHING inside ONE clean code block so it is easy to copy.
Inside the code block, structure it EXACTLY like this:
TRACK NAME:
(Create a highly clickable, emotional, viral-ready title that matches the song and genre)
MUSIC PROMPT:
(Write ONE clean, well-written paragraph under 1500 characters. Do NOT use bullet points or lists. The paragraph must naturally include: genre and subgenre, emotional tone, tempo (BPM range), key instruments and sounds, melody style, drum/beat feel, vocal style, song structure, and overall atmosphere. It should read like a professional music direction brief, smooth and cohesive, not fragmented. Make it detailed but concise so it maximizes MusicGPT output quality.)
LYRICS:
(Write full original lyrics that:)
- Match the genre and mood perfectly
- Have strong emotional or viral appeal
- Use simple, catchy, repeatable phrases
- Include a clear chorus (VERY IMPORTANT)
- Are structured like a real song:
[Intro]
[Verse 1]
[Pre-Chorus]
[Chorus]
[Verse 2]
[Bridge]
[Final Chorus]
- IMPORTANT: Final output must contain ONLY the lyrics text itself with NO section labels, NO brackets, and NO extra formatting--just clean, continuous lyrics.
STYLE RULES:
- Avoid generic lyrics
- Make it feel modern and viral (TikTok/YouTube style)
- Focus on strong emotions (nostalgia, pain, motivation, mystery, etc.)
- Keep it natural and not robotic
IMPORTANT:
- Everything must be optimized for viral AI music content
- The track name MUST be attention-grabbing and clickable
- The music prompt MUST be detailed enough for high-quality generation while staying under 1500 characters
- The lyrics MUST feel like a real song people would replay
REMEMBER:
Return everything inside ONE code block only.
Do NOT add any extra text outside the code block`;

const coverPrompt = `You are a professional album cover art director and AI image prompt engineer.
Your goal is to create a HIGH-END text-to-image prompt for a music cover based on the song created by Music Creation Prompt
IMPORTANT:
- Analyze the previously generated TRACK NAME, MUSIC PROMPT, and LYRICS
- Match the EXACT emotion, genre, and vibe of the song
- The final result must feel like a real, professional music cover (not generic AI art)
INPUT:
Main Character: {{$json.main_character}}
Rotated Environment: {{$json.cover_environment}}
Track Name: {{$json.track_name}}
Music Prompt: {{$json.music_prompt}}
Lyrics: {{$json.lyrics}}
OUTPUT REQUIREMENTS:
Return EVERYTHING inside ONE clean code block.
Inside the code block, write ONE highly detailed text-to-image prompt (no explanations).
PROMPT RULES:
- The cover must include ONE main character (male masculine early 20's) as the focal point
- The character must visually reflect the emotion of the song (e.g. sad, lost, powerful, mysterious, etc.)
- Match the GENRE visually (example: dark phonk alt r&B = city, cinematic sad = rainy/night/emotional, etc.)
- Use cinematic lighting (neon glow, soft light, shadows, fog, etc.)
- Include strong atmosphere using the rotated environment
- Composition must be clean and intentionally offset: place the character slightly to the left or right side of the frame, leaving clear empty space on the opposite side for potential lyrics placement
- Style must be ultra high quality, realistic or stylized cinematic (NOT cartoon unless genre fits)
- Add depth of field, lens effects, and professional photography feel
- Keep it SIMPLE but powerful (not cluttered)
VISUAL QUALITY REQUIREMENTS:
- 4K quality
- ultra detailed
- sharp focus
- high contrast
- professional album cover style
OPTIONAL:
- You may subtly include symbolic elements that match the lyrics theme
IMPORTANT:
- Do NOT include any text on the image
- Do NOT explain anything
- Output ONLY the final image prompt inside the code block`;

function node(id, name, type, typeVersion, position, parameters = {}, extra = {}) {
  return { id, name, type, typeVersion, position, parameters, ...extra };
}

function code(id, name, position, jsCode) {
  return node(id, name, 'n8n-nodes-base.code', 2, position, {
    mode: 'runOnceForAllItems',
    jsCode,
  });
}

function http(id, name, position, parameters, extra = {}) {
  return node(id, name, 'n8n-nodes-base.httpRequest', 4.4, position, parameters, extra);
}

function sheetsAppendBody(statusExpression) {
  return `={{ JSON.stringify({ values: [[
    $json.run_id || '',
    $json.created_at || '',
    ${statusExpression},
    $json.genre || '',
    $json.singer_gender || '',
    $json.main_character || '',
    $json.track_name || '',
    $json.track_slug || '',
    $json.music_prompt || '',
    $json.lyrics || '',
    $json.srt_text || '',
    $json.cover_prompt || '',
    $json.musicgpt_task_id || '',
    $json.conversion_id_1 || '',
    $json.conversion_id_2 || '',
    $json.cover_file_path || '',
    ($json.audio_files && $json.audio_files[0]) || '',
    ($json.audio_files && $json.audio_files[1]) || '',
    $json.package_folder_path || '',
    ($json.errors && $json.errors.join('; ')) || ''
  ]] }) }}`;
}

const workflow = {
  id: 'scheduled-ai-music-package-generator',
  name: 'Scheduled AI Music Package Generator',
  nodes: [
    node('schedule', 'Schedule Trigger - Daily', 'n8n-nodes-base.scheduleTrigger', 1.2, [0, 300], {
      rule: { interval: [{ field: 'days', triggerAtHour: 9 }] },
    }),
    node('config', 'Config', 'n8n-nodes-base.set', 3.4, [240, 300], {
      assignments: {
        assignments: [
          { id: 'genre', name: 'genre', value: 'brazilian dark phonk alt r&B', type: 'string' },
          { id: 'singer_gender', name: 'singer_gender', value: 'male', type: 'string' },
          { id: 'main_character', name: 'main_character', value: 'mysterious young male artist', type: 'string' },
          { id: 'output_base_path', name: 'output_base_path', value: 'D:\\AI_Music_Output', type: 'string' },
          { id: 'google_sheet_id', name: 'google_sheet_id', value: 'REPLACE_WITH_GOOGLE_SHEET_ID', type: 'string' },
          { id: 'google_sheet_tab', name: 'google_sheet_tab', value: 'MusicJobs', type: 'string' },
          { id: 'use_supabase', name: 'use_supabase', value: false, type: 'boolean' },
          { id: 'musicgpt_output_length', name: 'musicgpt_output_length', value: 180, type: 'number' },
          { id: 'openai_text_model', name: 'openai_text_model', value: 'gpt-4.1-mini', type: 'string' },
          { id: 'openai_image_model', name: 'openai_image_model', value: 'gpt-image-1', type: 'string' },
          { id: 'duplicate_strategy', name: 'duplicate_strategy', value: 'append_version_suffix', type: 'string' },
          { id: 'max_retry_count', name: 'max_retry_count', value: 3, type: 'number' },
          { id: 'musicgpt_api_key', name: 'musicgpt_api_key', value: '={{ $env.MUSICGPT_API_KEY }}', type: 'string' },
          { id: 'supabase_url', name: 'supabase_url', value: '={{ $env.SUPABASE_URL }}', type: 'string' },
          { id: 'supabase_service_role_key', name: 'supabase_service_role_key', value: '={{ $env.SUPABASE_SERVICE_ROLE_KEY }}', type: 'string' },
        ],
      },
      options: {},
    }),
    code('init', 'Initialize Run Metadata', [500, 300], `
const crypto = require('crypto');
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, '-');
const shortId = crypto.randomBytes(4).toString('hex');
return items.map(item => ({
  json: {
    ...item.json,
    run_id: stamp + '_' + shortId,
    created_at: now.toISOString(),
    status: 'started',
    errors: []
  }
}));
`),
    code('musicBody', 'Prepare OpenAI Music Package Request', [760, 300], `
return items.map(item => {
  const body = {
    model: item.json.openai_text_model,
    messages: [
      { role: 'system', content: 'You return exactly what the user asks for. No commentary outside the requested code block.' },
      { role: 'user', content: \`${musicPrompt}\` }
    ],
    temperature: 0.9
  };
  return { json: { ...item.json, openai_music_body: body } };
});
`),
    http('openAiMusic', 'OpenAI - Generate Music Package', [1020, 300], {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'Authorization', value: '={{ "Bearer " + $env.OPENAI_API_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
      ] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.openai_music_body) }}',
      options: { timeout: 60000 },
    }),
    code('parseMusic', 'Parse Music Package', [1280, 300], `
function stripFence(text) {
  return String(text || '').trim().replace(/^\\\`\\\`\\\`[a-zA-Z0-9_-]*\\s*/i, '').replace(/\\s*\\\`\\\`\\\`$/i, '').trim();
}
function slugify(value) {
  return String(value || 'untitled')
    .normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 80) || 'untitled';
}
return items.map(item => {
  const content = item.json.choices?.[0]?.message?.content || item.json.output_text || '';
  const full = stripFence(content);
  const match = full.match(/TRACK NAME:\\s*([\\s\\S]*?)\\n\\s*MUSIC PROMPT:\\s*([\\s\\S]*?)\\n\\s*LYRICS:\\s*([\\s\\S]*)$/i);
  if (!match) throw new Error('Parse Music Package failed: expected TRACK NAME, MUSIC PROMPT, and LYRICS sections.');
  const track_name = match[1].trim();
  const music_prompt = match[2].trim();
  const lyrics = match[3].trim();
  if (!track_name) throw new Error('Parse Music Package failed: track_name is empty.');
  if (!music_prompt) throw new Error('Parse Music Package failed: music_prompt is empty.');
  if (!lyrics) throw new Error('Parse Music Package failed: lyrics is empty.');
  if (music_prompt.length > 1500) throw new Error('Parse Music Package failed: music_prompt exceeds 1500 characters.');
  const previous = $('Prepare OpenAI Music Package Request').first().json;
  return { json: { ...previous, track_name, track_slug: slugify(track_name), music_prompt, lyrics, full_music_package_text: full, status: 'prompt_generated' } };
});
`),
    code('folder', 'Build Safe Folder Path', [1540, 300], `
const fs = require('fs');
const path = require('path');
function safeFolder(basePath, datePart, runId, slug) {
  const root = path.resolve(basePath);
  const baseName = datePart + '_' + runId + '_' + slug;
  let candidate = path.join(root, baseName);
  let version = 1;
  while (fs.existsSync(candidate)) {
    version += 1;
    candidate = path.join(root, baseName + '_v' + version);
  }
  fs.mkdirSync(candidate, { recursive: true });
  return { folder: candidate, duplicate_status: version === 1 ? 'unique' : 'folder_version_v' + version };
}
return items.map(item => {
  const datePart = new Date(item.json.created_at).toISOString().slice(0, 10);
  const result = safeFolder(item.json.output_base_path, datePart, item.json.run_id, item.json.track_slug);
  return { json: { ...item.json, package_folder_path: result.folder, duplicate_status: result.duplicate_status } };
});
`),
    http('sheetsInitial', 'Google Sheets - Append Initial Row', [1800, 300], {
      method: 'POST',
      url: '={{ "https://sheets.googleapis.com/v4/spreadsheets/" + $json.google_sheet_id + "/values/" + encodeURIComponent($json.google_sheet_tab + "!A:T") + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS" }}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: sheetsAppendBody("'prompt_generated'"),
      options: { response: { response: { neverError: true } } },
    }, { credentials: { googleSheetsOAuth2Api: { id: 'PLACEHOLDER', name: 'Google Sheets account' } } }),
    code('saveText', 'Save music_package.txt and lyrics.txt', [2060, 300], `
const fs = require('fs');
const path = require('path');
function safeWrite(folder, fileName, content) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  let index = 1;
  while (fs.existsSync(target)) {
    index += 1;
    target = path.join(folder, stem + '_v' + index + ext);
  }
  fs.writeFileSync(target, content, 'utf8');
  return target;
}
return items.map(item => {
  const previous = $('Build Safe Folder Path').first().json;
  const music_package_file = safeWrite(previous.package_folder_path, 'music_package.txt', previous.full_music_package_text);
  const lyrics_file = safeWrite(previous.package_folder_path, 'lyrics.txt', previous.lyrics);
  return { json: { ...previous, music_package_file, lyrics_file } };
});
`),
    code('srt', 'Generate SRT', [2320, 300], `
function cleanLine(line) {
  return String(line || '')
    .replace(/^\\s*\\[[^\\]]+\\]\\s*$/g, '')
    .replace(/^\\s*(intro|verse\\s*\\d*|pre-chorus|chorus|bridge|final chorus)\\s*:?\\s*$/i, '')
    .trim();
}
function fmt(seconds) {
  const ms = Math.max(0, Math.floor((seconds % 1) * 1000));
  const total = Math.floor(seconds);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h + ':' + m + ':' + s + ',' + String(ms).padStart(3, '0');
}
return items.map(item => {
  const duration = Number(item.json.musicgpt_output_length || 180);
  const lines = item.json.lyrics.split(/\\r?\\n/).map(cleanLine).filter(Boolean);
  if (!lines.length) throw new Error('Generate SRT failed: no clean lyric lines found.');
  const perLine = Math.max(1.8, duration / lines.length);
  const srt = lines.map((line, idx) => {
    const start = idx * perLine;
    const end = Math.min(duration, start + perLine * 0.92);
    return [String(idx + 1), fmt(start) + ' --> ' + fmt(end), line].join('\\n');
  }).join('\\n\\n') + '\\n';
  return { json: { ...item.json, srt_text: srt, status: 'srt_created' } };
});
`),
    code('saveSrt', 'Save lyrics.srt', [2580, 300], `
const fs = require('fs');
const path = require('path');
function safeWrite(folder, fileName, content) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  let index = 1;
  while (fs.existsSync(target)) {
    index += 1;
    target = path.join(folder, stem + '_v' + index + ext);
  }
  fs.writeFileSync(target, content, 'utf8');
  return target;
}
return items.map(item => ({ json: { ...item.json, srt_file: safeWrite(item.json.package_folder_path, 'lyrics.srt', item.json.srt_text) } }));
`),
    http('sheetsSrt', 'Google Sheets - Append SRT Status', [2840, 300], {
      method: 'POST',
      url: '={{ "https://sheets.googleapis.com/v4/spreadsheets/" + $json.google_sheet_id + "/values/" + encodeURIComponent($json.google_sheet_tab + "!A:T") + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS" }}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: sheetsAppendBody("'srt_created'"),
      options: { response: { response: { neverError: true } } },
    }, { credentials: { googleSheetsOAuth2Api: { id: 'PLACEHOLDER', name: 'Google Sheets account' } } }),
    code('supabaseSrt', 'Optional Supabase - Insert SRT Asset', [3100, 300], `
return await Promise.all(items.map(async item => {
  const data = item.json;
  if (!data.use_supabase) return { json: data };
  if (!data.supabase_url || !data.supabase_service_role_key) {
    return { json: { ...data, errors: [...(data.errors || []), 'Supabase enabled but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.'] } };
  }
  const response = await fetch(data.supabase_url.replace(/\\/$/, '') + '/rest/v1/music_assets', {
    method: 'POST',
    headers: {
      apikey: data.supabase_service_role_key,
      Authorization: 'Bearer ' + data.supabase_service_role_key,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      run_id: data.run_id,
      track_name: data.track_name,
      asset_type: 'lyrics_srt',
      content_text: data.srt_text,
      file_path: data.srt_file
    })
  });
  if (!response.ok) {
    return { json: { ...data, errors: [...(data.errors || []), 'Supabase SRT insert failed: HTTP ' + response.status] } };
  }
  return { json: data };
}));
`),
    code('coverBody', 'Prepare OpenAI Cover Prompt Request', [3360, 300], `
const environments = [
  'rainy neon favela street at night',
  'foggy underground club exterior',
  'empty coastal highway at blue hour',
  'abandoned rooftop above Sao Paulo',
  'dark studio with red and blue neon haze'
];
return items.map(item => {
  const runIdText = String(item.json.run_id || Date.now());
  const idx = Math.abs([...runIdText].reduce((a, c) => a + c.charCodeAt(0), 0)) % environments.length;
  const withEnv = { ...item.json, cover_environment: environments[idx] };
  const body = {
    model: item.json.openai_text_model,
    messages: [
      { role: 'system', content: 'You are a precise album cover prompt engineer. Return one code block only.' },
      { role: 'user', content: \`${coverPrompt}\` }
    ],
    temperature: 0.85
  };
  return { json: { ...withEnv, openai_cover_body: body } };
});
`),
    http('openAiCover', 'OpenAI - Generate Cover Prompt', [3620, 300], {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'Authorization', value: '={{ "Bearer " + $env.OPENAI_API_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
      ] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.openai_cover_body) }}',
      options: { timeout: 60000 },
    }),
    code('parseCover', 'Parse Cover Prompt', [3880, 300], `
function stripFence(text) {
  return String(text || '').trim().replace(/^\\\`\\\`\\\`[a-zA-Z0-9_-]*\\s*/i, '').replace(/\\s*\\\`\\\`\\\`$/i, '').trim();
}
const forbidden = /\\b(add|include|show|write|display|place)\\s+(visible\\s+)?(text|words|letters|title|logo|typography)\\b/i;
return items.map(item => {
  const previous = $('Prepare OpenAI Cover Prompt Request').first().json;
  const content = item.json.choices?.[0]?.message?.content || item.json.output_text || '';
  const cover_prompt = stripFence(content);
  if (!cover_prompt) throw new Error('Parse Cover Prompt failed: cover prompt is empty.');
  if (forbidden.test(cover_prompt)) throw new Error('Parse Cover Prompt failed: prompt appears to request visible text.');
  return { json: { ...previous, cover_prompt, status: 'cover_prompt_generated' } };
});
`),
    code('saveCoverPrompt', 'Save cover_prompt.txt', [4140, 300], `
const fs = require('fs');
const path = require('path');
function safeWrite(folder, fileName, content) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  let index = 1;
  while (fs.existsSync(target)) {
    index += 1;
    target = path.join(folder, stem + '_v' + index + ext);
  }
  fs.writeFileSync(target, content, 'utf8');
  return target;
}
return items.map(item => ({ json: { ...item.json, cover_prompt_file: safeWrite(item.json.package_folder_path, 'cover_prompt.txt', item.json.cover_prompt) } }));
`),
    code('imageBody', 'Prepare OpenAI Image Request', [4400, 300], `
return items.map(item => {
  const body = {
    model: item.json.openai_image_model,
    prompt: item.json.cover_prompt + '\\n\\nSquare 1:1 professional album cover, no text, no typography, no logo.',
    size: '1024x1024',
    quality: 'high',
    n: 1
  };
  return { json: { ...item.json, openai_image_body: body } };
});
`),
    http('openAiImage', 'OpenAI Image - Generate Cover Image', [4660, 300], {
      method: 'POST',
      url: 'https://api.openai.com/v1/images/generations',
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'Authorization', value: '={{ "Bearer " + $env.OPENAI_API_KEY }}' },
        { name: 'Content-Type', value: 'application/json' },
      ] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.openai_image_body) }}',
      options: { timeout: 120000 },
    }),
    code('saveImage', 'Save Cover Image', [4920, 300], `
const fs = require('fs');
const path = require('path');
function safeBinary(folder, fileName, buffer) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  let index = 1;
  while (fs.existsSync(target)) {
    index += 1;
    target = path.join(folder, stem + '_v' + index + ext);
  }
  fs.writeFileSync(target, buffer);
  return target;
}
return items.map(item => {
  const previous = $('Prepare OpenAI Image Request').first().json;
  const b64 = item.json.data?.[0]?.b64_json;
  if (!b64) throw new Error('Save Cover Image failed: OpenAI image response did not include b64_json.');
  const cover_file_path = safeBinary(previous.package_folder_path, 'cover.png', Buffer.from(b64, 'base64'));
  return { json: { ...previous, cover_file_path, status: 'cover_image_created' } };
});
`),
    http('musicgptStart', 'MusicGPT - Start Music Generation', [5180, 300], {
      method: 'POST',
      url: 'https://api.musicgpt.com/api/public/v1/MusicAI',
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'Authorization', value: '={{ $json.musicgpt_api_key }}' },
        { name: 'Content-Type', value: 'application/json' },
      ] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ prompt: $json.music_prompt, music_style: $json.genre, lyrics: $json.lyrics, make_instrumental: false, vocal_only: false, gender: $json.singer_gender, output_length: $json.musicgpt_output_length }) }}',
      options: { timeout: 180000 },
    }),
    code('musicgptIds', 'Store MusicGPT IDs', [5440, 300], `
return items.map(item => {
  const previous = $('Save Cover Image').first().json;
  if (!item.json.success && !item.json.task_id) throw new Error('MusicGPT start failed: missing success/task_id in response.');
  return { json: {
    ...previous,
    musicgpt_task_id: item.json.task_id || '',
    conversion_id_1: item.json.conversion_id_1 || '',
    conversion_id_2: item.json.conversion_id_2 || '',
    musicgpt_eta: item.json.eta || null,
    status: 'music_generation_started'
  } };
});
`),
    http('sheetsMusicGpt', 'Google Sheets - Append MusicGPT IDs', [5700, 300], {
      method: 'POST',
      url: '={{ "https://sheets.googleapis.com/v4/spreadsheets/" + $json.google_sheet_id + "/values/" + encodeURIComponent($json.google_sheet_tab + "!A:T") + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS" }}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: sheetsAppendBody("'music_generation_started'"),
      options: { response: { response: { neverError: true } } },
    }, { credentials: { googleSheetsOAuth2Api: { id: 'PLACEHOLDER', name: 'Google Sheets account' } } }),
    code('pollDownload', 'Poll MusicGPT and Download MP3s', [5960, 300], `
const fs = require('fs');
const path = require('path');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function safeBinary(folder, fileName, buffer) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  let index = 1;
  while (fs.existsSync(target)) {
    index += 1;
    target = path.join(folder, stem + '_v' + index + ext);
  }
  fs.writeFileSync(target, buffer);
  return target;
}
async function pollConversion(data, conversionId, version) {
  if (!conversionId) return null;
  const max = Number(data.max_retry_count || 3);
  let lastStatus = 'UNKNOWN';
  for (let attempt = 1; attempt <= max; attempt++) {
    if (attempt > 1) await sleep(60000);
    const url = 'https://api.musicgpt.com/api/public/v1/byId?conversionType=MUSIC_AI&conversion_id=' + encodeURIComponent(conversionId);
    const response = await fetch(url, { headers: { Authorization: data.musicgpt_api_key } });
    if (!response.ok) {
      lastStatus = 'HTTP ' + response.status;
      continue;
    }
    const result = await response.json();
    const conversion = result.conversion || result.data || result;
    lastStatus = conversion.status || result.status || 'UNKNOWN';
    const audioUrl = conversion.audio_url || conversion.conversion_path || conversion.conversion_url;
    if (audioUrl && String(lastStatus).toUpperCase() === 'COMPLETED') {
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) throw new Error('MusicGPT audio download failed for version ' + version + ': HTTP ' + audioResponse.status);
      const buffer = Buffer.from(await audioResponse.arrayBuffer());
      return safeBinary(data.package_folder_path, 'song_v' + version + '.mp3', buffer);
    }
  }
  return { timeout: true, status: lastStatus };
}
return await Promise.all(items.map(async item => {
  const data = $('Store MusicGPT IDs').first().json;
  const audio_files = [];
  const errors = [...(data.errors || [])];
  const v1 = await pollConversion(data, data.conversion_id_1, 1);
  const v2 = await pollConversion(data, data.conversion_id_2, 2);
  for (const result of [v1, v2]) {
    if (!result) continue;
    if (typeof result === 'string') audio_files.push(result);
    else if (result.timeout) errors.push('MusicGPT polling timed out with status: ' + result.status);
  }
  const status = audio_files.length ? 'music_downloaded' : 'music_timeout';
  return { json: { ...data, audio_files, errors, status } };
}));
`),
    code('metadata', 'Create metadata.json', [6220, 300], `
return items.map(item => {
  const data = item.json;
  const metadata = {
    run_id: data.run_id,
    created_at: data.created_at,
    genre: data.genre,
    singer_gender: data.singer_gender,
    main_character: data.main_character,
    track_name: data.track_name,
    track_slug: data.track_slug,
    music_prompt: data.music_prompt,
    lyrics: data.lyrics,
    cover_prompt: data.cover_prompt,
    musicgpt_task_id: data.musicgpt_task_id,
    conversion_id_1: data.conversion_id_1,
    conversion_id_2: data.conversion_id_2,
    audio_files: data.audio_files || [],
    cover_file: data.cover_file_path || '',
    srt_file: data.srt_file || '',
    local_folder: data.package_folder_path,
    duplicate_status: data.duplicate_status,
    status: (data.audio_files || []).length ? 'package_completed' : data.status,
    errors: data.errors || []
  };
  return { json: { ...data, metadata, metadata_text: JSON.stringify(metadata, null, 2), status: metadata.status } };
});
`),
    code('saveMetadata', 'Save metadata.json', [6480, 300], `
const fs = require('fs');
const path = require('path');
function safeWrite(folder, fileName, content) {
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  let index = 1;
  while (fs.existsSync(target)) {
    index += 1;
    target = path.join(folder, stem + '_v' + index + ext);
  }
  fs.writeFileSync(target, content, 'utf8');
  return target;
}
return items.map(item => ({ json: { ...item.json, metadata_file: safeWrite(item.json.package_folder_path, 'metadata.json', item.json.metadata_text) } }));
`),
    http('sheetsFinal', 'Google Sheets - Final Update', [6740, 300], {
      method: 'POST',
      url: '={{ "https://sheets.googleapis.com/v4/spreadsheets/" + $json.google_sheet_id + "/values/" + encodeURIComponent($json.google_sheet_tab + "!A:T") + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS" }}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: sheetsAppendBody("$json.status || 'package_completed'"),
      options: { response: { response: { neverError: true } } },
    }, { credentials: { googleSheetsOAuth2Api: { id: 'PLACEHOLDER', name: 'Google Sheets account' } } }),
    node('end', 'End', 'n8n-nodes-base.noOp', 1, [7000, 300], {}),
  ],
  connections: {
    'Schedule Trigger - Daily': { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
    Config: { main: [[{ node: 'Initialize Run Metadata', type: 'main', index: 0 }]] },
    'Initialize Run Metadata': { main: [[{ node: 'Prepare OpenAI Music Package Request', type: 'main', index: 0 }]] },
    'Prepare OpenAI Music Package Request': { main: [[{ node: 'OpenAI - Generate Music Package', type: 'main', index: 0 }]] },
    'OpenAI - Generate Music Package': { main: [[{ node: 'Parse Music Package', type: 'main', index: 0 }]] },
    'Parse Music Package': { main: [[{ node: 'Build Safe Folder Path', type: 'main', index: 0 }]] },
    'Build Safe Folder Path': { main: [[{ node: 'Google Sheets - Append Initial Row', type: 'main', index: 0 }]] },
    'Google Sheets - Append Initial Row': { main: [[{ node: 'Save music_package.txt and lyrics.txt', type: 'main', index: 0 }]] },
    'Save music_package.txt and lyrics.txt': { main: [[{ node: 'Generate SRT', type: 'main', index: 0 }]] },
    'Generate SRT': { main: [[{ node: 'Save lyrics.srt', type: 'main', index: 0 }]] },
    'Save lyrics.srt': { main: [[{ node: 'Google Sheets - Append SRT Status', type: 'main', index: 0 }]] },
    'Google Sheets - Append SRT Status': { main: [[{ node: 'Optional Supabase - Insert SRT Asset', type: 'main', index: 0 }]] },
    'Optional Supabase - Insert SRT Asset': { main: [[{ node: 'Prepare OpenAI Cover Prompt Request', type: 'main', index: 0 }]] },
    'Prepare OpenAI Cover Prompt Request': { main: [[{ node: 'OpenAI - Generate Cover Prompt', type: 'main', index: 0 }]] },
    'OpenAI - Generate Cover Prompt': { main: [[{ node: 'Parse Cover Prompt', type: 'main', index: 0 }]] },
    'Parse Cover Prompt': { main: [[{ node: 'Save cover_prompt.txt', type: 'main', index: 0 }]] },
    'Save cover_prompt.txt': { main: [[{ node: 'Prepare OpenAI Image Request', type: 'main', index: 0 }]] },
    'Prepare OpenAI Image Request': { main: [[{ node: 'OpenAI Image - Generate Cover Image', type: 'main', index: 0 }]] },
    'OpenAI Image - Generate Cover Image': { main: [[{ node: 'Save Cover Image', type: 'main', index: 0 }]] },
    'Save Cover Image': { main: [[{ node: 'MusicGPT - Start Music Generation', type: 'main', index: 0 }]] },
    'MusicGPT - Start Music Generation': { main: [[{ node: 'Store MusicGPT IDs', type: 'main', index: 0 }]] },
    'Store MusicGPT IDs': { main: [[{ node: 'Google Sheets - Append MusicGPT IDs', type: 'main', index: 0 }]] },
    'Google Sheets - Append MusicGPT IDs': { main: [[{ node: 'Poll MusicGPT and Download MP3s', type: 'main', index: 0 }]] },
    'Poll MusicGPT and Download MP3s': { main: [[{ node: 'Create metadata.json', type: 'main', index: 0 }]] },
    'Create metadata.json': { main: [[{ node: 'Save metadata.json', type: 'main', index: 0 }]] },
    'Save metadata.json': { main: [[{ node: 'Google Sheets - Final Update', type: 'main', index: 0 }]] },
    'Google Sheets - Final Update': { main: [[{ node: 'End', type: 'main', index: 0 }]] },
  },
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    timezone: 'Asia/Dubai',
  },
  staticData: null,
  pinData: {},
  versionId: 'scheduled-ai-music-package-generator-v1',
  triggerCount: 1,
  tags: [],
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + '\n', 'utf8');
console.log(`Generated ${outputPath}`);

const renderWorkflow = JSON.parse(JSON.stringify(workflow));
const renderConfig = renderWorkflow.nodes.find((n) => n.name === 'Config');
const outputBasePath = renderConfig.parameters.assignments.assignments.find((a) => a.name === 'output_base_path');
outputBasePath.value = '/tmp/ai-music-output';
renderWorkflow.settings.timezone = 'Etc/UTC';
writeFileSync(renderOutputPath, JSON.stringify(renderWorkflow, null, 2) + '\n', 'utf8');
console.log(`Generated ${renderOutputPath}`);
