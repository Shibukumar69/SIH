import 'dotenv/config'
import mongoose from 'mongoose'
import { Report } from './models/Report.js'
import { buildSeedReports } from './lib/seedData.js'

// Standalone seeder: `npm run seed` — wipes and re-inserts the demo challenges.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samadhansetu'

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  const docs = buildSeedReports(Date.now())
  await Report.deleteMany({})
  await Report.insertMany(docs)
  console.log(`✓ Reseeded ${docs.length} demo challenges into ${MONGODB_URI}`)
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('✗ Seed failed:', err.message)
  console.error('  Is MongoDB running? Check MONGODB_URI in server/.env')
  process.exit(1)
})
