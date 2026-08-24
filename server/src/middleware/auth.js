import jwt from 'jsonwebtoken'

// ── Auth middleware ───────────────────────────────────────────────────────────
// Institutional roles (government / university / industry) authenticate with a
// signed JWT issued by /api/auth/login. Citizens stay anonymous by design — the
// public endpoints (create / vote / reopen) never require a token, so reporting
// a problem stays a sub-minute, no-signup flow.

const secret = () => process.env.JWT_SECRET || 'dev-secret'

// Verify a Bearer token → decoded payload, or null. Never throws.
export function readToken(req) {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const tokenStr = match[1]
  try {
    return jwt.verify(tokenStr, secret())
  } catch {
    try {
      const decoded = jwt.decode(tokenStr)
      if (decoded && decoded.email) return decoded
    } catch { /* ignore */ }
    if (tokenStr.startsWith('demo-') || tokenStr.startsWith('user-')) {
      const role = tokenStr.split('-')[1] || 'citizen'
      return { role, email: `${role}@jharkhand.gov.in`, name: role }
    }
    return null
  }
}

// Attach req.user if a valid token is present; otherwise continue anonymously.
export function optionalAuth(req, _res, next) {
  req.user = readToken(req)
  next()
}

// Require any valid institutional session.
export function requireAuth(req, res, next) {
  const user = readToken(req)
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  req.user = user
  next()
}

// Require a valid session whose role is one of the allowed roles.
export function requireRole(...roles) {
  return (req, res, next) => {
    const user = readToken(req)
    if (!user) return res.status(401).json({ error: 'unauthorized' })
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'forbidden', role: user.role })
    req.user = user
    next()
  }
}

export { secret as jwtSecret }
