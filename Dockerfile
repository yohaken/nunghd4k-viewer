FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY server.js movies.json ./
COPY public/ ./public/
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
