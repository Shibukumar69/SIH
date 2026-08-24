import mongoose from 'mongoose'
import { Report } from './models/Report.js'
import { buildSeedReports } from './lib/seedData.js'
import { seedDemoUsers } from './controllers/authController.js'

// Connect to MongoDB. Never throws — returns true on success, false otherwise,
// so the API can still boot and report db:false via /api/health.
export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) {
    return true
  }
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 })
    console.log('✓ MongoDB connected')
    await seedIfEmpty()
    return true
  } catch (err) {
    console.warn('⚠  MongoDB not connected:', err.message)
    console.warn('   The API will run but return 503 for data routes.')
    console.warn('   Set MONGO_URI in server/.env (local mongod or an Atlas URL).')
    return false
  }
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

