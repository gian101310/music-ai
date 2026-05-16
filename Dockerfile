FROM docker.io/n8nio/n8n:latest

USER root

RUN mkdir -p /opt/scheduled-ai-music /data/ai-music-output \
  && chown -R node:node /opt/scheduled-ai-music /data

COPY --chown=node:node workflows/scheduled-ai-music-package-generator/workflow.render.json /opt/scheduled-ai-music/workflow.json
COPY --chown=node:node render/start.sh /opt/scheduled-ai-music/start.sh

RUN chmod +x /opt/scheduled-ai-music/start.sh

USER node

CMD ["/opt/scheduled-ai-music/start.sh"]
