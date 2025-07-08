# Stage 1: Build stage
FROM node:23.4.0-alpine3.20 as builder

WORKDIR /app

# 환경 변수 파일 복사 (빌드 오류 해결용)
#COPY .env* ./

COPY package*.json ./
RUN npm ci

COPY . .
COPY .env.production .env
RUN npm run build

# Stage 2: Production stage
FROM node:23.4.0-alpine3.20 as runner

RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# 빌드된 애플리케이션만 복사
COPY --from=builder /app/build ./build

# 환경 변수 파일도 복사 (런타임에 필요할 경우)
#COPY --from=builder /app/.env* ./

# 보안 설정
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit
RUN chown -R sveltekit:nodejs /app
USER sveltekit

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build/index.js"]