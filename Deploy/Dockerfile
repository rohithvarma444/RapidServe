FROM node:18-bullseye

WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev

COPY . .

RUN npm run build
RUN npm prune --production

CMD ["node", "dist/index.js"]
