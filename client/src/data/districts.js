// Jharkhand's districts with approximate positions on a stylised map
// (x/y are percentages, west→east and north→south). Used by the Challenge Map
// and by the manual-location district picker.
export const JHARKHAND_DISTRICTS = [
  { name: 'Garhwa', hi: 'गढ़वा', x: 16, y: 34 },
  { name: 'Palamu', hi: 'पलामू', x: 25, y: 34 },
  { name: 'Latehar', hi: 'लातेहार', x: 31, y: 42 },
  { name: 'Chatra', hi: 'चतरा', x: 41, y: 29 },
  { name: 'Koderma', hi: 'कोडरमा', x: 53, y: 22 },
  { name: 'Hazaribagh', hi: 'हज़ारीबाग', x: 48, y: 36 },
  { name: 'Giridih', hi: 'गिरिडीह', x: 61, y: 30 },
  { name: 'Ramgarh', hi: 'रामगढ़', x: 46, y: 46 },
  { name: 'Ranchi', hi: 'राँची', x: 41, y: 53 },
  { name: 'Lohardaga', hi: 'लोहरदगा', x: 33, y: 51 },
  { name: 'Gumla', hi: 'गुमला', x: 29, y: 59 },
  { name: 'Simdega', hi: 'सिमडेगा', x: 30, y: 71 },
  { name: 'Khunti', hi: 'खूँटी', x: 40, y: 63 },
  { name: 'West Singhbhum', hi: 'पश्चिमी सिंहभूम', x: 42, y: 76 },
  { name: 'Seraikela-Kharsawan', hi: 'सरायकेला-खरसावाँ', x: 52, y: 70 },
  { name: 'East Singhbhum', hi: 'पूर्वी सिंहभूम', x: 59, y: 75 },
  { name: 'Bokaro', hi: 'बोकारो', x: 56, y: 45 },
  { name: 'Dhanbad', hi: 'धनबाद', x: 67, y: 43 },
  { name: 'Jamtara', hi: 'जामताड़ा', x: 73, y: 41 },
  { name: 'Deoghar', hi: 'देवघर', x: 73, y: 31 },
  { name: 'Dumka', hi: 'दुमका', x: 81, y: 37 },
  { name: 'Godda', hi: 'गोड्डा', x: 85, y: 27 },
  { name: 'Sahibganj', hi: 'साहिबगंज', x: 91, y: 22 },
  { name: 'Pakur', hi: 'पाकुड़', x: 89, y: 35 },
]

export const DISTRICT_NAMES = JHARKHAND_DISTRICTS.map((d) => d.name)

// A few sample villages/blocks per district to power the location search demo.
export const SAMPLE_LOCATIONS = [
  { village: 'Nagri', block: 'Kanke', district: 'Ranchi' },
  { village: 'Ormanjhi', block: 'Ormanjhi', district: 'Ranchi' },
  { village: 'Bundu', block: 'Bundu', district: 'Ranchi' },
  { village: 'Chandankiyari', block: 'Chandankiyari', district: 'Bokaro' },
  { village: 'Baliapur', block: 'Baliapur', district: 'Dhanbad' },
  { village: 'Nirsa', block: 'Nirsa', district: 'Dhanbad' },
  { village: 'Barhi', block: 'Barhi', district: 'Hazaribagh' },
  { village: 'Ichak', block: 'Ichak', district: 'Hazaribagh' },
  { village: 'Madhupur', block: 'Madhupur', district: 'Deoghar' },
  { village: 'Jarmundi', block: 'Jarmundi', district: 'Dumka' },
  { village: 'Torpa', block: 'Torpa', district: 'Khunti' },
  { village: 'Bishunpur', block: 'Bishunpur', district: 'Gumla' },
  { village: 'Chakradharpur', block: 'Chakradharpur', district: 'West Singhbhum' },
  { village: 'Ghatshila', block: 'Ghatshila', district: 'East Singhbhum' },
  { village: 'Manatu', block: 'Manatu', district: 'Palamu' },
  { village: 'Bhawnathpur', block: 'Bhawnathpur', district: 'Garhwa' },
  { village: 'Rajmahal', block: 'Rajmahal', district: 'Sahibganj' },
  { village: 'Nala', block: 'Nala', district: 'Jamtara' },
]

export function districtByName(name) {
  return JHARKHAND_DISTRICTS.find((d) => d.name === name)
}
