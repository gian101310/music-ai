#!/usr/bin/env node

const { mkdirSync, existsSync, readFileSync } = require('node:fs');
const { spawnSync, spawn } = require('node:child_process');

const workflowId = 'scheduled-ai-music-package-generator';
const workflowPath = '/opt/scheduled-ai-music/workflow.json';
const exportPath = '/tmp/n8n-existing-workflows.json';

process.env.N8N_USER_FOLDER = process.env.N8N_USER_FOLDER || '/tmp/n8n-user';
process.env.N8N_PORT = process.env.PORT || process.env.N8N_PORT || '5678';
process.env.N8N_RUNNERS_BROKER_PORT = process.env.N8N_RUNNERS_BROKER_PORT || '5679';
process.env.N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'https';
process.env.N8N_HOST = process.env.N8N_HOST || '0.0.0.0';
process.env.GENERIC_TIMEZONE = process.env.GENERIC_TIMEZONE || 'Etc/UTC';
process.env.TZ = process.env.TZ || 'Etc/UTC';
process.env.NODE_FUNCTION_ALLOW_BUILTIN = process.env.NODE_FUNCTION_ALLOW_BUILTIN || 'fs,path,crypto';

if (process.env.DATABASE_URL) {
  const db = new URL(process.env.DATABASE_URL);
  process.env.DB_TYPE = 'postgresdb';
  process.env.DB_POSTGRESDB_HOST = db.hostname;
  process.env.DB_POSTGRESDB_PORT = db.port || '5432';
  process.env.DB_POSTGRESDB_DATABASE = db.pathname.replace(/^\//, '');
  process.env.DB_POSTGRESDB_USER = decodeURIComponent(db.username);
  process.env.DB_POSTGRESDB_PASSWORD = decodeURIComponent(db.password);
}

mkdirSync(`${process.env.N8N_USER_FOLDER}/.n8n`, { recursive: true });
mkdirSync('/tmp/ai-music-output', { recursive: true });

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: options.stdio || 'inherit',
    env: process.env,
    encoding: 'utf8',
  });
}

let workflowExists = false;
const exported = run('n8n', ['export:workflow', '--all', '--output', exportPath], { stdio: 'pipe' });
if (exported.status === 0 && existsSync(exportPath)) {
  try {
    const workflows = JSON.parse(readFileSync(exportPath, 'utf8'));
    workflowExists = Array.isArray(workflows) && workflows.some((workflow) => workflow.id === workflowId);
  } catch (error) {
    console.warn(`Could not inspect existing workflow export: ${error.message}`);
  }
}

if (!workflowExists) {
  console.log('Importing Scheduled AI Music Package Generator workflow...');
  const imported = run('n8n', ['import:workflow', '--input', workflowPath]);
  if (imported.status !== 0) process.exit(imported.status || 1);
} else {
  console.log('Scheduled AI Music Package Generator workflow already exists; skipping import.');
}

const child = spawn('n8n', ['start'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`n8n exited with signal ${signal}`);
    process.exit(1);
  }
  process.exit(code || 0);
});
