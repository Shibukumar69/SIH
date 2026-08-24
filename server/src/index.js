import 'dotenv/config'
import app from './app.js'
import { connectDB } from './db.js'

const PORT = process.env.PORT || 4000
// Accept either MONGO_URI (new .env) or MONGODB_URI (legacy) — Atlas or local.
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samadhansetu'

// Boot: connect DB (non-fatal) then always listen.
connectDB(MONGODB_URI).finally(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n🌉 SamadhanSetu API listening on http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/api/health\n`)
  })
  // A clear message beats an unhandled 'error' stack trace when the port is taken.
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⛔ Port ${PORT} is already in use — another SamadhanSetu API is still running.`)
      console.error(`   Stop that process first, or start this one on another port:  PORT=4001 npm run dev\n`)
      process.exit(1)
    }
    throw err
  })
})
