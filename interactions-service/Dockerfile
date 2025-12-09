FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Copiar e tornar executável o script de entrada
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3003

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
