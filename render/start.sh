#!/bin/sh
set -eu

export N8N_USER_FOLDER="${N8N_USER_FOLDER:-/data}"
export N8N_PORT="${PORT:-5678}"
export N8N_RUNNERS_BROKER_PORT="${N8N_RUNNERS_BROKER_PORT:-5679}"
export N8N_PROTOCOL="${N8N_PROTOCOL:-https}"
export N8N_HOST="${N8N_HOST:-0.0.0.0}"
export GENERIC_TIMEZONE="${GENERIC_TIMEZONE:-Etc/UTC}"
export TZ="${TZ:-Etc/UTC}"
export NODE_FUNCTION_ALLOW_BUILTIN="${NODE_FUNCTION_ALLOW_BUILTIN:-fs,path,crypto}"

mkdir -p "$N8N_USER_FOLDER/.n8n" /data/ai-music-output

if [ ! -f "$N8N_USER_FOLDER/.n8n/.scheduled-ai-music-imported" ]; then
  echo "Importing Scheduled AI Music Package Generator workflow..."
  n8n import:workflow --input /opt/scheduled-ai-music/workflow.json
  touch "$N8N_USER_FOLDER/.n8n/.scheduled-ai-music-imported"
fi

exec n8n start
