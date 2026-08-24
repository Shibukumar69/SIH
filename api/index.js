import app from '../server/src/app.js'
import { connectDB } from '../server/src/db.js'

export default async function handler(req, res) {
  const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI
  if (MONGODB_URI) {
    try {
      await connectDB(MONGODB_URI)
    } catch (err) {
      console.warn('MongoDB connection error in serverless handler:', err.message)
    }
  }
  return app(req, res)
}
