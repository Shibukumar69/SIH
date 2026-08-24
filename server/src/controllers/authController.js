import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { dbReady } from '../db.js'
import { jwtSecret } from '../middleware/auth.js'

// Pre-configured demo accounts for instant testing
export const DEMO_ACCOUNTS = {
  citizen: {
    email: 'citizen@jharkhand.gov.in',
    password: 'demo1234',
    name: 'Rahul Sharma',
    org: 'Ranchi Citizen',
  },
  government: {
    email: 'government@jharkhand.gov.in',
    password: 'demo1234',
    name: 'Dept. of Higher & Technical Education',
    org: 'Government of Jharkhand',
  },
  university: {
    email: 'university@bitmesra.ac.in',
    password: 'demo1234',
    name: 'BIT Mesra',
    org: 'Innovation & Incubation Centre',
  },
  industry: {
    email: 'industry@tatasteel.com',
    password: 'demo1234',
    name: 'Tata Steel Foundation',
    org: 'CSR & Innovation',
  },
}

// In-memory fallback for registered users when DB is unavailable
const memoryUsers = []

/**
 * Register a new user (Citizen, Government, University, Industry)
 * POST /api/auth/register
 */
export async function registerUser(req, res) {
  try {
    const { role = 'citizen', name, email, password, phone = '', org = '' } = req.body || {}
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'missing_fields', message: 'Name, email and password are required' })
    }

    const cleanEmail = String(email).trim().toLowerCase()

    // 1. If MongoDB is ready, save to DB
    if (dbReady()) {
      const existing = await User.findOne({ email: cleanEmail })
      if (existing) {
        return res.status(400).json({ error: 'email_exists', message: 'Email is already registered' })
      }
      const user = await User.create({
        role,
        name: String(name).trim(),
        email: cleanEmail,
        password: String(password),
        phone: String(phone).trim(),
        org: String(org).trim() || (role === 'citizen' ? 'Citizen' : ''),
      })
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name, email: user.email, org: user.org },
        jwtSecret(),
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      )
      return res.json({ role: user.role, name: user.name, email: user.email, phone: user.phone, org: user.org, token, demo: false })
    }

    // 2. Memory store fallback
    const existingMem = memoryUsers.find((u) => u.email === cleanEmail)
    if (existingMem) {
      return res.status(400).json({ error: 'email_exists', message: 'Email is already registered' })
    }

    const newUser = {
      role,
      name: String(name).trim(),
      email: cleanEmail,
      password: String(password),
      phone: String(phone).trim(),
      org: String(org).trim() || (role === 'citizen' ? 'Citizen' : ''),
    }
    memoryUsers.push(newUser)

    const token = jwt.sign(
      { role: newUser.role, name: newUser.name, email: newUser.email, org: newUser.org },
      jwtSecret(),
      { expiresIn: '30d' }
    )
    return res.json({ role: newUser.role, name: newUser.name, email: newUser.email, phone: newUser.phone, org: newUser.org, token, demo: false })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * Sign in existing user or demo account
 * POST /api/auth/login
 */
export async function loginUser(req, res) {
  try {
    const { role, email, password } = req.body || {}
    const cleanEmail = email ? String(email).trim().toLowerCase() : ''
    const userRole = role || 'citizen'

    // 1. Check demo accounts first
    const account = DEMO_ACCOUNTS[userRole]
    if (account && cleanEmail === account.email && password === account.password) {
      const token = jwt.sign(
        { role: userRole, name: account.name, email: account.email, org: account.org },
        jwtSecret(),
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      )
      return res.json({ role: userRole, email: account.email, name: account.name, org: account.org, token, demo: true })
    }

    // 2. Check registered DB users
    if (dbReady()) {
      const user = await User.findOne({ email: cleanEmail })
      if (user && user.password === String(password)) {
        const token = jwt.sign(
          { id: user._id, role: user.role, name: user.name, email: user.email, org: user.org },
          jwtSecret(),
          { expiresIn: process.env.JWT_EXPIRE || '30d' }
        )
        return res.json({ role: user.role, email: user.email, name: user.name, phone: user.phone, org: user.org, token, demo: false })
      }
    }

    // 3. Check memory registered users
    const memUser = memoryUsers.find((u) => u.email === cleanEmail && u.password === String(password))
    if (memUser) {
      const token = jwt.sign(
        { role: memUser.role, name: memUser.name, email: memUser.email, org: memUser.org },
        jwtSecret(),
        { expiresIn: '30d' }
      )
      return res.json({ role: memUser.role, email: memUser.email, name: memUser.name, phone: memUser.phone, org: memUser.org, token, demo: false })
    }

    // 4. Custom credentials fallback
    if (cleanEmail && password) {
      const defaultName = cleanEmail.split('@')[0]
      const token = jwt.sign(
        { role: userRole, name: defaultName, email: cleanEmail },
        jwtSecret(),
        { expiresIn: '30d' }
      )
      return res.json({ role: userRole, email: cleanEmail, name: defaultName, token, demo: false })
    }

    return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * Get current authenticated user details
 * GET /api/auth/me
 */
export function getCurrentUser(req, res) {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  return res.json({ role: user.role, email: user.email, name: user.name, org: user.org, demo: false })
}
