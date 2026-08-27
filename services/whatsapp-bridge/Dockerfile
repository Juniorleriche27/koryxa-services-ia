FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache ffmpeg ca-certificates git python3 make g++

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

COPY src/ ./src/

RUN mkdir -p /app/sessions && chown -R node:node /app

USER node

ENV PORT=8097
ENV NODE_ENV=production

EXPOSE 8097

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:8097/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/index.js"]
