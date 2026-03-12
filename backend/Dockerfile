FROM node:20-slim

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port from .env
EXPOSE 3002

# Start app
CMD ["node", "server.js"]