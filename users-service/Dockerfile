<<<<<<< HEAD
FROM node:18

RUN apt-get update && \
    apt-get install -y iputils-ping && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
=======
FROM node:20

WORKDIR /app

COPY package*.json ./
>>>>>>> origin/brenda
RUN npm install

COPY . .

<<<<<<< HEAD
EXPOSE 3001
CMD ["npm", "start"]
=======
RUN npx prisma generate

# Script de inicialização que executa migrations
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
>>>>>>> origin/brenda
