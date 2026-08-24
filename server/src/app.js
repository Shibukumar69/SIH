import express from 'express'
import cors from 'cors'
import { dbReady } from './db.js'
import reportsRouter, { statsHandler } from './routes/reports.js'
import authRouter from './routes/auth.js'

const app = express()

// CORS — allow the configured frontend origin(s), or all in dev.
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(cors({ origin: origins.length ? origins : true }))

// Photos arrive as compressed base64 data URLs — allow a generous body size.
app.use(express.json({ limit: '15mb' }))

// Health — the client probes this to decide server vs. local-first mode.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: dbReady(), service: 'samadhansetu-api', time: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/reports', reportsRouter)
app.get('/api/stats', statsHandler)

app.get('/', (_req, res) => res.json({ name: 'SamadhanSetu API', health: '/api/health' }))

// Central error handler so a thrown route never crashes the process.
app.use((err, _req, res, _next) => {
  console.error('API error:', err.message)
  res.status(500).json({ error: 'server_error' })
})

export default app
