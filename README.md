# ⚡ Real-Time Orders Notification System

A production-ready real-time database change notification system built with **Node.js**, **TypeScript**, **PostgreSQL**, and **Socket.IO**. When records are inserted, updated, or deleted in the database, all connected clients instantly receive notifications — **without polling**.

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 📐 Architecture

```text
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL                         │
│                                                      │
│  ┌──────────┐    ┌────────────────────┐              │
│  │  orders   │───▶│ orders_change_trigger │            │
│  │  table    │    │  (AFTER INSERT/     │              │
│  └──────────┘    │   UPDATE/DELETE)    │              │
│                   └────────┬───────────┘              │
│                            │                          │
│                   ┌────────▼───────────┐              │
│                   │  pg_notify()        │              │
│                   │  'orders_channel'   │              │
│                   └────────┬───────────┘              │
└────────────────────────────┼──────────────────────────┘
                             │
                    ┌────────▼───────────┐
                    │  PostgresListener   │
                    │  (LISTEN command)   │
                    │  Exponential        │
                    │  Backoff Reconnect  │
                    └────────┬───────────┘
                             │
                    ┌────────▼───────────┐
                    │  Node.js/Express    │
                    │  Backend Server     │
                    │  (REST API + WS)    │
                    └────────┬───────────┘
                             │
                    ┌────────▼───────────┐
                    │   Socket.IO Server  │
                    │   Event: order-update│
                    └────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──┐  ┌───────▼───┐  ┌──────▼─────┐
     │  Browser   │  │  CLI       │  │  Other     │
     │  Dashboard │  │  Client    │  │  Clients   │
     └───────────┘  └───────────┘  └────────────┘
```

---

## 🤔 Why LISTEN/NOTIFY?

| Feature | Polling | LISTEN/NOTIFY |
|---------|---------|---------------|
| Latency | High (interval-based) | **Near-zero** (event-driven) |
| Database Load | High (constant queries) | **Minimal** (trigger-based) |
| Real-time | ❌ Delayed | ✅ Instant |
| Resource Usage | Wasteful | **Efficient** |
| Scalability | Poor | Good |
| Implementation | Simple but costly | Elegant |

PostgreSQL's built-in `LISTEN/NOTIFY` mechanism provides true event-driven notifications:
- **Zero polling overhead** — the database pushes changes to the listener
- **Sub-millisecond latency** — notifications fire immediately after the transaction commits
- **No external dependencies** — built into PostgreSQL, no additional message brokers needed

---

## 🚀 Quick Start

### Docker Setup (Recommended)

```bash
# Clone and start
git clone <repo-url>
cd realtime-orders-notify

# Start all services
docker compose up --build
```

Open http://localhost:3000 in your browser.

### Local Development Setup

**Prerequisites:**
- Node.js 20+
- PostgreSQL 14+

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### CLI Client

```bash
# In a separate terminal
npm run client
```

---

## 📡 API Documentation

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T10:00:00.000Z",
  "uptime": 123.456,
  "activeWebSocketClients": 2
}
```

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "customer_name": "John Doe",
  "product_name": "Laptop",
  "status": "pending"
}
```

### Get All Orders

```http
GET /api/orders
```

### Get Single Order

```http
GET /api/orders/:id
```

### Update Order

```http
PUT /api/orders/:id
Content-Type: application/json

{
  "status": "shipped"
}
```

### Delete Order

```http
DELETE /api/orders/:id
```

### Error Response Format

```json
{
  "success": false,
  "message": "Order not found"
}
```

---

## 🔌 WebSocket Documentation

### Connection

```javascript
const socket = io('http://localhost:3000');
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `welcome` | Server → Client | Sent on connection with client info |
| `order-update` | Server → Client | Database change notification |
| `disconnect` | Bidirectional | Connection closed |

### Notification Payload (INSERT/UPDATE)

```json
{
  "event": "UPDATE",
  "table": "orders",
  "recordId": 1,
  "timestamp": "2025-01-01T10:00:00Z",
  "data": {
    "id": 1,
    "customer_name": "John Doe",
    "product_name": "Laptop",
    "status": "shipped",
    "updated_at": "2025-01-01T10:00:00Z"
  }
}
```

### Notification Payload (DELETE)

```json
{
  "event": "DELETE",
  "table": "orders",
  "recordId": 1,
  "timestamp": "2025-01-01T10:00:00Z"
}
```

---

## 📸 Screenshots

> Add screenshots of the dashboard here after running the application.

---

## 🏗️ Project Structure

```text
realtime-orders-notify/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 00000000000000_init/
│           └── migration.sql          # Schema + triggers
├── public/
│   ├── index.html                     # Dashboard UI
│   ├── css/style.css                  # Styles
│   └── js/app.js                      # Client logic
├── src/
│   ├── config/
│   │   ├── env.ts                     # Environment validation
│   │   ├── database.ts                # Prisma client
│   │   └── logger.ts                  # Winston logger
│   ├── modules/
│   │   └── orders/
│   │       ├── types.ts               # TypeScript interfaces
│   │       ├── validation.ts          # Zod schemas
│   │       ├── repository.ts          # Data access
│   │       ├── service.ts             # Business logic
│   │       ├── controller.ts          # Request handlers
│   │       └── routes.ts              # Express routes
│   ├── websocket/
│   │   └── socket.ts                  # Socket.IO setup
│   ├── listeners/
│   │   └── postgres-listener.ts       # LISTEN/NOTIFY handler
│   ├── middleware/
│   │   ├── error-handler.ts           # Error middleware
│   │   └── request-logger.ts          # HTTP logging
│   ├── utils/
│   │   └── app-error.ts               # Custom error class
│   ├── app.ts                         # Express app
│   ├── server.ts                      # Server entry point
│   └── cli-client.ts                  # CLI client
├── tests/
│   ├── unit/
│   │   └── orders.service.test.ts
│   └── integration/
│       └── orders.api.test.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

---

## 📈 Scalability Discussion

### Current Architecture

```text
PostgreSQL → LISTEN/NOTIFY → Node.js → Socket.IO → Clients
```

This architecture works well for:
- Small to medium applications
- Single-server deployments
- Low to moderate throughput

**Limitations:**
- `pg_notify` payload is limited to ~8000 bytes
- Single listener connection per backend instance
- No message persistence/replay
- Horizontal scaling requires shared state

### Future Scalable Architecture

```text
PostgreSQL
    │
  Debezium CDC (Change Data Capture)
    │
  Apache Kafka (Message Broker)
    │
  Redis Pub/Sub (Real-time Distribution)
    │
  Socket.IO Cluster (with Redis Adapter)
    │
  Load Balancer
    │
  Clients
```

**Why this scales better:**

| Feature | Current | Scalable |
|---------|---------|----------|
| Message Persistence | ❌ | ✅ Kafka retains messages |
| Horizontal Scaling | Limited | ✅ Multiple consumers |
| Message Replay | ❌ | ✅ Kafka offsets |
| Payload Size | 8KB limit | ✅ Unlimited |
| Cross-Service | Single app | ✅ Microservices |
| Fault Tolerance | Basic | ✅ Full redundancy |

**Debezium CDC** captures every database change from the PostgreSQL Write-Ahead Log (WAL), providing reliable, ordered change events without triggers.

**Kafka** provides durable, ordered message streaming with exactly-once delivery guarantees.

**Redis Pub/Sub** with the Socket.IO Redis Adapter enables running multiple Socket.IO instances behind a load balancer while maintaining broadcast consistency.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 📄 License

MIT
