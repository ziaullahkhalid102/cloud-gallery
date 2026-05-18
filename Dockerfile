FROM node:20-alpine

WORKDIR /app

# Copy client package files and build
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copy server package files and install
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server source
COPY server/src/ ./server/src/

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "src/index.js"]
