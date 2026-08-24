// Thematic domains from the problem statement, presented as big visual cards.
// `keywords` (English + Hindi + common Hinglish) drive the on-device auto-classifier.
export const CATEGORIES = [
  {
    key: 'water',
    emoji: '💧',
    en: 'Water',
    hi: 'पानी',
    color: 'sky',
    hex: '#0ea5e9',
    keywords: ['water', 'drinking water', 'pani', 'paani', 'tap', 'well', 'handpump', 'hand pump', 'tank', 'pipe', 'bore', 'borewell', 'nal', 'kua', 'kuan', 'jal', 'नल', 'पानी', 'कुआ', 'जल', 'हैंडपंप', 'बोरवेल', 'पेयजल', 'नदी', 'तालाब'],
    domain: 'Water Resources',
  },
  {
    key: 'agriculture',
    emoji: '🌾',
    en: 'Agriculture',
    hi: 'कृषि',
    color: 'green',
    hex: '#16a34a',
    keywords: ['agriculture', 'farm', 'farming', 'crop', 'kheti', 'fasal', 'khet', 'seed', 'fertilizer', 'irrigation', 'soil', 'harvest', 'kisan', 'खेती', 'फसल', 'खेत', 'बीज', 'खाद', 'सिंचाई', 'किसान', 'मिट्टी', 'कृषि'],
    domain: 'Agriculture',
  },
  {
    key: 'healthcare',
    emoji: '🏥',
    en: 'Healthcare',
    hi: 'स्वास्थ्य',
    color: 'rose',
    hex: '#e11d48',
    keywords: ['health', 'hospital', 'clinic', 'doctor', 'medicine', 'dawai', 'aspatal', 'bimari', 'illness', 'phc', 'anm', 'asha', 'ambulance', 'bukhar', 'स्वास्थ्य', 'अस्पताल', 'डॉक्टर', 'दवाई', 'बीमारी', 'बुखार', 'एम्बुलेंस', 'इलाज', 'टीका'],
    domain: 'Healthcare',
  },
  {
    key: 'education',
    emoji: '🎓',
    en: 'Education',
    hi: 'शिक्षा',
    color: 'indigo',
    hex: '#6366f1',
    keywords: ['school', 'education', 'teacher', 'student', 'padhai', 'skool', 'vidyalaya', 'class', 'college', 'book', 'shiksha', 'master', 'स्कूल', 'शिक्षा', 'शिक्षक', 'पढ़ाई', 'विद्यालय', 'कॉलेज', 'किताब', 'छात्र', 'अध्यापक'],
    domain: 'Education',
  },
  {
    key: 'roads',
    emoji: '🛣️',
    en: 'Roads',
    hi: 'सड़क',
    color: 'amber',
    hex: '#d97706',
    keywords: ['road', 'sadak', 'pothole', 'street', 'bridge', 'pul', 'gaddha', 'rasta', 'highway', 'path', 'सड़क', 'गड्ढा', 'रास्ता', 'पुल', 'गली', 'मार्ग', 'खराब सड़क'],
    domain: 'Urban Infrastructure',
  },
  {
    key: 'sanitation',
    emoji: '🗑️',
    en: 'Sanitation',
    hi: 'सफाई',
    color: 'teal',
    hex: '#0d9488',
    keywords: ['garbage', 'waste', 'toilet', 'sanitation', 'kachra', 'safai', 'gandagi', 'drain', 'sewage', 'nali', 'shauchalay', 'कचरा', 'सफाई', 'गंदगी', 'शौचालय', 'नाली', 'कूड़ा', 'सीवर'],
    domain: 'Sanitation',
  },
  {
    key: 'electricity',
    emoji: '💡',
    en: 'Electricity',
    hi: 'बिजली',
    color: 'yellow',
    hex: '#eab308',
    keywords: ['electricity', 'power', 'bijli', 'light', 'current', 'transformer', 'pole', 'wire', 'load shedding', 'बिजली', 'लाइट', 'करंट', 'ट्रांसफार्मर', 'खंभा', 'तार', 'बिजली कटौती'],
    domain: 'Energy',
  },
  {
    key: 'transport',
    emoji: '🚍',
    en: 'Transport',
    hi: 'परिवहन',
    color: 'violet',
    hex: '#7c3aed',
    keywords: ['bus', 'transport', 'auto', 'rickshaw', 'connectivity', 'gadi', 'vehicle', 'station', 'bus stop', 'परिवहन', 'बस', 'ऑटो', 'रिक्शा', 'गाड़ी', 'बस स्टॉप', 'आवागमन'],
    domain: 'Urban Development',
  },
  {
    key: 'environment',
    emoji: '♻️',
    en: 'Environment',
    hi: 'पर्यावरण',
    color: 'emerald',
    hex: '#059669',
    keywords: ['environment', 'pollution', 'tree', 'forest', 'jungle', 'ped', 'paryavaran', 'pradushan', 'air', 'plastic', 'flood', 'baadh', 'landslide', 'पर्यावरण', 'प्रदूषण', 'पेड़', 'जंगल', 'बाढ़', 'प्लास्टिक', 'भूस्खलन'],
    domain: 'Environment',
  },
  {
    key: 'livelihood',
    emoji: '💼',
    en: 'Livelihood',
    hi: 'रोज़गार',
    color: 'orange',
    hex: '#ea580c',
    keywords: ['job', 'employment', 'livelihood', 'rozgar', 'work', 'kaam', 'income', 'shg', 'self help', 'training', 'skill', 'mgnrega', 'रोज़गार', 'नौकरी', 'काम', 'आय', 'स्वयं सहायता', 'प्रशिक्षण', 'मनरेगा', 'कौशल'],
    domain: 'Rural Livelihoods',
  },
  {
    key: 'other',
    emoji: '➕',
    en: 'Other',
    hi: 'अन्य',
    color: 'slate',
    hex: '#64748b',
    keywords: [],
    domain: 'Public Administration',
  },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

export function getCategory(key) {
  return CATEGORY_MAP[key] || CATEGORY_MAP.other
}

// Tailwind class sets per category color (kept explicit so Tailwind's JIT keeps them).
export const CATEGORY_STYLES = {
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', solid: 'bg-sky-500', chip: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200', solid: 'bg-green-500', chip: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', solid: 'bg-rose-500', chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', solid: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', solid: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', solid: 'bg-teal-500', chip: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200', solid: 'bg-yellow-400', chip: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', solid: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', solid: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', solid: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', solid: 'bg-slate-500', chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
}

export function categoryStyle(key) {
  return CATEGORY_STYLES[getCategory(key).color] || CATEGORY_STYLES.slate
}
