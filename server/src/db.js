import mongoose from 'mongoose'
import { Report } from './models/Report.js'
import { buildSeedReports } from './lib/seedData.js'
import { seedDemoUsers } from './controllers/authController.js'

let cachedPromise = null
let lastDbError = null
const DEFAULT_MONGO_URI = 'mongodb+srv://SIH26043:SIH26043@sih26043.almbgn9.mongodb.net/jansamadhan_db?retryWrites=true&w=majority'

// Connect to MongoDB. Never throws — returns true on success, false otherwise.
// Caches connection promise for Vercel serverless lambda reuse.
export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) {
    lastDbError = null
    return true
  }
  if (cachedPromise) {
    try {
      await cachedPromise
      if (mongoose.connection.readyState === 1) {
        lastDbError = null
        return true
      }
    } catch (err) {
      cachedPromise = null
      lastDbError = err.message
    }
  }
  const connectionUri = uri || process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_MONGO_URI
  try {
    mongoose.set('strictQuery', true)
    cachedPromise = mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 10000,
    })
    await cachedPromise
    console.log('✓ MongoDB connected')
    lastDbError = null
    await seedIfEmpty().catch(() => {})
    return true
  } catch (err) {
    cachedPromise = null
    lastDbError = err.message
    console.warn('⚠  MongoDB not connected:', err.message)
    return false
  }
}

export function getDbError() {
  return lastDbError
}

// Populate demo data on first run so every dashboard looks alive.
export async function seedIfEmpty() {
  await seedDemoUsers()
  const count = await Report.estimatedDocumentCount()
  if (count > 0) return { seeded: 0 }
  const docs = buildSeedReports(Date.now())
  await Report.insertMany(docs)
  console.log(`✓ Seeded ${docs.length} demo challenges`)
  return { seeded: docs.length }
}

export function dbReady() {
  return mongoose.connection.readyState === 1
}

