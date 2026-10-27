FROM node:24-slim
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install
COPY apps/web apps/web
WORKDIR /repo/apps/web
ENV API_URL=http://api:8000
CMD ["pnpm", "dev"]
