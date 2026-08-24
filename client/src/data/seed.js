import { STATUS_ORDER, statusIndex } from '../lib/status.js'

// ── Demo seed data ───────────────────────────────────────────────────────────
// Populates the app so every screen looks alive on first run and during the
// demo, even with no backend. The server seed (server/src/seed.js) mirrors this.

const DAY = 24 * 60 * 60 * 1000

const UNIVERSITIES = {
  bit: 'BIT Mesra',
  nit: 'NIT Jamshedpur',
  cuj: 'Central University of Jharkhand',
  rnc: 'Ranchi University',
  xiss: 'XISS Ranchi',
}
const INDUSTRIES = {
  tata: 'Tata Steel Foundation',
  jusco: 'JUSCO',
  startup: 'KrishiTech (Startup)',
  csr: 'CCL CSR',
}

// [category, title, description, village, district, status, priority, votes, daysAgo, needs, university, industry]
const RAW = [
  ['water', 'No drinking water for 15 days', 'Hamare gaon mein pichle 15 din se pine ka paani nahi aa raha hai. Handpump kharab ho gaya hai.', 'Nagri', 'Ranchi', 'collaboration', 'critical', 347, 24, ['Water Management', 'IoT', 'Civil Engineering'], 'bit', 'tata'],
  ['water', 'Handpump broken near school', 'The only handpump near the primary school has been broken for a month. Children have no clean water.', 'Torpa', 'Khunti', 'matching', 'high', 128, 12, ['Water Management', 'Mechanical'], 'nit', null],
  ['roads', 'Road damaged after monsoon', 'Main village road is full of potholes after the rains. Autos refuse to come here.', 'Ormanjhi', 'Ranchi', 'gov_review', 'high', 87, 6, ['Civil Engineering', 'Materials'], null, null],
  ['healthcare', 'No ambulance access to village', 'Our village has no motorable road for ambulances. A pregnant woman had to be carried on a cot.', 'Bishunpur', 'Gumla', 'solution', 'critical', 213, 30, ['Public Health', 'Logistics', 'GIS'], 'cuj', 'tata'],
  ['agriculture', 'Crops failing due to poor irrigation', 'Farmers here depend on rain. A smart irrigation system could double our yield.', 'Chandankiyari', 'Bokaro', 'pilot', 'high', 156, 45, ['Agri-Tech', 'IoT', 'Data Science'], 'bit', 'startup'],
  ['electricity', 'Frequent power cuts at night', 'Bijli har raat 4-5 ghante chali jaati hai. Bachche padh nahi paate.', 'Baliapur', 'Dhanbad', 'verified', 'medium', 94, 8, ['Electrical', 'Renewable Energy'], null, null],
  ['sanitation', 'Garbage piling up in market area', 'Kachra market ke paas jama ho raha hai, bimari failne ka dar hai.', 'Nirsa', 'Dhanbad', 'submitted', 'medium', 41, 3, ['Waste Management', 'Environmental'], null, null],
  ['education', 'Village school has no computers', 'Our high school has 300 students but not a single working computer for the digital curriculum.', 'Barhi', 'Hazaribagh', 'matching', 'medium', 76, 15, ['EdTech', 'Computer Science'], 'xiss', null],
  ['agriculture', 'No cold storage for vegetables', 'Farmers lose 30% of produce as there is no cold storage nearby. We sell at throwaway prices.', 'Ichak', 'Hazaribagh', 'collaboration', 'high', 189, 38, ['Agri-Tech', 'Supply Chain', 'Refrigeration'], 'nit', 'startup'],
  ['environment', 'River polluted by waste dumping', 'The stream that we use is being polluted by waste. Fish are dying and water smells.', 'Ghatshila', 'East Singhbhum', 'gov_review', 'high', 132, 20, ['Environmental', 'Chemistry'], null, null],
  ['water', 'Village pond dried up', 'Our main pond used to serve cattle and irrigation, now it dries by March.', 'Manatu', 'Palamu', 'verified', 'medium', 63, 10, ['Water Management', 'Hydrology'], null, null],
  ['healthcare', 'PHC has no regular doctor', 'The primary health centre is open but a doctor visits only twice a week.', 'Madhupur', 'Deoghar', 'gov_review', 'high', 118, 18, ['Public Health', 'Telemedicine'], null, null],
  ['livelihood', 'Women SHG needs market linkage', 'Our self-help group makes handicrafts but has no way to sell beyond the village.', 'Jarmundi', 'Dumka', 'solution', 'medium', 88, 40, ['Marketing', 'E-commerce', 'Design'], 'xiss', 'csr'],
  ['roads', 'No bridge over seasonal river', 'Every monsoon our village is cut off for weeks because there is no bridge.', 'Chakradharpur', 'West Singhbhum', 'matching', 'critical', 267, 50, ['Civil Engineering', 'Structural'], 'nit', null],
  ['electricity', 'Solar streetlights not working', 'The solar streetlights installed 2 years ago have all stopped working.', 'Bundu', 'Ranchi', 'resolved', 'low', 54, 70, ['Renewable Energy', 'Electrical'], 'bit', 'jusco'],
  ['education', 'No internet for online classes', 'Students cannot attend online classes as there is no network coverage in our area.', 'Bhawnathpur', 'Garhwa', 'submitted', 'medium', 72, 4, ['Telecom', 'Networking'], null, null],
  ['sanitation', 'Open drains near homes', 'Open drains beside houses cause mosquitoes and disease every summer.', 'Rajmahal', 'Sahibganj', 'verified', 'medium', 47, 9, ['Civil Engineering', 'Public Health'], null, null],
  ['agriculture', 'Soil testing not available', 'Farmers apply fertilizer blindly. A local soil-testing solution would help greatly.', 'Nala', 'Jamtara', 'submitted', 'low', 33, 5, ['Agri-Tech', 'Chemistry'], null, null],
  ['transport', 'No bus service to block HQ', 'Villagers walk 8 km to reach the block headquarters as there is no bus.', 'Nagri', 'Ranchi', 'gov_review', 'medium', 61, 14, ['Transport Planning', 'GIS'], null, null],
  ['healthcare', 'High malaria cases every monsoon', 'Our area sees many malaria cases in monsoon. We need better prevention.', 'Chakradharpur', 'West Singhbhum', 'collaboration', 'high', 145, 33, ['Public Health', 'Data Science'], 'cuj', 'tata'],
  ['water', 'Fluoride in groundwater', 'Borewell water is causing tooth and bone problems, suspected fluoride contamination.', 'Manatu', 'Palamu', 'matching', 'critical', 198, 28, ['Water Management', 'Chemistry', 'Public Health'], 'bit', null],
  ['environment', 'Deforestation on village hill', 'Trees on our hill are being cut illegally, causing soil erosion and landslides.', 'Bishunpur', 'Gumla', 'submitted', 'high', 79, 7, ['Environmental', 'Forestry', 'GIS'], null, null],
]

