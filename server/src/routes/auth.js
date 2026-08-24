import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

// Institutional demo accounts — mirror client AuthContext.DEMO_ACCOUNTS.
const ACCOUNTS = {
  government: { name: 'Dept. of Higher & Technical Education', org: 'Government of Jharkhand' },
  university: { name: 'BIT Mesra', org: 'Innovation & Incubation Centre' },
  industry: { name: 'Tata Steel Foundation', org: 'CSR & Innovation' },
}

// POST /api/auth/login  { role, email?, password? }
// Demo-grade: any credentials for a known role succeed and get a signed token.
router.post('/login', (req, res) => {
  const { role } = req.body || {}
  const account = ACCOUNTS[role]
  if (!account) return res.status(400).json({ error: 'unknown_role' })
  const secret = process.env.JWT_SECRET || 'dev-secret'
  const token = jwt.sign({ role, name: account.name }, secret, { expiresIn: '12h' })
  res.json({ role, ...account, token, demo: false })
})

export default router
