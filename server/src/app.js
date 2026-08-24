import express from 'express'
import cors from 'cors'
import { dbReady, getDbError } from './db.js'
import reportsRouter, { statsHandler } from './routes/reports.js'
import authRouter from './routes/auth.js'

const app = express()

// CORS — allow configured origins, Vercel deployments, or all origins.
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origins.length === 0 || origins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost')) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true,
  }),
)

// Photos arrive as compressed base64 data URLs — allow a generous body size.
app.use(express.json({ limit: '15mb' }))

// Disable HTTP caching for all API endpoints so browser always fetches live data from MongoDB.
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
  next()
})

// Health — the client probes this to decide server vs. local-first mode.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: dbReady(), dbError: getDbError(), service: 'samadhansetu-api', time: new Date().toISOString() })
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
