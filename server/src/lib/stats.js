// Filtering + sorting, identical semantics to the client's api.applyQuery.
export function applyQuery(reports, { category, district, status, sort } = {}) {
  let out = [...reports]
  if (category && category !== 'all') out = out.filter((r) => r.category === category)
  if (district && district !== 'all') out = out.filter((r) => r.location?.district === district)
  if (status && status !== 'all') out = out.filter((r) => r.status === status)
  if (sort === 'top') out.sort((a, b) => (b.votes || 0) - (a.votes || 0))
  else out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return out
}

// Aggregate stats — mirrors client computeStats.
export function computeStats(reports) {
  const byStatus = {}, byCategory = {}, byDistrict = {}
  let totalVotes = 0
  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1
    byCategory[r.category] = (byCategory[r.category] || 0) + 1
    const d = r.location?.district || 'Unknown'
    byDistrict[d] = (byDistrict[d] || 0) + 1
    totalVotes += r.votes || 0
  }
  const resolved = byStatus.resolved || 0
  const total = reports.length
  const collaboration = (byStatus.collaboration || 0) + (byStatus.solution || 0) + (byStatus.pilot || 0)
  const pending = byStatus.submitted || 0
  const highPriority = reports.filter((r) => r.priority === 'high' || r.priority === 'critical').length
  const solutions = (byStatus.solution || 0) + (byStatus.pilot || 0) + resolved
  return {
    total, pending, highPriority, collaboration, solutions, resolved, totalVotes,
    byStatus, byCategory, byDistrict,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
  }
}