function buildTimeline(status, createdAtMs) {
  const upto = statusIndex(status)
  const notes = {
    submitted: 'Report received from citizen',
    verified: 'Verified as a genuine community challenge',
    gov_review: 'Reviewed and prioritised by the department',
    matching: 'Routed to matching universities & industry partners',
    collaboration: 'Multidisciplinary team formed and collaborating',
    solution: 'Solution proposal submitted for approval',
    pilot: 'Pilot deployment started on the ground',
    resolved: 'Solution deployed — impact confirmed by citizens',
  }
  const timeline = []
  for (let i = 0; i <= upto; i++) {
    const key = STATUS_ORDER[i]
    const at = new Date(createdAtMs + i * 3.5 * DAY).toISOString()
    timeline.push({ status: key, at, note: notes[key] })
  }
  return timeline
}

export function buildSeedReports(nowMs) {
  const now = nowMs ?? Date.now()
  return RAW.map(([category, title, description, village, district, status, priority, votes, daysAgo, needs, uni, ind], i) => {
    const createdAtMs = now - daysAgo * DAY
    const timeline = buildTimeline(status, createdAtMs)
    return {
      id: `SS-${20100 + i * 37}`,
      category,
      title,
      description,
      photos: [],
      location: {
        method: 'manual',
        village,
        block: village,
        district,
        state: 'Jharkhand',
        label: `${village}, ${district}, Jharkhand`,
        lat: null,
        lng: null,
      },
      status,
      priority,
      votes,
      ai: { category, confidence: 80 + ((i * 7) % 18) },
      reporter: { anonymous: true },
      needs: needs || [],
      assignedUniversity: uni ? UNIVERSITIES[uni] : null,
      assignedIndustry: ind ? INDUSTRIES[ind] : null,
      createdAt: new Date(createdAtMs).toISOString(),
      updatedAt: timeline[timeline.length - 1]?.at || new Date(createdAtMs).toISOString(),
      timeline,
      seeded: true,
    }
  })
}

export { UNIVERSITIES, INDUSTRIES }
