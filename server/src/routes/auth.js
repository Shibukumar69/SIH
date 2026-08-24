import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth, jwtSecret } from '../middleware/auth.js'

const router = Router()

// Institutional accounts. Credentials are demo-grade but REAL — a wrong email or
// password is rejected, so the authentication flow behaves like production.
// (In a real deployment these live in a users collection with hashed passwords.)
const ACCOUNTS = {
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

const publicAccount = (role) => {
  const { email, name, org } = ACCOUNTS[role]
  return { role, email, name, org }
}

// POST /api/auth/login  { role, email, password }
router.post('/login', (req, res) => {
  const { role, email, password } = req.body || {}
  const account = ACCOUNTS[role]
  if (!account) return res.status(400).json({ error: 'unknown_role' })
  // Email is optional (the role already scopes the account); password must match.
  if (email && String(email).trim().toLowerCase() !== account.email) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }
  if (password !== account.password) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }
  const token = jwt.sign({ role, name: account.name, org: account.org }, jwtSecret(), { expiresIn: process.env.JWT_EXPIRE || '12h' })
  res.json({ ...publicAccount(role), token, demo: false })
})

// GET /api/auth/me — validate a token and return the session (used on app load).
router.get('/me', requireAuth, (req, res) => {
  const role = req.user.role
  if (!ACCOUNTS[role]) return res.status(401).json({ error: 'unknown_role' })
  res.json({ ...publicAccount(role), demo: false })
})

export default router
