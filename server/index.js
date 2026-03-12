const express = require('express');
const http = require('http');
const cors = require('cors');

const reportRoutes = require('./routes/report');

const PORT = 4000;

const app = express();
app.use(cors());
app.use(express.json());

// ── REST Routes ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.use('/api/report', reportRoutes);

// ── Kick-off ──────────────────────────────────────────────────────────────────
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`\n🚀 Attendance server running on http://localhost:${PORT}`);
  console.log('✅ Microservice ready. PDF Generator loaded.\n');
});

