# Codebase Summary

## Project Overview
This is a Node.js/Express.js payment processing application designed with a microservices-oriented architecture. It orchestrates payments, subscriptions, and webhooks, integrating with external providers like **NowPayments** (crypto), **Changelly** (crypto exchange), and **Whop**.

## Key Components

### 1. API Service (`api`)
The core application handles HTTP requests, authentication, and business logic.
- **Framework:** Express.js
- **Database ORM:** Sequelize
- **Authentication:** JWT-based middleware (`middleware/auth.js`) supporting API keys.
- **Documentation:** OpenAPI/Swagger generated via `swagger-jsdoc` and exposed at `/docs`.
- **Key Routes:**
  - `/payments`, `/subscriptions`, `/sessions`: Core transaction management.
  - `/webhooks`: Handling incoming events from NowPayments, Changelly, and Whop.
  - `/users`, `/providers`: Entity management.

### 2. Jobs Service (`jobs`)
A background worker service responsible for asynchronous processing.
- **Function:** Consumes messages from Kafka topics (e.g., database changes) and processes them.
- **Webhooks:** Dispatches webhooks to external endpoints using **Svix** based on processed events.

### 3. Data Infrastructure (CDC Pipeline)
The system uses a Change Data Capture (CDC) pipeline to propagate state changes reliably.
- **PostgreSQL:** The primary relational database storing `payments`, `outbox`, and other application data.
- **Debezium:** Captures row-level changes from PostgreSQL and streams them to Kafka.
- **Kafka:** Message broker that buffers events for consumption by the `jobs` service.
- **Redis:** Used by Svix and potentially for caching/queuing.

### 4. Webhooks (Svix)
**Svix** is used as a dedicated service to manage and deliver webhooks to clients, ensuring reliability and retries.

## Database & Models
- **Schema:** The initial database setup (`postgres/init/001_init.sql`) creates `payments` and `outbox` tables.
- **Models:** The application defines many Sequelize models (e.g., `User`, `Provider`, `ChangellyOrder`, `Delivery`) in the `models/` directory.
- **Observation:** Automatic model synchronization (`sequelize.sync()`) is currently commented out in `models/index.js`, and there are no visible migration files. This suggests the database schema might need manual synchronization or relies on an external process not fully visible in the repo root.

## Technologies
- **Languages:** JavaScript (Node.js), SQL.
- **Libraries:** Express, Sequelize, KafkaJS, Svix, Argon2, JWT.
- **Infrastructure:** Docker, Docker Compose, Postgres, Kafka, Debezium, Redis.
