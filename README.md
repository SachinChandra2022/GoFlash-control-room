# ⚡ GoFlash Control Room

> High-concurrency flash sale engine — real-time observability dashboard

A production-grade React dashboard that visualises orders flowing through a distributed pipeline (Golang → Redis → Kafka → PostgreSQL) in real-time. Built to **prove** that the backend handles 5,000+ RPS bursts without overselling a single unit.

---

## 📸 Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Live Inventory  │  Total Req  │  Success  │  Conflicts      │
│     [ 042 ]      │    1,200    │   1,187   │     13          │
├──────────────────────────────────────────────────────────────┤
│  CLIENT → API → REDIS → KAFKA → WORKER → POSTGRES           │
│           ●────────●──────●──────●────●   (packets animate) │
├────────────────────────────────────┬─────────────────────────┤
│  14:32:01 → POST /purchase-async   │  [Single Purchase]      │
│  14:32:01 ✓ Published to Kafka     │  [Stress Test  50×]     │
│  14:32:01 ✗ Redis conflict (sold)  │  [Nuclear Test 100×]    │
│  14:32:02 ◈ Kafka consumer ACK'd  │  [System Reset]         │
└────────────────────────────────────┴─────────────────────────┘
```

---

## 🚀 Quick Start

```bash
# 1. Clone / extract the project
cd goflash-control-room

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit VITE_API_BASE_URL if your backend runs on a different port

# 4. Start development server (auto-proxies API calls)
npm run dev

# 5. Open http://localhost:5173
```

---

## 🛠 Project Structure

```
goflash-control-room/
├── src/
│   ├── App.jsx          # Main application — all components
│   ├── main.jsx         # React 18 entrypoint
│   └── index.css        # Tailwind directives + custom utilities
├── index.html           # Shell + JetBrains Mono font
├── tailwind.config.js   # Extended theme + custom animations
├── vite.config.js       # Dev proxy + build optimisation
├── postcss.config.js
├── package.json
├── vercel.json          # Vercel deployment config
└── .env.example
```

---

## ⚙️ Environment Variables

| Variable            | Default                    | Description                          |
|---------------------|----------------------------|--------------------------------------|
| `VITE_API_BASE_URL` | `http://localhost:8081`    | GoFlash backend base URL             |

In local dev, `vite.config.js` proxies `/stream`, `/purchase-async`, and `/reset` to the backend — so CORS pre-flight is handled at the Vite layer and never reaches the browser.

In production, set `VITE_API_BASE_URL` to your deployed backend and ensure your Golang backend sends the following CORS headers:

```go
c.Header("Access-Control-Allow-Origin",  "*")   // or specific origin
c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
c.Header("Access-Control-Allow-Headers", "Content-Type")
```

---

## 📡 SSE vs Polling — Why Server-Sent Events Win

### The Problem with Polling

A naïve stock counter would poll `GET /stock` every second:

```
Client → GET /stock  (t=0)
Client → GET /stock  (t=1)
Client → GET /stock  (t=2)   // 3 HTTP round-trips, 3 TCP handshakes
```

At 1,000 connected clients, that's **1,000 HTTP requests/second** just for the counter — *before* any purchases.

### How SSE Works Here

```
Client opens EventSource("http://localhost:8081/stream")
  └─ Single persistent TCP connection kept alive
  └─ Server pushes {"stock": 99} whenever inventory changes
  └─ Zero client-initiated requests after the initial connection
```

The backend (Gin) writes to the SSE stream whenever a Lua DECR fires:

```go
// Conceptual Gin SSE handler
func streamHandler(c *gin.Context) {
    c.Header("Content-Type", "text/event-stream")
    c.Header("Cache-Control",  "no-cache")
    c.Header("Connection",     "keep-alive")

    for stock := range stockChannel {
        c.SSEvent("message", gin.H{"stock": stock})
        c.Writer.Flush()
    }
}
```

The React `useEffect` hook opens **one** `EventSource` and auto-reconnects on drop:

```js
useEffect(() => {
  let es;
  const connect = () => {
    es = new EventSource(`${API_BASE}/stream`);
    es.onmessage = (e) => setStock(JSON.parse(e.data).stock);
    es.onerror   = () => { es.close(); setTimeout(connect, 3000); };
  };
  connect();
  return () => es?.close();
}, []);
```

