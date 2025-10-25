FROM node:20-alpine
WORKDIR /app
COPY . .
RUN yarn add kafkajs sequelize pg pg-hstore axios jsonwebtoken dotenv
CMD ["node", "kafka-consummer.js"]