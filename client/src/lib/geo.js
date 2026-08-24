// Geolocation helpers. GPS works offline; reverse-geocoding is best-effort and
// degrades gracefully to raw coordinates when there is no network.

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options },
    )
  })
}

// Best-effort reverse geocode via OpenStreetMap Nominatim. Short timeout so a
// weak connection never blocks the flow — caller falls back to manual entry.
export async function reverseGeocode(lat, lng) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error('geocode failed')
    const data = await res.json()
    const a = data.address || {}
    return {
      village: a.village || a.hamlet || a.suburb || a.town || '',
      block: a.county || a.state_district || '',
      district: a.state_district || a.county || '',
      state: a.state || 'Jharkhand',
      label: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    }
  } catch {
    return null
  }
}