**Result**: 1,000 clients = 1,000 idle TCP connections. CPU impact is negligible compared to 1,000 RPS of polling.

---

## 💣 Concurrent Request Logic — The `Promise.all` Stress Test

### Goal

Prove that the Redis atomic Lua script prevents overselling when N orders arrive simultaneously.

### Implementation

```js
const handleStressTest = async (count = 100) => {
  // Create N fetch Promises — all START simultaneously
  const requests = Array.from({ length: count }, () =>
    fetch(`${API_BASE}/purchase-async`, { method: "POST" })
      .then(res => res.status)
      .catch(() => 0)
  );

  // Promise.all awaits ALL N in parallel (not sequentially!)
  const statuses = await Promise.all(requests);

  const successes = statuses.filter(s => s === 200).length;
  const conflicts = statuses.filter(s => s === 409).length;
};
```

### Why `Promise.all` instead of a loop?

| Approach | Time for 100 requests (avg 5ms each) | Concurrency |
|----------|--------------------------------------|-------------|
| `for…await` loop | ~500ms (sequential) | 1 in-flight |
| `Promise.all`    | ~5–15ms (parallel)  | 100 in-flight |

`Promise.all` saturates the API simultaneously, creating a true concurrent burst that reveals race conditions — the exact scenario Kafka + Redis Lua was designed to survive.

### What the backend must handle

```
100 POST /purchase-async arrive at ~same millisecond
  → Gin multiplexes across goroutines (Go's M:N scheduler)
  → Each goroutine runs: EVAL decr_if_positive.lua 1 stock_key 1
  → Redis serialises Lua execution (single-threaded): only N ≤ stock get 200
  → Remainder get 409 (conflict / sold out)
  → Successful orders published to Kafka `orders` topic
  → Kafka consumer pool drains to PostgreSQL idempotently
```

**Zero oversells. Every time.**

---

## 🎨 Animation Architecture

| Animation | Trigger | Technology |
|-----------|---------|------------|
| Big Number flash | Stock changes | `framer-motion` `useAnimation` |
| Sold-out shake   | Stock hits 0  | `framer-motion` variant loop |
| Pipeline packets | Purchase/stress| `framer-motion` staggered left→right |
| Log slide-in     | New log entry | `AnimatePresence` + `motion.div` |
| Node glow pulse  | Active purchase| `motion.div` `boxShadow` keyframe |
| SSE indicator    | Connection state| `motion.div` opacity pulse |
| Button shimmer   | Loading state | `motion.div` translateX loop |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel

# Set env var in Vercel dashboard:
# VITE_API_BASE_URL = https://your-goflash-backend.com
```

`vercel.json` is pre-configured with SPA rewrites and security headers.

### Netlify

```bash
npm run build
# Drag & drop the `dist/` folder to Netlify UI
# Or: netlify deploy --prod --dir=dist
```

Create `public/_redirects`:
```
/*  /index.html  200
```

### Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 🔌 API Contract

| Endpoint             | Method | Response | Notes |
|----------------------|--------|----------|-------|
| `/stream`            | GET    | SSE stream `{"stock": number}` | Keep-alive |
| `/purchase-async`    | POST   | 200 OK / 409 Conflict | Async Kafka publish |
| `/reset`             | POST   | 200 OK | Restores inventory |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 (Vite) |
| Styling | Tailwind CSS 3 (dark slate theme) |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| Real-time | Server-Sent Events (EventSource API) |
| HTTP | Fetch API (native, no Axios dependency) |
| Fonts | JetBrains Mono (Google Fonts) |
| Backend | Golang + Gin |
| Cache | Redis (atomic Lua DECR) |
| Queue | Apache Kafka |
| Database | PostgreSQL |

---

## 🧪 Testing Concurrency

1. Ensure stock is ≥ 100 (hit **System Reset** if needed)
2. Click **Nuclear Test 100×**
3. Watch the terminal:
   - You should see exactly as many `✅ Published to Kafka` as there was available stock
   - All remaining show `❌ Redis conflict`
4. Observe the stock counter hit `000` and turn red with shake animation
5. Repeat — no oversell is possible

---

*Built with precision for the GoFlash high-concurrency flash sale engine.*