import { Router } from 'express'
import { requireRole, optionalAuth } from '../middleware/auth.js'
import {
  listReports,
  checkSimilar,
  getReportById,
  createReport,
  voteReport,
  reopenReport,
  updateReportStatus,
  getStats,
} from '../controllers/reportController.js'

const router = Router()

// GET /api/reports - List reports with filters
router.get('/', optionalAuth, listReports)

// POST /api/reports/similar - AI duplicate detection check
router.post('/similar', checkSimilar)

// GET /api/reports/:id - Get report details by ID
router.get('/:id', getReportById)

// POST /api/reports - Submit a new report
router.post('/', optionalAuth, createReport)

// POST /api/reports/:id/vote - Support / vote on a report
router.post('/:id/vote', voteReport)

// POST /api/reports/:id/reopen - Reopen an unresolved report
router.post('/:id/reopen', reopenReport)

// PATCH /api/reports/:id - Update report status / priority / assignment (institutional user only)
router.patch('/:id', requireRole('government', 'university', 'industry'), updateReportStatus)

export default router

// Stats handler exported for GET /api/stats
export const statsHandler = getStats
