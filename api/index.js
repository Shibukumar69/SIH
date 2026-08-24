import app from '../server/src/app.js'
import { connectDB } from '../server/src/db.js'

const DEFAULT_MONGO_URI = 'mongodb+srv://SIH26043:SIH26043@sih26043.almbgn9.mongodb.net/jansamadhan_db?retryWrites=true&w=majority'

export default async function handler(req, res) {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_MONGO_URI
  try {
    await connectDB(uri)
  } catch (err) {
    console.warn('MongoDB connection error in serverless handler:', err.message)
  }
  return app(req, res)
}
