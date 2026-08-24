import 'dotenv/config'
import mongoose from 'mongoose'
import { Report } from './models/Report.js'
import { User } from './models/User.js'
import { buildSeedReports } from './lib/seedData.js'
import { seedDemoUsers } from './controllers/authController.js'

// Standalone seeder: `npm run seed` — wipes and re-inserts demo challenges and demo users.
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samadhansetu'

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
  console.log(`✓ Connected to MongoDB for seeding: ${MONGODB_URI.replace(/:[^:@/]+@/, ':****@')}`)
  
  // Reseed demo users
  console.log('↻ Seeding demo users with bcrypt-hashed passwords...')
  await seedDemoUsers()

  // Reseed demo reports if empty or on reset
  const reportCount = await Report.countDocuments()
  if (reportCount === 0) {
    const docs = buildSeedReports(Date.now())
    await Report.insertMany(docs)
    console.log(`✓ Reseeded ${docs.length} demo challenges into MongoDB`)
  } else {
    console.log(`✓ MongoDB already has ${reportCount} challenges`)
  }

  await mongoose.disconnect()
  console.log('✓ Seeding complete!')
  process.exit(0)
}

run().catch((err) => {
  console.error('✗ Seed failed:', err.message)
  console.error('  Is MongoDB running? Check MONGODB_URI in server/.env')
  process.exit(1)
})
