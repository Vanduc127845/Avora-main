FROM node:18-lts AS builder
WORKDIR /home/site/wwwroot
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-lts
WORKDIR /home/site/wwwroot
COPY --from=builder /home/site/wwwroot/dist ./dist
COPY --from=builder /home/site/wwwroot/package*.json ./
COPY --from=builder /home/site/wwwroot/server.js ./
RUN npm ci --omit=dev
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
