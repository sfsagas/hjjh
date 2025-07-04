FROM mcr.microsoft.com/playwright:v1.53.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 10000
CMD ["npm", "start"]


