FROM node:18-slim

# Install Tor
RUN apt-get update && apt-get install -y tor && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

# Start Tor daemon in background and then run the app
CMD tor --runasdaemon 1 && npm start
