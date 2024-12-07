FROM mcr.microsoft.com/playwright:v1.49.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Playwright report server port
EXPOSE 9323
