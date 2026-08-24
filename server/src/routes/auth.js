import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js'

const router = Router()

// POST /api/auth/register - Register a new user
router.post('/register', registerUser)

// POST /api/auth/login - Sign in user or demo account
router.post('/login', loginUser)

// GET /api/auth/me - Get current session
router.get('/me', requireAuth, getCurrentUser)

export default router
