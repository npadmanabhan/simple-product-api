FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 -G nodejs
USER nodeuser

EXPOSE 3000

CMD ["node", "src/server.js"]
