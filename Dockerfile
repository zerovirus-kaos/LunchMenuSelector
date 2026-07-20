FROM node:22-slim

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build:app

ENV NODE_ENV=production
ENV DATA_PATH=/data/lunch.json
VOLUME ["/data"]

EXPOSE 4000
CMD ["node", "server/index.js"]
